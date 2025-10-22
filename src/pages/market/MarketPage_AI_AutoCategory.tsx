import React, { useEffect, useMemo, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore, collection, onSnapshot, query, orderBy,
  addDoc, serverTimestamp
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

type MarketItem = {
  id: string;
  title: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  aiTags?: any;
  createdAt?: any;
  aiAnalysisCompleted?: boolean;
  aiError?: string;
};

const MarketPage_AI_AutoCategory: React.FC = () => {
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  const app = getApps().length ? getApps()[0] : initializeApp(cfg);
  const db = getFirestore(app);
  const storage = getStorage(app);

  const [items, setItems] = useState<MarketItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState("");
  const [selectedCat, setSelectedCat] = useState("?�체");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ?�시�??�이??구독
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "marketItems"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: MarketItem[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      setItems(arr);
      setLoading(false);
    }, (error) => {
      console.error("Firestore subscription error:", error);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  // Cloud Function ?�출
  const callAiAutoTag = async (imageUrl: string, docId: string): Promise<{ success: boolean; aiResult?: any; error?: string }> => {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const functionUrl = `https://asia-northeast3-${projectId}.cloudfunctions.net/aiAutoTag`;
    
    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          docId
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return { success: true, aiResult: data.aiTags };
    } catch (error) {
      console.error("AI Auto Tag Cloud Function ?�출 ?�패:", error);
      return { success: false, error: String(error) };
    }
  };

  const uploadAndAnalyze = async () => {
    if (!file) return alert("?��?지�??�택?�세??");
    
    try {
      setProgress("?�� ?��?지 ?�로??�?..");
      const path = `market/${Date.now()}_${file.name}`;
      const r = ref(storage, path);
      await uploadBytes(r, file);
      const imageUrl = await getDownloadURL(r);

      setProgress("?�� Firestore ?�록 �?..");
      const docRef = await addDoc(collection(db, "marketItems"), {
        title: "AI ?�동 분류 ?�품",
        imageUrl,
        createdAt: serverTimestamp(),
        aiAnalysisCompleted: false,
      });

      setProgress("?�� AI 분석 �?..");
      const result = await callAiAutoTag(imageUrl, docRef.id);
      
      if (result.success) {
        setProgress("??AI 분석 ?�료! 카테고리 ?�동 분류??);
        console.log("AI 분석 결과:", result.aiResult);
      } else {
        setProgress("??AI 분석 ?�패: " + result.error);
      }
    } catch (error) {
      console.error("?�로??분석 ?�류:", error);
      setProgress("???�류 발생: " + String(error));
    }
  };

  // 카테고리 목록 ?�성 (?�시�??�데?�트)
  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category || "기�?"));
    return ["?�체", ...Array.from(cats).sort()];
  }, [items]);

  // ?�터링된 ?�품 목록
  const filtered = useMemo(() => {
    return items.filter((i) => {
      const catOk = selectedCat === "?�체" || i.category === selectedCat;
      const textOk =
        !search ||
        i.title?.toLowerCase().includes(search.toLowerCase()) ||
        i.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      return catOk && textOk;
    });
  }, [items, selectedCat, search]);

  // ?�계 ?�보
  const stats = useMemo(() => {
    const total = items.length;
    const analyzed = items.filter(i => i.aiAnalysisCompleted).length;
    const categories = new Set(items.map(i => i.category || "기�?")).size;
    return { total, analyzed, categories };
  }, [items]);

  return (
    <div className="mx-auto max-w-6xl p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="text-3xl font-extrabold text-center">?�� AI ?�동 분류 마켓</h1>
        
        {/* ?�계 ?�보 */}
        <div className="flex justify-center gap-4 text-sm text-slate-600">
          <span>?�� �??�품: {stats.total}�?/span>
          <span>?�� AI 분석: {stats.analyzed}�?/span>
          <span>?�� 카테고리: {stats.categories}�?/span>
        </div>
      </div>

      {/* 컨트�??�널 */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6 p-4 bg-slate-50 rounded-2xl">
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm bg-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c} {c !== "?�체" && `(${items.filter(i => i.category === c).length})`}
              </option>
            ))}
          </select>
          <input
            placeholder="?�� ?�품�??�는 AI ?�그�?검??.."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm bg-white"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <button
            onClick={uploadAndAnalyze}
            disabled={!file}
            className="rounded-xl px-4 py-2 bg-slate-800 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
          >
            ?�� ?�로??+ ?�� AI 분석
          </button>
        </div>
      </div>

      {/* 진행 ?�태 */}
      {progress && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="text-sm text-blue-800">{progress}</div>
        </div>
      )}

      {/* ?�품 목록 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-slate-500">?�� ?�품 목록??불러?�는 �?..</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-slate-500">
            {search || selectedCat !== "?�체" 
              ? "?�� 검??조건??맞는 ?�품???�습?�다." 
              : "?�� ?�록???�품???�습?�다. ?��?지�??�로?�해보세??"}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => (
            <div
              key={i.id}
              className="rounded-2xl border p-4 flex flex-col gap-3 hover:shadow-md transition-shadow bg-white"
            >
              {/* ?��?지 */}
              <div className="relative">
                <img
                  src={i.imageUrl || "https://picsum.photos/400/300?random=" + i.id}
                  alt=""
                  className="w-full h-[200px] object-cover rounded-xl"
                  loading="lazy"
                  onError={(e) => {
                    console.log('[MarketPage_AI_AutoCategory] ?��?지 로드 ?�패:', i.imageUrl);
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
                {/* AI 분석 ?�태 ?�시 */}
                {i.aiAnalysisCompleted && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                    ?�� AI
                  </div>
                )}
                {i.aiError && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                    ???�류
                  </div>
                )}
              </div>

              {/* ?�품 ?�보 */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="font-semibold text-base line-clamp-2">{i.title}</div>
                
                {/* 카테고리 & 브랜??*/}
                <div className="text-sm text-slate-600">
                  ?�� {i.category || "기�?"}
                  {i.aiTags?.brand && ` | ?���?${i.aiTags.brand}`}
                </div>

                {/* AI 가�?추정 */}
                {i.aiTags?.priceHint && (
                  <div className="text-sm font-bold text-green-600">
                    ?�� {i.aiTags.priceHint}
                  </div>
                )}

                {/* AI 분석 ?�세 ?�보 */}
                {i.aiTags && (
                  <div className="text-xs text-slate-500 space-y-1">
                    {i.aiTags.color && <div>?�� ?�상: {i.aiTags.color}</div>}
                    {i.aiTags.condition && <div>�??�태: {i.aiTags.condition}</div>}
                  </div>
                )}

                {/* AI ?�그 */}
                {i.tags && i.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {i.tags.map((t, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-700"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* AI 분석 ?�류 */}
                {i.aiError && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    ??AI 분석 ?�류: {i.aiError}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ?�단 ?�보 */}
      <div className="mt-8 text-center text-xs text-slate-500">
        <div>?�� AI ?�동 분류 ?�스??| OpenAI Vision API 기반</div>
        <div>?�� 카테고리: 축구?? ?�니?? �? ?�품, 기�?</div>
        <div>?���??�동 ?�그 ?�성 �?가�?추정 지??/div>
      </div>
    </div>
  );
};

export default MarketPage_AI_AutoCategory;
