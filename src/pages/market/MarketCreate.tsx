// src/pages/market/MarketCreate.tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '@/firebase';
import { addDoc, collection, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import CaptureSheet from '@/pages/capture/CaptureSheet';
import AdvancedImageUpload from '@/components/upload/AdvancedImageUpload';
import LocationPicker from '@/components/LocationPicker';
import { getUid, LoginRequiredUI } from '@/lib/auth';
import { createProduct } from '@/services/productService';
import { analyzeProductImage } from '@/services/aiService';

// 환경변수 체크
const USE_STORAGE = false; // 강제로 false로 설정 (환경변수 문제 우회)
console.log("[MARKET_CREATE] USE_STORAGE:", USE_STORAGE);

// 상품 카테고리 정의
const CATEGORIES = [
  '축구화', '유니폼', '보호장비', '볼/장비', '트레이닝', '기타'
] as const;

// 지역 정의
const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
] as const;

export default function MarketCreate() {
  const navigate = useNavigate();
  const advancedUploadRef = useRef<{ handleCameraCapture: (dataUrl: string) => void }>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<string>('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>(CATEGORIES[0]);
  const [region, setRegion] = useState<typeof REGIONS[number]>(REGIONS[0]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    category?: string;
    tags?: string[];
    attributes?: {
      brand?: string | null;
      color?: string | null;
      material?: string | null;
      condition?: "A" | "B" | "C" | null;
    };
    summary?: string;
  } | null>(null);
  const [aiApplied, setAiApplied] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [coord, setCoord] = useState<{lat?:number; lng?:number; regionText?:string}>({});

  // 파일을 base64로 변환하는 헬퍼 함수
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // 로그인 상태 확인
  const uid = getUid();
  if (!uid) {
    return <LoginRequiredUI message="상품 등록을 위해 로그인이 필요합니다." />;
  }

  // 이미지 미리보기는 files 배열을 직접 사용

  // 이미지 제거 (AdvancedImageUpload에서 관리하지만 필요시 사용)
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // AI 분석 결과를 폼에 적용하는 useEffect
  useEffect(() => {
    if (aiApplied && aiAnalysis) {
      console.log("[AI] 분석 결과를 폼에 적용:", aiAnalysis);
      
      // 카테고리 적용
      if (aiAnalysis.category) {
        setCategory(aiAnalysis.category as typeof CATEGORIES[number]);
      }
      
      // 설명 적용 (기존 내용이 있으면 유지, 없으면 AI 요약 사용)
      if (aiAnalysis.summary) {
        setDesc(prev => {
          const currentDesc = prev?.trim() || '';
          if (currentDesc) {
            // 기존 내용이 있으면 태그만 추가
            const tagText = aiAnalysis.tags?.join(', ') || '';
            if (tagText && !currentDesc.includes(tagText)) {
              return `${currentDesc}\n\n🏷️ AI 태그: ${tagText}`;
            }
            return currentDesc;
          } else {
            // 기존 내용이 없으면 AI 요약 + 태그
            const tagText = aiAnalysis.tags?.join(', ') || '';
            return tagText ? `${aiAnalysis.summary}\n\n🏷️ AI 태그: ${tagText}` : (aiAnalysis.summary || '');
          }
        });
      }
      
      // 브랜드명을 제목에 추가 (기존 제목이 없을 때만)
      const brand = aiAnalysis.attributes?.brand;
      if (brand && !title?.trim()) {
        setTitle(brand);
      }
      
      // 새로운 카테고리 발견 시 로그
      if (aiAnalysis.category && !CATEGORIES.includes(aiAnalysis.category as any)) {
        console.log("[AI] 새로운 카테고리 발견:", aiAnalysis.category);
      }
    }
  }, [aiApplied, aiAnalysis, title]);



  // 폼 제출 처리
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !desc.trim() || files.length === 0) {
      alert('제목, 설명, 이미지를 모두 입력해주세요.');
      return;
    }

    // const uid = auth.currentUser?.uid; // 이제 getUid()로 대체
    if (!uid) {
      alert('로그인이 필요합니다.');
      return;
    }

    setBusy(true);
    try {
      // 위치 정보는 이미 설정된 geo 상태 사용
      console.log('위치 정보:', coord);

      // 이미지는 이미 AdvancedImageUpload에서 전처리됨
      console.log('이미지 업로드 시작...');
      const processed = files; // 이미 전처리된 파일들
      console.log('이미지 업로드 준비 완료:', processed.length, '개');

      // 이미지 업로드
      const urls: string[] = [];
      if (USE_STORAGE && processed.length > 0) {
        console.log('[MARKET_CREATE] Uploading images to storage...');
        try {
          for (const file of processed) {
            console.log('[MARKET_CREATE] Uploading file:', file.name, 'size:', file.size);
            const storageRef = ref(storage, `products/${uid}/${Date.now()}-${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            
            // 타임아웃 설정 (30초)
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000);
            });
            
            const uploadPromise = new Promise<void>((resolve, reject) => {
              uploadTask.on('state_changed',
                (snapshot) => {
                  const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                  console.log('[MARKET_CREATE] Upload progress for', file.name, ':', progress.toFixed(1) + '%');
                  setProgress(prev => ({ ...prev, [file.name]: progress }));
                },
                (error) => {
                  console.error('[MARKET_CREATE] Upload error for', file.name, ':', error);
                  reject(error);
                },
                async () => {
                  try {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log('[MARKET_CREATE] Upload completed for', file.name, 'URL:', url);
                    urls.push(url);
                    resolve();
                  } catch (error) {
                    console.error('[MARKET_CREATE] Failed to get download URL for', file.name, ':', error);
                    reject(error);
                  }
                }
              );
            });
            
            // 타임아웃과 업로드 경쟁
            await Promise.race([uploadPromise, timeoutPromise]);
          }
          console.log('[MARKET_CREATE] All images uploaded successfully:', urls.length, 'files');
        } catch (uploadError: any) {
          console.error('[MARKET_CREATE] Image upload failed:', uploadError);
          alert('이미지 업로드에 실패했습니다: ' + uploadError.message);
          setBusy(false);
          return;
        }
      } else {
        console.log('[MARKET_CREATE] Skipping image upload (USE_STORAGE:', USE_STORAGE, ')');
        // Storage가 비활성화된 경우 이미지를 base64로 변환하여 저장
        try {
          console.log('[MARKET_CREATE] Converting images to base64...');
          for (const file of processed) {
            const base64 = await fileToBase64(file);
            urls.push(base64);
            console.log('[MARKET_CREATE] Converted to base64:', file.name, 'size:', base64.length);
          }
          console.log('[MARKET_CREATE] All images converted to base64:', urls.length, 'files');
        } catch (conversionError: any) {
          console.error('[MARKET_CREATE] Image conversion failed:', conversionError);
          alert('이미지 변환에 실패했습니다: ' + conversionError.message);
          setBusy(false);
          return;
        }
      }

             // 새로운 위치 서비스로 상품 등록 (위치 + 행정동 자동 저장)
       const docRef = await createProduct({
         title: title.trim(),
         price: price ? Number(price) : 0,
         description: desc.trim(),
         images: urls,
         lat: coord.lat,
         lng: coord.lng,
         regionText: coord.regionText
       });
      console.log('상품 등록 완료, 문서 ID:', docRef);

      // AI 분석 결과를 Firestore에 저장 (재활용/검색 품질 개선용)
      if (aiAnalysis && aiApplied) {
        try {
          await setDoc(doc(db, 'products', docRef), {
            ai: {
              category: aiAnalysis.category,
              tags: aiAnalysis.tags,
              attributes: aiAnalysis.attributes,
              summary: aiAnalysis.summary,
              analyzedAt: new Date().toISOString(),
              applied: true
            }
          }, { merge: true });
          console.log('[AI] 분석 결과 Firestore 저장 완료');
        } catch (aiSaveError) {
          console.warn('[AI] 분석 결과 저장 실패 (무시):', aiSaveError);
        }
      }

      // 업로드 끝나고 docRef 얻은 뒤: AI 분석 호출
      try {
        console.log('AI 분석 시작...');
        const resp = await fetch('http://localhost:5001/jaeman-vibe-platform/us-central1/analyzeProduct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: urls, hint: title })
        });
        
        const j = await resp.json();
        if (j.ok) {
          console.log('AI 분석 성공:', j.provider, j.result);
          
          // AI 분석 결과를 products 컬렉션에 병합
          await setDoc(doc(db, 'products', docRef), {
            ai: j.result
          }, { merge: true });
          
          console.log('AI 분석 결과 문서 병합 완료');
        } else {
          console.warn('AI 분석 응답 오류:', j.error);
        }
      } catch (e) {
        console.warn('AI 분석 실패(무시)', e);
      }

      alert('등록 완료!');
      navigate(`/market/${docRef}`);
    } catch (err: any) {
      console.error('상품 등록 실패:', err);
      alert('상품 등록에 실패했습니다: ' + err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 820, margin: '24px auto', padding: 16 }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>상품 등록</h2>
      
      {/* 제목 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>제목 *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid #ddd',
            borderRadius: 8,
            fontSize: 16
          }}
          placeholder="상품명을 입력하세요"
          required
        />
      </div>

      {/* 가격 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>가격</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid #ddd',
            borderRadius: 8,
            fontSize: 16
          }}
          placeholder="가격을 입력하세요 (선택사항)"
        />
      </div>

      {/* 카테고리 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>카테고리</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid #ddd',
            borderRadius: 8,
            fontSize: 16
          }}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* 지역 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>지역</label>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as typeof REGIONS[number])}
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid #ddd',
            borderRadius: 8,
            fontSize: 16
          }}
                 >
           {REGIONS.map(reg => (
             <option key={reg} value={reg}>{reg}</option>
           ))}
         </select>
      </div>

             {/* 위치 정보 */}
       <div style={{ marginBottom: 16 }}>
         <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>📍 위치 정보</h4>
         <LocationPicker onPicked={(p) => setCoord(p)} />
         {coord.lat && coord.lng && (
           <div style={{ 
             marginTop: 8, 
             padding: 8, 
             backgroundColor: '#f0f8ff', 
             borderRadius: 6, 
             fontSize: 14,
             color: '#0066cc'
           }}>
             ✅ 위치 설정됨: {coord.regionText || `${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)}`}
           </div>
         )}
       </div>

      {/* 설명 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>설명 *</label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid #ddd',
            borderRadius: 8,
            fontSize: 16,
            minHeight: 100,
            resize: 'vertical'
          }}
          placeholder="상품에 대한 자세한 설명을 입력하세요"
          required
        />
      </div>

      {/* AI 촬영 기능 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>AI 촬영</label>
        <CaptureSheet onShot={(dataUrl)=>{
          // AdvancedImageUpload의 카메라 촬영 처리 함수 호출
          if (advancedUploadRef.current?.handleCameraCapture) {
            advancedUploadRef.current.handleCameraCapture(dataUrl);
          }
        }}/>
      </div>

      {/* 고도화된 이미지 업로드 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>이미지 *</label>
        <AdvancedImageUpload
          ref={advancedUploadRef}
          onImagesSelected={setFiles}
          maxFiles={5}
          maxFileSize={10}
          enableBackgroundRemoval={true}
          enableQualityCheck={true}
          qualityThreshold={70}
        />
        <p style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
          드래그 앤 드롭으로 이미지를 선택하거나, 배경 제거와 품질 체크를 사용할 수 있습니다.
        </p>
      </div>

      {/* 이미지 미리보기 */}
      {files.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>선택된 이미지 ({files.length}개)</h4>
          
          {/* AI 분석 버튼 */}
          <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
            <h5 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#495057' }}>🤖 AI 상품 분석</h5>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={aiBusy || !files?.length}
                onClick={async () => {
                  try {
                    setAiBusy(true);
                    setAiAnalysis(null);
                    setAiApplied(false);
                    
                    // 여러 이미지 중 용량이 작은 1~2장만 선택 (속도/비용 절약)
                    const sortedFiles = [...files].sort((a, b) => a.size - b.size);
                    const filesToAnalyze = sortedFiles.slice(0, Math.min(2, sortedFiles.length));
                    
                    console.log("[AI] 분석할 이미지:", filesToAnalyze.map(f => `${f.name} (${Math.round(f.size/1024)}KB)`));
                    
                    // 첫 번째 이미지로 분석 (가장 작은 용량)
                    const analysis = await analyzeProductImage(filesToAnalyze[0]);
                    console.log("[AI] analysis", analysis);

                    // 분석 결과 저장 (적용 전)
                    setAiAnalysis(analysis);
                    
                    // 성공 메시지
                    alert("AI 분석 완료! 📊\n\n분석 결과를 확인하고 '적용' 버튼을 눌러 폼에 반영하세요.");
                    
                  } catch (e: any) {
                    console.error("[AI] analyze error", e);
                    const msg =
                      e.message === "image-too-large" ? "이미지 용량이 너무 큽니다(최대 10MB)." :
                      e.message === "openai-key-missing" ? "서버의 OPENAI_API_KEY가 설정되지 않았습니다." :
                      e.message === "openai-rate-limit" ? "AI 사용량 제한에 걸렸습니다. 잠시 후 다시 시도해주세요." :
                      e.message === "ai-service-unavailable" ? "AI 서비스가 일시적으로 사용할 수 없습니다." :
                      e.message === "ai-timeout" ? "AI 분석 시간이 초과되었습니다. 다시 시도해주세요." :
                      e.message === "network-error" ? "네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요." :
                      "AI 분석에 실패했습니다.";
                    alert(msg);
                  } finally {
                    setAiBusy(false);
                  }
                }}
                style={{
                  padding: '12px 20px',
                  background: aiBusy ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: aiBusy ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                  boxShadow: aiBusy ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!aiBusy) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!aiBusy) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }
                }}
              >
                {aiBusy ? (
                  <>
                    <div style={{
                      width: 16,
                      height: 16,
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    AI 분석 중...
                  </>
                ) : (
                  <>
                    🤖 AI 상품 분석
                  </>
                )}
              </button>
              {!files?.length && <small style={{ color: '#6c757d' }}>이미지를 먼저 첨부하세요.</small>}
              <div style={{ fontSize: 12, color: '#6c757d', marginTop: 8, lineHeight: 1.4 }}>
                💡 <strong>AI 분석 기능:</strong><br/>
                • 카테고리 자동 선택<br/>
                • 상품 설명 자동 생성<br/>
                • 브랜드명 자동 추출<br/>
                • 색상, 소재, 상태 등 속성 분석<br/>
                • 관련 태그 자동 생성
              </div>
            </div>
            
            {/* AI 분석 결과 토글 */}
            {aiAnalysis && (
              <div style={{ 
                marginTop: 16, 
                padding: 16, 
                backgroundColor: aiApplied ? '#d4edda' : '#fff3cd', 
                borderRadius: 8, 
                border: `1px solid ${aiApplied ? '#c3e6cb' : '#ffeaa7'}`,
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h6 style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    color: aiApplied ? '#155724' : '#856404',
                    margin: 0
                  }}>
                    🤖 AI 분석 결과 {aiApplied ? '(적용됨)' : '(미적용)'}
                  </h6>
                  <button
                    type="button"
                    onClick={() => {
                      const newState = !aiApplied;
                      setAiApplied(newState);
                      
                      if (newState) {
                        // 적용 시 사용자 피드백
                        setTimeout(() => {
                          alert(`✅ AI 분석 결과가 폼에 적용되었습니다!\n\n• 카테고리: ${aiAnalysis.category || '설정됨'}\n• 브랜드: ${aiAnalysis.attributes?.brand || '설정됨'}\n• 설명: ${aiAnalysis.summary ? 'AI 요약 추가됨' : '설정됨'}\n\n필요시 수정해주세요.`);
                        }, 100);
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      background: aiApplied ? '#28a745' : '#ffc107',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!aiApplied) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!aiApplied) {
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {aiApplied ? '취소' : '적용'}
                  </button>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: 12,
                  marginBottom: 12
                }}>
                  <div>
                    <strong style={{ color: aiApplied ? '#155724' : '#856404' }}>카테고리:</strong>
                    <div>{aiAnalysis.category || '분석 불가'}</div>
                  </div>
                  <div>
                    <strong style={{ color: aiApplied ? '#155724' : '#856404' }}>브랜드:</strong>
                    <div>{aiAnalysis.attributes?.brand || '분석 불가'}</div>
                  </div>
                  <div>
                    <strong style={{ color: aiApplied ? '#155724' : '#856404' }}>색상:</strong>
                    <div>{aiAnalysis.attributes?.color || '분석 불가'}</div>
                  </div>
                  <div>
                    <strong style={{ color: aiApplied ? '#155724' : '#856404' }}>상태:</strong>
                    <div>{aiAnalysis.attributes?.condition || '분석 불가'}</div>
                  </div>
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: aiApplied ? '#155724' : '#856404' }}>요약:</strong>
                  <div style={{ marginTop: 4 }}>{aiAnalysis.summary || '분석 불가'}</div>
                </div>
                
                {aiAnalysis.tags && aiAnalysis.tags.length > 0 && (
                  <div>
                    <strong style={{ color: aiApplied ? '#155724' : '#856404' }}>태그:</strong>
                    <div style={{ 
                      marginTop: 4, 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 4 
                    }}>
                      {aiAnalysis.tags.map((tag, index) => (
                        <span key={index} style={{
                          padding: '2px 8px',
                          background: aiApplied ? '#28a745' : '#ffc107',
                          color: 'white',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {aiApplied && (
                  <div style={{ 
                    marginTop: 12, 
                    padding: 8, 
                    backgroundColor: '#d1ecf1', 
                    borderRadius: 4, 
                    border: '1px solid #bee5eb',
                    fontSize: 12,
                    color: '#0c5460'
                  }}>
                    ✅ AI 분석 결과가 폼에 적용되었습니다. 필요시 수정해주세요.
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
            {files.map((file, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <img
                  src={URL.createObjectURL(file)}
                  alt={`미리보기 ${index + 1}`}
                  style={{
                    width: '100%',
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid #ddd'
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
                {progress[file.name] && (
                  <div style={{
                    position: 'absolute',
                    bottom: 4,
                    left: 4,
                    right: 4,
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 12
                  }}>
                    {Math.round(progress[file.name])}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={busy}
        style={{
          width: '100%',
          padding: 12,
          background: busy ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 700,
          cursor: busy ? 'not-allowed' : 'pointer'
        }}
      >
        {busy ? '업로드 중…' : '등록하기'}
      </button>
    </form>
  );
} 