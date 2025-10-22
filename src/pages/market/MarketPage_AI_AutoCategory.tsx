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
  const [selectedCat, setSelectedCat] = useState("?„ì²´");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ?¤ì‹œê°??°ì´??êµ¬ë…
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

  // Cloud Function ?¸ì¶œ
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
      console.error("AI Auto Tag Cloud Function ?¸ì¶œ ?¤íŒ¨:", error);
      return { success: false, error: String(error) };
    }
  };

  const uploadAndAnalyze = async () => {
    if (!file) return alert("?´ë?ì§€ë¥?? íƒ?˜ì„¸??");
    
    try {
      setProgress("?“¤ ?´ë?ì§€ ?…ë¡œ??ì¤?..");
      const path = `market/${Date.now()}_${file.name}`;
      const r = ref(storage, path);
      await uploadBytes(r, file);
      const imageUrl = await getDownloadURL(r);

      setProgress("?’¾ Firestore ?±ë¡ ì¤?..");
      const docRef = await addDoc(collection(db, "marketItems"), {
        title: "AI ?ë™ ë¶„ë¥˜ ?í’ˆ",
        imageUrl,
        createdAt: serverTimestamp(),
        aiAnalysisCompleted: false,
      });

      setProgress("?§  AI ë¶„ì„ ì¤?..");
      const result = await callAiAutoTag(imageUrl, docRef.id);
      
      if (result.success) {
        setProgress("??AI ë¶„ì„ ?„ë£Œ! ì¹´í…Œê³ ë¦¬ ?ë™ ë¶„ë¥˜??);
        console.log("AI ë¶„ì„ ê²°ê³¼:", result.aiResult);
      } else {
        setProgress("??AI ë¶„ì„ ?¤íŒ¨: " + result.error);
      }
    } catch (error) {
      console.error("?…ë¡œ??ë¶„ì„ ?¤ë¥˜:", error);
      setProgress("???¤ë¥˜ ë°œìƒ: " + String(error));
    }
  };

  // ì¹´í…Œê³ ë¦¬ ëª©ë¡ ?ì„± (?¤ì‹œê°??…ë°?´íŠ¸)
  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category || "ê¸°í?"));
    return ["?„ì²´", ...Array.from(cats).sort()];
  }, [items]);

  // ?„í„°ë§ëœ ?í’ˆ ëª©ë¡
  const filtered = useMemo(() => {
    return items.filter((i) => {
      const catOk = selectedCat === "?„ì²´" || i.category === selectedCat;
      const textOk =
        !search ||
        i.title?.toLowerCase().includes(search.toLowerCase()) ||
        i.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      return catOk && textOk;
    });
  }, [items, selectedCat, search]);

  // ?µê³„ ?•ë³´
  const stats = useMemo(() => {
    const total = items.length;
    const analyzed = items.filter(i => i.aiAnalysisCompleted).length;
    const categories = new Set(items.map(i => i.category || "ê¸°í?")).size;
    return { total, analyzed, categories };
  }, [items]);

  return (
    <div className="mx-auto max-w-6xl p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="text-3xl font-extrabold text-center">?§  AI ?ë™ ë¶„ë¥˜ ë§ˆì¼“</h1>
        
        {/* ?µê³„ ?•ë³´ */}
        <div className="flex justify-center gap-4 text-sm text-slate-600">
          <span>?“¦ ì´??í’ˆ: {stats.total}ê°?/span>
          <span>?§  AI ë¶„ì„: {stats.analyzed}ê°?/span>
          <span>?“‚ ì¹´í…Œê³ ë¦¬: {stats.categories}ê°?/span>
        </div>
      </div>

      {/* ì»¨íŠ¸ë¡??¨ë„ */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6 p-4 bg-slate-50 rounded-2xl">
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm bg-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c} {c !== "?„ì²´" && `(${items.filter(i => i.category === c).length})`}
              </option>
            ))}
          </select>
          <input
            placeholder="?” ?í’ˆëª??ëŠ” AI ?œê·¸ë¡?ê²€??.."
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
            ?“¤ ?…ë¡œ??+ ?§  AI ë¶„ì„
          </button>
        </div>
      </div>

      {/* ì§„í–‰ ?íƒœ */}
      {progress && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="text-sm text-blue-800">{progress}</div>
        </div>
      )}

      {/* ?í’ˆ ëª©ë¡ */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-slate-500">?“¦ ?í’ˆ ëª©ë¡??ë¶ˆëŸ¬?¤ëŠ” ì¤?..</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-slate-500">
            {search || selectedCat !== "?„ì²´" 
              ? "?” ê²€??ì¡°ê±´??ë§ëŠ” ?í’ˆ???†ìŠµ?ˆë‹¤." 
              : "?“¦ ?±ë¡???í’ˆ???†ìŠµ?ˆë‹¤. ?´ë?ì§€ë¥??…ë¡œ?œí•´ë³´ì„¸??"}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => (
            <div
              key={i.id}
              className="rounded-2xl border p-4 flex flex-col gap-3 hover:shadow-md transition-shadow bg-white"
            >
              {/* ?´ë?ì§€ */}
              <div className="relative">
                <img
                  src={i.imageUrl || "https://picsum.photos/400/300?random=" + i.id}
                  alt=""
                  className="w-full h-[200px] object-cover rounded-xl"
                  loading="lazy"
                  onError={(e) => {
                    console.log('[MarketPage_AI_AutoCategory] ?´ë?ì§€ ë¡œë“œ ?¤íŒ¨:', i.imageUrl);
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
                {/* AI ë¶„ì„ ?íƒœ ?œì‹œ */}
                {i.aiAnalysisCompleted && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                    ?§  AI
                  </div>
                )}
                {i.aiError && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                    ???¤ë¥˜
                  </div>
                )}
              </div>

              {/* ?í’ˆ ?•ë³´ */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="font-semibold text-base line-clamp-2">{i.title}</div>
                
                {/* ì¹´í…Œê³ ë¦¬ & ë¸Œëœ??*/}
                <div className="text-sm text-slate-600">
                  ?“‚ {i.category || "ê¸°í?"}
                  {i.aiTags?.brand && ` | ?·ï¸?${i.aiTags.brand}`}
                </div>

                {/* AI ê°€ê²?ì¶”ì • */}
                {i.aiTags?.priceHint && (
                  <div className="text-sm font-bold text-green-600">
                    ?’° {i.aiTags.priceHint}
                  </div>
                )}

                {/* AI ë¶„ì„ ?ì„¸ ?•ë³´ */}
                {i.aiTags && (
                  <div className="text-xs text-slate-500 space-y-1">
                    {i.aiTags.color && <div>?¨ ?‰ìƒ: {i.aiTags.color}</div>}
                    {i.aiTags.condition && <div>â­??íƒœ: {i.aiTags.condition}</div>}
                  </div>
                )}

                {/* AI ?œê·¸ */}
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

                {/* AI ë¶„ì„ ?¤ë¥˜ */}
                {i.aiError && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    ??AI ë¶„ì„ ?¤ë¥˜: {i.aiError}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ?˜ë‹¨ ?•ë³´ */}
      <div className="mt-8 text-center text-xs text-slate-500">
        <div>?§  AI ?ë™ ë¶„ë¥˜ ?œìŠ¤??| OpenAI Vision API ê¸°ë°˜</div>
        <div>?“‚ ì¹´í…Œê³ ë¦¬: ì¶•êµ¬?? ? ë‹ˆ?? ê³? ?©í’ˆ, ê¸°í?</div>
        <div>?·ï¸??ë™ ?œê·¸ ?ì„± ë°?ê°€ê²?ì¶”ì • ì§€??/div>
      </div>
    </div>
  );
};

export default MarketPage_AI_AutoCategory;
