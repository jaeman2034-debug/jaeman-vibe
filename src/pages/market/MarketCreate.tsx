// src/pages/market/MarketCreate.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import CaptureSheet from '@/pages/capture/CaptureSheet';
import { resizeImage } from '@/lib/imageUtils';

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
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<string>('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>(CATEGORIES[0]);
  const [region, setRegion] = useState<typeof REGIONS[number]>(REGIONS[0]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});

  // 이미지 미리보기 URL 생성
  const previews = useMemo(() => {
    return files.map(file => URL.createObjectURL(file));
  }, [files]);

  // 파일 선택 처리
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles].slice(0, 5));
  };

  // 파일 제거
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 폼 제출 처리
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !desc.trim() || files.length === 0) {
      alert('제목, 설명, 이미지를 모두 입력해주세요.');
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert('로그인이 필요합니다.');
      return;
    }

    setBusy(true);
    try {
      // 이미지 전처리: 리사이즈 및 WebP 변환
      console.log('이미지 전처리 시작...');
      const processed = await Promise.all(files.map(f => resizeImage(f)));
      console.log('이미지 전처리 완료:', processed.length, '개');

      // 전처리된 이미지 업로드
      const urls: string[] = [];
      for (const file of processed) {
        const storageRef = ref(storage, `products/${uid}/${Date.now()}-${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(prev => ({ ...prev, [file.name]: progress }));
            },
            reject,
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              urls.push(url);
              resolve();
            }
          );
        });
      }

      // Firestore에 상품 정보 저장
      const doc = {
        title: title.trim(),
        price: price ? Number(price) : 0,
        description: desc.trim(),
        category,
        region,
        images: urls,
        ownerId: uid,
        createdAt: serverTimestamp(),
        status: 'active' as const,
      };

      const docRef = await addDoc(collection(db, 'market_items'), doc);
      alert('등록 완료!');
      navigate(`/market/${docRef.id}`);
    } catch (err: any) {
      console.error('상품 등록 실패:', err);
      alert('상품 등록에 실패했습니다: ' + err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 820, margin: '24px auto', padding: 16 }}>
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
          fetch(dataUrl).then(r=>r.blob()).then(b=>{
            const f = new File([b], `shot-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setFiles(prev => [f, ...prev].slice(0,5));
          });
        }}/>
      </div>

      {/* 파일 선택 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>이미지 *</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={onPick}
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid #ddd',
            borderRadius: 8,
            fontSize: 16
          }}
        />
        <p style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
          최대 5개까지 선택 가능합니다. AI 촬영으로도 추가할 수 있습니다.
        </p>
      </div>

      {/* 이미지 미리보기 */}
      {previews.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
            {previews.map((url, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <img
                  src={url}
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
                {progress[files[index]?.name] && (
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
                    {Math.round(progress[files[index]?.name])}%
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