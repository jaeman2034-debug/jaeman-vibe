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

  // ?�뢰???��? ?�료???�품??  const graded = useMemo(() => items.filter((i) => i.trustScore), [items]);
  
  // ?�터링된 ?�품??  const filteredItems = useMemo(() => {
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

  // ?�계 ?�보
  const stats = useMemo(() => {
    const total = items.length;
    const evaluated = graded.length;
    const highTrust = graded.filter(i => (i.trustScore?.total ?? 0) >= 80).length;
    const mediumTrust = graded.filter(i => (i.trustScore?.total ?? 0) >= 50 && (i.trustScore?.total ?? 0) < 80).length;
    const lowTrust = graded.filter(i => (i.trustScore?.total ?? 0) < 50).length;
    const avgScore = evaluated > 0 ? Math.round(graded.reduce((sum, i) => sum + (i.trustScore?.total ?? 0), 0) / evaluated) : 0;
    
    return { total, evaluated, highTrust, mediumTrust, lowTrust, avgScore };
  }, [items, graded]);

  // ?�뢰???�급 ?�상
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
    if (score >= 80) return "매우 ?�뢰";
    if (score >= 50) return "보통";
    return "주의 ?�망";
  };

  return (
    <div className="mx-auto max-w-6xl p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold mb-2">?�� AI 거래 ?�뢰???��?</h1>
        <p className="text-slate-600 mb-4">AI가 ?�동?�로 ?�품???�뢰?��? 분석?�고 ?�전 거래 지?��? ?�공?�니??</p>
        
        {/* ?�계 ?�보 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-sm text-slate-600">�??�품</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{stats.evaluated}</div>
            <div className="text-sm text-slate-600">?��? ?�료</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-emerald-600">{stats.highTrust}</div>
            <div className="text-sm text-slate-600">?��? ?�뢰</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-slate-800">{stats.avgScore}</div>
            <div className="text-sm text-slate-600">?�균 ?�수</div>
          </div>
        </div>
      </div>

      {/* ?�터 */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "all" 
              ? "bg-slate-800 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          ?�체 ({graded.length})
        </button>
        <button
          onClick={() => setSelectedFilter("high")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "high" 
              ? "bg-emerald-500 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          ?��? ?�뢰 ({stats.highTrust})
        </button>
        <button
          onClick={() => setSelectedFilter("medium")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "medium" 
              ? "bg-amber-500 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          보통 ({stats.mediumTrust})
        </button>
        <button
          onClick={() => setSelectedFilter("low")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "low" 
              ? "bg-red-500 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          주의 ?�망 ({stats.lowTrust})
        </button>
        <button
          onClick={() => setSelectedFilter("not-evaluated")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "not-evaluated" 
              ? "bg-gray-500 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          미평가 ({items.filter(i => !i.trustScore && !i.trustError).length})
        </button>
      </div>

      {/* ?�품 목록 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-slate-500">?�� ?�품 목록??불러?�는 �?..</div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-slate-500">
            {selectedFilter === "all" 
              ? "?�� ?�록???�품???�습?�다." 
              : "?�� ?�당 조건??맞는 ?�품???�습?�다."}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border p-4 bg-white hover:shadow-md transition-shadow"
            >
              {/* ?��?지 */}
              <div className="relative mb-3">
                <img
                  src={item.imageUrl || "https://via.placeholder.com/400x300?text=No+Image"}
                  alt=""
                  className="w-full h-[200px] object-cover rounded-xl"
                  loading="lazy"
                />
                {/* ?�뢰??배�? */}
                {item.trustScore && (
                  <div className="absolute top-2 right-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${getTrustBgColor(item.trustScore.total)}`}>
                      {item.trustScore.total}??                    </div>
                  </div>
                )}
              </div>

              {/* ?�품 ?�보 */}
              <div className="space-y-2">
                <div className="font-semibold text-lg line-clamp-2">{item.title}</div>
                
                <div className="text-sm text-slate-600">
                  {item.price && `?�� ${item.price.toLocaleString()}??}
                  {item.category && ` | ?�� ${item.category}`}
                </div>

                {/* ?�뢰???��? 결과 */}
                {item.trustScore ? (
                  <div className="space-y-2">
                    {/* 총점 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">�??�뢰??/span>
                      <span className={`text-lg font-bold ${getTrustColor(item.trustScore.total)}`}>
                        {item.trustScore.total}/100
                      </span>
                    </div>

                    {/* ?��? ?�수 */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span>가�??�정??/span>
                        <span className={getTrustColor(item.trustScore.priceScore)}>
                          {item.trustScore.priceScore}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>브랜???�뢰??/span>
                        <span className={getTrustColor(item.trustScore.brandScore)}>
                          {item.trustScore.brandScore}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>?�태 ?�뢰??/span>
                        <span className={getTrustColor(item.trustScore.conditionScore)}>
                          {item.trustScore.conditionScore}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>?�명 구체??/span>
                        <span className={getTrustColor(item.trustScore.descScore)}>
                          {item.trustScore.descScore}
                        </span>
                      </div>
                    </div>

                    {/* AI 리뷰 */}
                    <div className="text-xs italic text-slate-600 bg-slate-50 p-2 rounded">
                      "{item.trustScore.review}"
                    </div>

                    {/* ?�험 ?�소 */}
                    {item.trustScore.riskFactors && item.trustScore.riskFactors.length > 0 && (
                      <div className="text-xs">
                        <div className="font-semibold text-red-600 mb-1">?�️ 주의?�항:</div>
                        <ul className="list-disc list-inside text-red-600">
                          {item.trustScore.riskFactors.map((risk, index) => (
                            <li key={index}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 개선 ?�안 */}
                    {item.trustScore.recommendations && item.trustScore.recommendations.length > 0 && (
                      <div className="text-xs">
                        <div className="font-semibold text-blue-600 mb-1">?�� 개선 ?�안:</div>
                        <ul className="list-disc list-inside text-blue-600">
                          {item.trustScore.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* ?�뢰???�급 */}
                    <div className={`px-3 py-1 rounded-full text-xs w-max font-bold ${getTrustBgColor(item.trustScore.total)}`}>
                      {getTrustLabel(item.trustScore.total)}
                    </div>
                  </div>
                ) : item.trustError ? (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    ???��? ?�류: {item.trustError}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                    ???�뢰???��? ?��?�?..
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ?�단 ?�보 */}
      <div className="text-center text-xs text-slate-500 mt-8">
        <div>?�� AI 거래 ?�뢰???��? ?�스??| OpenAI GPT-4o-mini + Vision API</div>
        <div>?�� ?��? ??��: 가�??�정?? 브랜??진위, ?�태 ?�뢰?? ?�명 구체??/div>
        <div>?���??�전 거래�??�한 AI 기반 ?�뢰??지???�공</div>
      </div>
    </div>
  );
};

export default MarketPage_AI_TrustScore;
