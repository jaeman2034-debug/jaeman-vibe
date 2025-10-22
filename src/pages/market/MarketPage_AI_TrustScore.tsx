import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/firebase";

type Item = {
  id: string;
  title: string;
  price?: number;
  imageUrl?: string;
  desc?: string;
  category?: string;
  trustScore?: {
    total: number;
    priceScore: number;
    brandScore: number;
    conditionScore: number;
    descScore: number;
    review: string;
    riskFactors?: string[];
    recommendations?: string[];
  };
  trustEvaluated?: boolean;
  trustError?: string;
  createdAt?: any;
};

const MarketPage_AI_TrustScore: React.FC = () => {

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "marketItems"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: Item[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      setItems(arr);
      setLoading(false);
    }, (error) => {
      console.error("Firestore subscription error:", error);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  // ? ë¢°???‰ê? ?„ë£Œ???í’ˆ??  const graded = useMemo(() => items.filter((i) => i.trustScore), [items]);
  
  // ?„í„°ë§ëœ ?í’ˆ??  const filteredItems = useMemo(() => {
    switch (selectedFilter) {
      case "high":
        return graded.filter(i => (i.trustScore?.total ?? 0) >= 80);
      case "medium":
        return graded.filter(i => (i.trustScore?.total ?? 0) >= 50 && (i.trustScore?.total ?? 0) < 80);
      case "low":
        return graded.filter(i => (i.trustScore?.total ?? 0) < 50);
      case "not-evaluated":
        return items.filter(i => !i.trustScore && !i.trustError);
      case "error":
        return items.filter(i => i.trustError);
      default:
        return graded;
    }
  }, [graded, items, selectedFilter]);

  // ?µê³„ ?•ë³´
  const stats = useMemo(() => {
    const total = items.length;
    const evaluated = graded.length;
    const highTrust = graded.filter(i => (i.trustScore?.total ?? 0) >= 80).length;
    const mediumTrust = graded.filter(i => (i.trustScore?.total ?? 0) >= 50 && (i.trustScore?.total ?? 0) < 80).length;
    const lowTrust = graded.filter(i => (i.trustScore?.total ?? 0) < 50).length;
    const avgScore = evaluated > 0 ? Math.round(graded.reduce((sum, i) => sum + (i.trustScore?.total ?? 0), 0) / evaluated) : 0;
    
    return { total, evaluated, highTrust, mediumTrust, lowTrust, avgScore };
  }, [items, graded]);

  // ? ë¢°???±ê¸‰ ?‰ìƒ
  const getTrustColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getTrustBgColor = (score: number) => {
    if (score >= 80) return "bg-emerald-100 text-emerald-700";
    if (score >= 50) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const getTrustLabel = (score: number) => {
    if (score >= 80) return "ë§¤ìš° ? ë¢°";
    if (score >= 50) return "ë³´í†µ";
    return "ì£¼ì˜ ?”ë§";
  };

  return (
    <div className="mx-auto max-w-6xl p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold mb-2">?§  AI ê±°ë˜ ? ë¢°???‰ê?</h1>
        <p className="text-slate-600 mb-4">AIê°€ ?ë™?¼ë¡œ ?í’ˆ??? ë¢°?„ë? ë¶„ì„?˜ê³  ?ˆì „ ê±°ë˜ ì§€?˜ë? ?œê³µ?©ë‹ˆ??</p>
        
        {/* ?µê³„ ?•ë³´ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-sm text-slate-600">ì´??í’ˆ</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{stats.evaluated}</div>
            <div className="text-sm text-slate-600">?‰ê? ?„ë£Œ</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-emerald-600">{stats.highTrust}</div>
            <div className="text-sm text-slate-600">?’ì? ? ë¢°</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-slate-800">{stats.avgScore}</div>
            <div className="text-sm text-slate-600">?‰ê·  ?ìˆ˜</div>
          </div>
        </div>
      </div>

      {/* ?„í„° */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "all" 
              ? "bg-slate-800 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          ?„ì²´ ({graded.length})
        </button>
        <button
          onClick={() => setSelectedFilter("high")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "high" 
              ? "bg-emerald-500 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          ?’ì? ? ë¢° ({stats.highTrust})
        </button>
        <button
          onClick={() => setSelectedFilter("medium")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "medium" 
              ? "bg-amber-500 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          ë³´í†µ ({stats.mediumTrust})
        </button>
        <button
          onClick={() => setSelectedFilter("low")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "low" 
              ? "bg-red-500 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          ì£¼ì˜ ?”ë§ ({stats.lowTrust})
        </button>
        <button
          onClick={() => setSelectedFilter("not-evaluated")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "not-evaluated" 
              ? "bg-gray-500 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          ë¯¸í‰ê°€ ({items.filter(i => !i.trustScore && !i.trustError).length})
        </button>
      </div>

      {/* ?í’ˆ ëª©ë¡ */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-slate-500">?“¦ ?í’ˆ ëª©ë¡??ë¶ˆëŸ¬?¤ëŠ” ì¤?..</div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-slate-500">
            {selectedFilter === "all" 
              ? "?“¦ ?±ë¡???í’ˆ???†ìŠµ?ˆë‹¤." 
              : "?” ?´ë‹¹ ì¡°ê±´??ë§ëŠ” ?í’ˆ???†ìŠµ?ˆë‹¤."}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border p-4 bg-white hover:shadow-md transition-shadow"
            >
              {/* ?´ë?ì§€ */}
              <div className="relative mb-3">
                <img
                  src={item.imageUrl || "https://via.placeholder.com/400x300?text=No+Image"}
                  alt=""
                  className="w-full h-[200px] object-cover rounded-xl"
                  loading="lazy"
                />
                {/* ? ë¢°??ë°°ì? */}
                {item.trustScore && (
                  <div className="absolute top-2 right-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${getTrustBgColor(item.trustScore.total)}`}>
                      {item.trustScore.total}??                    </div>
                  </div>
                )}
              </div>

              {/* ?í’ˆ ?•ë³´ */}
              <div className="space-y-2">
                <div className="font-semibold text-lg line-clamp-2">{item.title}</div>
                
                <div className="text-sm text-slate-600">
                  {item.price && `?’° ${item.price.toLocaleString()}??}
                  {item.category && ` | ?“‚ ${item.category}`}
                </div>

                {/* ? ë¢°???‰ê? ê²°ê³¼ */}
                {item.trustScore ? (
                  <div className="space-y-2">
                    {/* ì´ì  */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">ì´?? ë¢°??/span>
                      <span className={`text-lg font-bold ${getTrustColor(item.trustScore.total)}`}>
                        {item.trustScore.total}/100
                      </span>
                    </div>

                    {/* ?¸ë? ?ìˆ˜ */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span>ê°€ê²??ì •??/span>
                        <span className={getTrustColor(item.trustScore.priceScore)}>
                          {item.trustScore.priceScore}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>ë¸Œëœ??? ë¢°??/span>
                        <span className={getTrustColor(item.trustScore.brandScore)}>
                          {item.trustScore.brandScore}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>?íƒœ ? ë¢°??/span>
                        <span className={getTrustColor(item.trustScore.conditionScore)}>
                          {item.trustScore.conditionScore}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>?¤ëª… êµ¬ì²´??/span>
                        <span className={getTrustColor(item.trustScore.descScore)}>
                          {item.trustScore.descScore}
                        </span>
                      </div>
                    </div>

                    {/* AI ë¦¬ë·° */}
                    <div className="text-xs italic text-slate-600 bg-slate-50 p-2 rounded">
                      "{item.trustScore.review}"
                    </div>

                    {/* ?„í—˜ ?”ì†Œ */}
                    {item.trustScore.riskFactors && item.trustScore.riskFactors.length > 0 && (
                      <div className="text-xs">
                        <div className="font-semibold text-red-600 mb-1">? ï¸ ì£¼ì˜?¬í•­:</div>
                        <ul className="list-disc list-inside text-red-600">
                          {item.trustScore.riskFactors.map((risk, index) => (
                            <li key={index}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* ê°œì„  ?œì•ˆ */}
                    {item.trustScore.recommendations && item.trustScore.recommendations.length > 0 && (
                      <div className="text-xs">
                        <div className="font-semibold text-blue-600 mb-1">?’¡ ê°œì„  ?œì•ˆ:</div>
                        <ul className="list-disc list-inside text-blue-600">
                          {item.trustScore.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* ? ë¢°???±ê¸‰ */}
                    <div className={`px-3 py-1 rounded-full text-xs w-max font-bold ${getTrustBgColor(item.trustScore.total)}`}>
                      {getTrustLabel(item.trustScore.total)}
                    </div>
                  </div>
                ) : item.trustError ? (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    ???‰ê? ?¤ë¥˜: {item.trustError}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                    ??? ë¢°???‰ê? ?€ê¸?ì¤?..
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ?˜ë‹¨ ?•ë³´ */}
      <div className="text-center text-xs text-slate-500 mt-8">
        <div>?§  AI ê±°ë˜ ? ë¢°???‰ê? ?œìŠ¤??| OpenAI GPT-4o-mini + Vision API</div>
        <div>?“Š ?‰ê? ??ª©: ê°€ê²??ì •?? ë¸Œëœ??ì§„ìœ„, ?íƒœ ? ë¢°?? ?¤ëª… êµ¬ì²´??/div>
        <div>?›¡ï¸??ˆì „ ê±°ë˜ë¥??„í•œ AI ê¸°ë°˜ ? ë¢°??ì§€???œê³µ</div>
      </div>
    </div>
  );
};

export default MarketPage_AI_TrustScore;
