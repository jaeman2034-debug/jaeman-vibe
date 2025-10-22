import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { auth, storage, db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
// import { createProduct } from "@/services/productService";
// import AiInspector from "@/components/AiInspector";
// import { suggestPriceRange } from "@/lib/priceSuggest";
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useForm, Controller } from "react-hook-form";



// AI 모드 타입 정의
type AiMode = "auto" | "manual";




// AI 제안 결과 타입 정의
type AiSuggest = {
  title?: string;
  category?: string;
  priceHint?: number;
  descDraft?: string;
  quality?: { sharpness: number; brightness: number; clutter: number };
  priceRange?: any; // 가격 priceRange 속성 추출
};

export default function ProductCreate() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("기타");
  const [region, setRegion] = useState("KR");
  const [files, setFiles] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);

  // RHF 설정 (Controller 방식)
  const { control, handleSubmit: rhfHandleSubmit, watch } = useForm<any>();

  // 썸네일 미리보기 상태
  const [preview, setPreview] = useState<string | null>(null);



  // 이미지 미리보기 상태 추가
  const [previews, setPreviews] = useState<string[]>([]);
  
  // 업로드 진행률 상태
  const [uploadProgress, setUploadProgress] = useState<number>(0);


  // 폼 참조
  const formRef = useRef<HTMLFormElement>(null);
  
  // 파일 인풋 ref
  const fileRef = useRef<HTMLInputElement | null>(null);
  


  // 같은 파일 재선택 허용
  const handleFileClick = (e: React.MouseEvent<HTMLInputElement>) => {
    (e.currentTarget as HTMLInputElement).value = '';
  };

  // 파일 선택 시 미리보기
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const url = URL.createObjectURL(f);
    // 이전 URL 정리
    setPreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  // 언마운트 시 URL 정리
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  // AI 모드 상태 관리
  const [aiMode, setAiMode] = useState<AiMode>("manual"); // 기본값을 manual로 변경
  const abortRef = useRef<AbortController | null>(null);


  // AI 분석 관련 상태
  const [showCamera, setShowCamera] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // AI 제안 관련 상태
  const [ai, setAi] = useState<AiSuggest | null>(null);
  // 되돌릴 값을 보관
  const [prevValues, setPrevValues] = useState<{
    title: string;
    category: string;
    price: number | "";
    description: string;
  } | null>(null);

  // 상수 정의
  const MIN_PRICE = 1000; // 기본 최소 금액(시장 정책에 맞게 조정

  // 자동 가격추천 (카테고리 변경시)
  useEffect(() => {
    (async () => {
      if (!category || category === "기타") return;

      try {
        const myDongCode = "12345"; // profile?.dongCode || formDongCode
        // const suggestion = await suggestPriceRange(category, myDongCode);

        // if (suggestion) {
        //   setAi(prev => ({
        //     ...(prev || {}),
        //     priceHint: suggestion.mid,
        //     priceRange: suggestion
        //   }));
        //   console.log(`[가격추천] ${category} 카테고리: ${suggestion.range} (신뢰도: ${Math.round(suggestion.confidence * 100)}%)`);
        // }
      } catch (error) {
        console.warn("자동 가격추천 실패:", error);
      }
    })();
  }, [category]);

  // AI 모드 설정 불러오기 (최초 로드 시)
  useEffect(() => {
    const local = localStorage.getItem("ai.autoMode") as AiMode | null;
    if (local) setAiMode(local);
    // Firestore에서 불러왔다면 덮어쓰기
    // (선택) try { const snap = await getDoc(doc(db,"users",uid)); setAiMode(snap.data()?.settings?.aiAutoMode ?? local ?? "auto"); } catch {}
  }, []);

  // AI 모드 설정 저장
  async function saveAiMode(mode: AiMode) {
    setAiMode(mode);
    localStorage.setItem("ai.autoMode", mode);
    // (선택) await updateDoc(doc(db,"users",uid), {"settings.aiAutoMode": mode}).catch(()=>{});
  }

  // 컴포넌트 unmount 시 URL 해제(메모리 누수 방지)
  useEffect(() => {
    return () => {
      previews.forEach((u: string) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  // 개별 이미지 삭제 기능
  function removePreview(idx: number) {
    setPreviews((prev: string[]) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
    // files 상태도 함께 삭제
    if (files) {
      const arr = Array.from(files);
      arr.splice(idx, 1);
      const dt = new DataTransfer();
      arr.forEach((f) => dt.items.add(f));
      setFiles(dt.files);
    }
  }


  // Firebase Storage 업로드 함수 (진행률 표시)
  async function uploadThumbnail(productId: string, file: File) {
    if (!auth.currentUser) {
      throw new Error("로그인이 필요합니다.");
    }

    const path = `market/${productId}-${Date.now()}-${encodeURIComponent(file.name)}`;
    const storageRef = ref(storage, path);

    // 진행률 표시를 위한 uploadBytesResumable 사용
    const { uploadBytesResumable } = await import('firebase/storage');
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });
    
    return new Promise<{ path: string; url: string }>((resolve, reject) => {
      task.on('state_changed', 
        (snap) => {
          const progress = (snap.bytesTransferred / snap.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
          console.log(`[UPLOAD] ${progress.toFixed(1)}% 완료`);
        },
        (error) => {
          console.error('[UPLOAD] 업로드 실패:', error);
          setUploadProgress(0);
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(storageRef);
            setUploadProgress(100);
            console.log('[UPLOAD] 업로드 완료:', url);
            resolve({ path, url });
          } catch (error) {
            setUploadProgress(0);
            reject(error);
          }
        }
      );
    });
  }

  // AI 제안 적용
  function applyAISuggest(s: AiSuggest, { force = false } = {}) {
    if (force || !title?.trim()) setTitle(s.title ?? title ?? "");
    if (force || !description?.trim()) setDescription(s.descDraft ?? description ?? "");
    if (force || !category || category === "기타")
      setCategory(s.category ?? category ?? "기타");
    const hinted = s.priceHint && s.priceHint > 0 ? Math.round(s.priceHint) : undefined;
    if (force || !price || Number(price) <= 0) setPrice(hinted ?? MIN_PRICE); // 최소값으로 채움
  }

  // AI 제안 되돌리기
  function undoAISuggest() {
    if (!prevValues) return;

    setTitle(prevValues.title);
    setCategory(prevValues.category);
    setPrice(prevValues.price);
    setPrevValues(null);
  }

  // 카메라 시작
  const startCamera = async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('카메라 접근 실패:', error);
      setCameraError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
    }
  };

  // 카메라 중지
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  // 이미지 촬영 및 AI 분석
  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    try {
      setAnalyzing(true);
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob: Blob | null) => { if (blob) resolve(blob); }, 'image/jpeg', 0.8);
      });
      const file = new File([blob], `ai_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });

      // 촬영한 이미지를 파일 목록에 추가 (AiInspector가 분석)
      const dataTransfer = new DataTransfer();
      if (files) { Array.from(files).forEach(f => dataTransfer.items.add(f)); }
      dataTransfer.items.add(file);
      setFiles(dataTransfer.files);

      // 미리보기도 함께 업데이트
      const newPreviews = Array.from(dataTransfer.files).map((f: File) => URL.createObjectURL(f));
      setPreviews((prev: string[]) => {
        prev.forEach(URL.revokeObjectURL); // 기존 URL 정리
        return newPreviews;
      });

      // 카메라 중지
      stopCamera();
    } catch (error) {
      console.error('촬영 실패:', error);
      alert('촬영 중 오류가 발생했습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  // 파일 선택 시 미리보기 생성
  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    setFiles(list);
    // 이전 URL 정리
    setPreviews((prev: string[]) => {
      prev.forEach(URL.revokeObjectURL);
      return [];
    });
    if (!list || list.length === 0) return;

    // 새로운 URL 생성
    const urls = Array.from(list).map((f: File) => URL.createObjectURL(f));
    setPreviews(urls);
    // 자동 모드일 때만 AI 분석 실행
    if (aiMode === "auto") {
      const file = list[0];
      scheduleQuickAnalysis(file);
    }
  }

  // 빠른 AI 분석 스케줄링
  function scheduleQuickAnalysis(file: File) {
    // 이전 분석 취소 + 새로 시작
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setTimeout(() => {
      runAnalysis(file, { quick: true, apply: true }); // 모바일용 경량 분석
    }, 250);
  }

  // AI 분석 실행 함수
  type RunOpts = { quick?: boolean; apply?: boolean; signal?: AbortSignal };

  // 보조 유틸 함수들
  function suggestCategoryFromLabels(labels: string[]) {
    const L = labels.map(s => s.toLowerCase());
    // 가방류
    if (L.some(x => /(back ?pack|knapsack|packsack|rucksack|haversack|bag)/.test(x)))
      return "가방/용품";
    // 축구
    if (L.some(x => /(soccer|football|cleats|shin guard|goalkeeper|futsal)/.test(x)))
      return "축구";
    // 라켓/구기 공통
    if (L.some(x => /(sports|equipment|ball|racket|bat|glove)/.test(x)))
      return "스포츠용품";
    return null; // 그외는 사용 쪽에서 기존 값 유지
  }

  function generateTitleFromLabels(labels: string[], cat: string) {
    const main = (labels[0] ?? "").toLowerCase().replace(/_/g, " ");
    return `${cat} ${main}`.trim();
  }

  function buildDescription(qa: {
    labels: string[];
    quality: { sharpness: number; brightness: number; clutter: number };
  }) {
    const { sharpness, brightness, clutter } = qa.quality;
    const tips: string[] = [];
    if (sharpness < 0.35) tips.push("이미지가 약간 흐림");
    if (brightness < 0.40) tips.push("조명이 어두움");
    if (clutter > 0.65) tips.push("배경 복잡");
    return [
      "자동 생성 설명(수정 가능):",
      qa.labels && qa.labels.length > 0
        ? `인식된 객체: ${qa.labels.slice(0,5).join(", ")}`
        : "인식된 객체: 분석 필요",
      `촬영 품질: 선명도 ${Math.round(sharpness*100)} / 밝기 ${Math.round(brightness*100)} / 복잡도 ${Math.round(clutter*100)}`,
      tips.length ? `촬영 팁 ${tips.join(", ")}` : "",
    ].filter(Boolean).join("\n");
  }

  // 이미지 품질 및 라벨 분석 함수 (간단 버전)
  async function analyzeQualityAndLabels(file: File, signal?: AbortSignal) {
    // 간단한 품질 분석 (실제로는 AiInspector에서 처리)
    const quality = {
      sharpness: 0.7,  // 기본값
      brightness: 0.6,
      clutter: 0.3
    };

    // 실제 AI 분석이 있다면 여기서 처리
    // const labels = await analyzeImageWithAI(file, signal);

    return { quality, labels: [] }; // 빈 배열로 반환하여 자동 입력 방지
  }

  async function runAnalysis(file: File, opts: RunOpts = {}) {
    setAnalyzing(true);
    try {
      console.log(`[AI] 분석 시작: ${opts.quick ? '빠른' : '전체'} 분석, apply: ${opts.apply}`);

      // 1) 모바일용 경량 분석 (선명도/밝기/복잡도 + 모바일넷 라벨)
      const qa = await analyzeQualityAndLabels(file, opts.signal); // 실제로는 있는 함수로 교체
      // qa: { quality:{sharpness,brightness,clutter}, labels:string[] }
      // 2) 라벨로 카테고리/제목 정보
      // 라벨이 있으면 기존 값 덮어쓰기 (자동 입력 방지)
      let cat = category ?? "기타";
      let ttl = title ?? "";

      if (qa.labels && qa.labels.length > 0) {
        cat = suggestCategoryFromLabels(qa.labels) ?? category ?? "기타";
        ttl = generateTitleFromLabels(qa.labels, cat);
      }
      // 3) 가격범위 추천(베이스) + 파일 카테고리(+지역) 중앙값
      // const priceSugg = await suggestPriceRange(cat, "12345"); // profile?.dongCode
      // const priceHint = priceSugg?.mid;
      const priceHint = undefined;
      // 4) 설명 초안(라벨/품질 요약)
      const descDraft = buildDescription(qa);
      // 화면에 미리보기(패널)도 갱신하고
      const aiSuggest: AiSuggest = {
        category: cat,
        title: ttl,
        priceHint,
        descDraft,
        quality: qa.quality,
      };
      setAi(aiSuggest);
      // 옵션: 버튼을 눌렀을 때 곧바로 필드에 **적용**
      if (opts.apply) {
        setPrevValues({ title, category, price, description }); // 되돌리기 용도
        applyAISuggest(aiSuggest, { force: true });
        console.log(`[AI] 분석 결과 즉시 적용:`, aiSuggest);
      }

      return aiSuggest;
    } catch (e) {
      console.error("[AI] analyze error", e);
      alert("AI 분석 중 문제가 발생했습니다.");
      throw e;
    } finally {
      setAnalyzing(false);
    }
  }

  // AI 분석 결과 처리
  const handleAISuggestion = (suggestion: {
    labels: string[],
    category?: string,
    title?: string,
    tips: string[],
    quality: { sharpness: number, brightness: number, clutter: number },
    priceRange?: any
  }) => {
    setAnalysisResult(suggestion);

    // AI 제안 상태 업데이트
    setAi({
      category: suggestion.category,
      title: suggestion.title,
      quality: suggestion.quality,
      priceRange: suggestion.priceRange
    });
  };

  // 제출
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;

    // 필수 입력 검증
    if (!title || !price || !description) {
      alert("제목, 가격, 설명을 모두 입력해주세요.");
      return;
    }

    setSaving(true);

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("로그인이 필요합니다.");

      // 상품 ID 생성 (crypto.randomUUID 사용)
      const productId = crypto.randomUUID();

      // 썸네일 업로드 (있는 경우)
      let thumbUrl = '';
      let thumbPath = '';
      const file = fileRef.current?.files?.[0] ?? null;

      if (file) {
        const path = `market/${uid}/${productId}/thumb-${Date.now()}-${file.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        thumbUrl = await getDownloadURL(storageRef);
        thumbPath = path;
      }
      
      // 업로드 완료 후 진행률 초기화
      setUploadProgress(0);

      // Firestore에 상품 정보 저장 (단일 컬렉션 사용)
      const docRef = doc(db, 'market_items', productId);
      
      // 이미지 배열 구성
      const images = thumbUrl ? [{ url: thumbUrl, path: thumbPath }] : [];
      
      const data = {
        // 기본 상품 정보
        title: title.trim(),
        price: Number(price) || 0,
        category: category || 'etc',
        region: region || 'KR',
        description: description || '',

        // 이미지 관련 (상세용 + 목록용)
        images,                          // [{ url, path }]
        thumbUrl: images[0]?.url || '',  // ★ 목록용 썸네일

        // 목록 필터/상태 필드 (통일된 키)
        isSold: false,
        deleted: false,
        status: 'selling',               // 목록 필터와 일치

        // 타임스탬프
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // 소유자 정보
        ownerId: uid,
      };

      await setDoc(docRef, data);

      // 성공 후 필드 초기화
      setPreview(null);

      alert("등록 완료!");
      nav(`/market/${productId}`);
    } catch (error: any) {
      console.error("상품 등록 실패:", error);
      alert(error?.message || "등록 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // RHF 제출 처리
  const handleSubmit = rhfHandleSubmit(async (data: any) => {
    await onSubmit(new Event('submit') as any);
  });

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">상품 등록</h1>
        {/* 헤더에 AI 분석 모드 선택 */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">AI 분석 모드:</span>
          <select
            value={aiMode}
            onChange={(e) => saveAiMode(e.target.value as AiMode)}
            className="border rounded px-2 py-1 text-xs"
          >
            <option value="auto">자동</option>
            <option value="manual">수동</option>
          </select>
        </div>
      </div>

      {/* AI 촬영분석 섹션 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-800 mb-3">📸 AI 촬영분석</h2>
        <p className="text-sm text-blue-600 mb-3">
          상품을 촬영하면 AI가 자동으로 제목, 카테고리, 가격을 분석해드립니다.
        </p>

        {!showCamera ? (
          <button onClick={startCamera} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            📸 AI 촬영분석 시작
          </button>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline className="w-full h-64 bg-black rounded-lg" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={captureAndAnalyze}
                disabled={analyzing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {analyzing ? "📸 촬영 중.." : "📸 촬영"}
              </button>
              <button onClick={stopCamera} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                ❌ 취소
              </button>
            </div>
            {cameraError && (<p className="text-red-600 text-sm">{cameraError}</p>)}
          </div>
        )}

        {/* AI 분석 모드 선택 */}
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-blue-700 font-medium">AI 분석 모드:</span>
          <select
            value={aiMode}
            onChange={(e) => saveAiMode(e.target.value as AiMode)}
            className="border rounded px-2 py-1 text-xs"
          >
            <option value="auto">자동</option>
            <option value="manual">수동</option>
          </select>
          <button
            type="button"
            disabled={!files?.[0] || analyzing}
            onClick={async () => {
              if (!files?.[0]) return;
              const s = await runAnalysis(files[0]);
              applyAISuggest(s, { force: true });
            }}
            className="px-3 py-2 rounded bg-indigo-600 text-white text-xs hover:bg-indigo-700 disabled:opacity-50"
          >
            {analyzing ? "AI 분석 중.." : "📸 AI 분석 + 즉시 적용"}
          </button>

          {/* 되돌리기 버튼 */}
          {prevValues && (
            <button
              type="button"
              onClick={undoAISuggest}
              className="px-2 py-1 border rounded text-xs hover:bg-gray-50"
            >
              ↩️ 되돌리기
            </button>
          )}
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="상품 제목을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">가격(원)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
            className="w-full p-2 border rounded"
            placeholder="가격을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">카테고리</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="기타">기타</option>
            <option value="축구">축구</option>
            <option value="농구">농구</option>
            <option value="야구">야구</option>
            <option value="테니스">테니스</option>
            <option value="배드민턴">배드민턴</option>
            <option value="골프">골프</option>
            <option value="수영">수영</option>
            <option value="가방">가방</option>
            <option value="의류">의류</option>
            <option value="보호용품">보호용품</option>
          </select>
        </div>

        {/* 지역 선택 */}
        <div>
          <label className="block text-sm mb-1">지역</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="KR">전국</option>
            <option value="서울">서울</option>
            <option value="경기">경기</option>
            <option value="인천">인천</option>
            <option value="부산">부산</option>
            <option value="대구">대구</option>
            <option value="광주">광주</option>
            <option value="대전">대전</option>
            <option value="울산">울산</option>
            <option value="세종">세종</option>
            <option value="강원">강원</option>
            <option value="충북">충북</option>
            <option value="충남">충남</option>
            <option value="전북">전북</option>
            <option value="전남">전남</option>
            <option value="경북">경북</option>
            <option value="경남">경남</option>
            <option value="제주">제주</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            rows={4}
            placeholder="상품에 대한 자세한 설명을 입력하세요"
          />
        </div>

        {/* 썸네일 이미지 업로드 */}
        <div>
          <label className="block text-sm font-medium mb-1">썸네일</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onClick={handleFileClick}
            onChange={handleFileChange}
            className="w-full h-10"
            data-hook="thumb-input" // 디버깅용
          />
          
          <div
            style={{
              width: 180, height: 180, marginTop: 8,
              border: '1px dashed #bbb', borderRadius: 8, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#999'
            }}
          >
            {preview ? (
              <img
                src={preview}
                alt="thumbnail"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              '썸네일 미리보기'
            )}
          </div>
        </div>
        
        {/* 업로드 진행률 표시 */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">{uploadProgress.toFixed(1)}%</span>
            </div>
          </div>
        )}


        <div>
          <label className="block text-sm mb-1">추가 이미지</label>
          <input 
            type="file"
            accept="image/*" 
            multiple 
            onChange={handleFilesChange}
            className="w-full p-2 border rounded"
          />
          {files && (<p className="text-sm text-gray-600 mt-1">{files.length}개 파일 선택됨</p>)}
        </div>

        {/* 추가 파일 미리보기 섹션 */}
        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">📷 추가 이미지 미리보기</h4>
          {/* 미리보기 그리드 */}
          {previews.length > 0 ? (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-3 gap-3">
                {previews.map((src: string, i: number) => (
                  <div key={i} className="aspect-square rounded-lg border border-gray-300 overflow-hidden relative group">
                    <img
                      src={src}
                      alt={`이미지 ${i + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="eager"
                    />
                    <button
                      type="button"
                      onClick={() => removePreview(i)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="이미지 삭제"
                    >
                      ❌
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 text-center">
                      이미지 {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500">
              이미지를 선택하면 여기에 미리보기가 표시됩니다.
            </div>
          )}
        </div>

        {/* AI 분석 결과 표시 */}
        {analysisResult && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-3">📸 AI 분석 결과</h3>
            <div className="mb-4">
              <h4 className="font-medium text-green-700 mb-2">이미지 품질 점수</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{Math.round(analysisResult.quality.sharpness * 100)}</div>
                  <div className="text-sm text-green-600">선명도</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{Math.round(analysisResult.quality.brightness * 100)}</div>
                  <div className="text-sm text-green-600">밝기</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{Math.round(analysisResult.quality.clutter * 100)}</div>
                  <div className="text-sm text-green-600">복잡도</div>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <h4 className="font-medium text-green-700 mb-2">인식된 객체</h4>
              <div className="flex flex-wrap gap-2">
                {analysisResult.labels.map((label: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <h4 className="font-medium text-green-700 mb-2">촬영 팁</h4>
              <div className="space-y-1">
                {analysisResult.tips.map((tip: string, index: number) => (
                  <div key={index} className="text-sm text-green-600">• {tip}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI 추천 정보 섹션 */}
        {ai && (
          <div className="mb-6 rounded-lg border p-4 bg-green-50">
            <div className="text-sm text-gray-600 mb-3 font-medium">🤖 AI 추천</div>
            <div className="space-y-2 mb-4">
              <div className="text-sm">카테고리: <b className="text-green-700">{ai.category ?? "-"}</b></div>
              <div className="text-sm">제목: <b className="text-green-700">{ai.title ?? "-"}</b></div>
              {ai.priceHint && <div className="text-sm">가격 힌트: <b className="text-green-700">{ai.priceHint.toLocaleString()}원</b></div>}
            </div>

            {/* 패널에 '이 가격으로' 버튼 출력 */}
            {ai.priceHint && (
              <div className="mt-1 text-sm mb-4">
                추천 가격 <b>{ai.priceHint.toLocaleString()}원</b>
                <button
                  type="button"
                  onClick={() => setPrice(ai.priceHint!)}
                  className="ml-2 px-2 py-1 rounded border hover:bg-green-100"
                >
                  이 가격으로
                </button>
              </div>
            )}

            {/* 가격범위 정보 추출 */}
            {(ai as any).priceRange && (
              <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                <div className="text-sm font-medium text-blue-800 mb-2">📊 가격범위 추천</div>
                <div className="text-sm text-blue-700 mb-2">
                  범위: <b>{(ai as any).priceRange.range}</b><br/>
                  중앙값: <b>{(ai as any).priceRange.mid.toLocaleString()}원</b><br/>
                  데이터: <b>{(ai as any).priceRange.count}개</b> 신뢰도: <b>{Math.round((ai as any).priceRange.confidence * 100)}%</b>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPrice((ai as any).priceRange.mid)}
                    className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                  >
                    추천 중앙값 적용
                  </button>
                  <button
                    onClick={() => setPrice((ai as any).priceRange.low)}
                    className="px-3 py-1 rounded border border-blue-300 text-blue-700 text-sm hover:bg-blue-50"
                  >
                    추천 최저가 적용
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => ai && applyAISuggest(ai, { force: false })}
                className="px-3 py-1 rounded bg-indigo-600 text-white"
              >
                추천 적용
              </button>
              {prevValues && (
                <button
                  type="button"
                  onClick={undoAISuggest}
                  className="px-3 py-1 rounded border"
                >
                  ↩️ 되돌리기
                </button>
              )}
            </div>
          </div>
        )}

        <button disabled={saving} className="px-5 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">
          {saving ? "등록 중.." : "등록"}
        </button>
      </form>

      {/* AI 분석기(파일 선택 후에 배치) */}
      {/* {files && files.length > 0 && (
        <AiInspector
          file={files[0]}
          onSuggest={handleAISuggestion}
        />
      )} */}
    </div>
  );
}