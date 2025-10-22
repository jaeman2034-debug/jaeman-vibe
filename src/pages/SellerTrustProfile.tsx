import React, { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy } from "firebase/firestore";

type Seller = {
  id: string;
  sellerScore: number;
  summary: string;
  strengths: string[];
  risks: string[];
  specialties: string[];
  recommendations: string[];
  avgTrust: number;
  avgPrice: number;
  itemCount: number;
  categoryCount: number;
  brandCount: number;
  categories: string[];
  brands: string[];
  updatedAt?: any;
  lastEvaluatedAt?: any;
};

const SellerTrustProfile: React.FC = () => {
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  const app = getApps().length ? getApps()[0] : initializeApp(cfg);
  const db = getFirestore(app);

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "sellers"), orderBy("sellerScore", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: Seller[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      setSellers(arr);
      setLoading(false);
    }, (error) => {
      console.error("Firestore subscription error:", error);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  // ?�터링된 ?�매?�들
  const filteredSellers = React.useMemo(() => {
    switch (selectedFilter) {
      case "high":
        return sellers.filter(s => s.sellerScore >= 80);
      case "medium":
        return sellers.filter(s => s.sellerScore >= 60 && s.sellerScore < 80);
      case "low":
        return sellers.filter(s => s.sellerScore < 60);
      case "new":
        return sellers.filter(s => s.itemCount <= 3);
      case "experienced":
        return sellers.filter(s => s.itemCount >= 10);
      default:
        return sellers;
    }
  }, [sellers, selectedFilter]);

  // ?�계 ?�보
  const stats = React.useMemo(() => {
    const total = sellers.length;
    const highTrust = sellers.filter(s => s.sellerScore >= 80).length;
    const mediumTrust = sellers.filter(s => s.sellerScore >= 60 && s.sellerScore < 80).length;
    const lowTrust = sellers.filter(s => s.sellerScore < 60).length;
    const avgScore = total > 0 ? Math.round(sellers.reduce((sum, s) => sum + s.sellerScore, 0) / total) : 0;
    const totalItems = sellers.reduce((sum, s) => sum + s.itemCount, 0);
    
    return { total, highTrust, mediumTrust, lowTrust, avgScore, totalItems };
  }, [sellers]);

  // ?�뢰???�급 ?�상
  const getTrustColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getTrustBgColor = (score: number) => {
    if (score >= 80) return "bg-emerald-100 text-emerald-700";
    if (score >= 60) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const getTrustLabel = (score: number) => {
    if (score >= 80) return "매우 ?�뢰";
    if (score >= 60) return "보통";
    return "주의 ?�요";
  };

  return (
    <div className="mx-auto max-w-6xl p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold mb-2">?�� AI ?�매???�뢰 ?�로??/h1>
        <p className="text-slate-600 mb-4">AI가 분석???�매?�별 ?�뢰?��? 거래 ?�턴???�인?�세??</p>
        
        {/* ?�계 ?�보 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-sm text-slate-600">�??�매??/div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-emerald-600">{stats.highTrust}</div>
            <div className="text-sm text-slate-600">?��? ?�뢰</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-amber-600">{stats.mediumTrust}</div>
            <div className="text-sm text-slate-600">보통 ?�뢰</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-slate-800">{stats.avgScore}</div>
            <div className="text-sm text-slate-600">?�균 ?�수</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{stats.totalItems}</div>
            <div className="text-sm text-slate-600">�??�품 ??/div>
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
          ?�체 ({sellers.length})
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
          보통 ?�뢰 ({stats.mediumTrust})
        </button>
        <button
          onClick={() => setSelectedFilter("low")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "low" 
              ? "bg-red-500 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          주의 ?�요 ({stats.lowTrust})
        </button>
        <button
          onClick={() => setSelectedFilter("new")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "new" 
              ? "bg-blue-500 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          ?�규 ?�매??({sellers.filter(s => s.itemCount <= 3).length})
        </button>
        <button
          onClick={() => setSelectedFilter("experienced")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "experienced" 
              ? "bg-purple-500 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          경험 많�? ?�매??({sellers.filter(s => s.itemCount >= 10).length})
        </button>
      </div>

      {/* ?�매???�로??목록 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-slate-500">?�� ?�매???�로?�을 불러?�는 �?..</div>
        </div>
      ) : filteredSellers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-slate-500">
            {selectedFilter === "all" 
              ? "?�� ?�록???�매???�로?�이 ?�습?�다." 
              : "?�� ?�당 조건??맞는 ?�매?��? ?�습?�다."}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSellers.map((seller) => (
            <div
              key={seller.id}
              className="border rounded-2xl p-6 bg-white hover:shadow-md transition-shadow"
            >
              {/* ?�매???�더 */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">?�� ?�매??ID</h2>
                  <div className="text-sm text-slate-600 font-mono">{seller.id}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${getTrustBgColor(seller.sellerScore)}`}>
                  {seller.sellerScore}??                </div>
              </div>

              {/* 기본 ?�계 */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-slate-50 p-2 rounded">
                  <div className="font-semibold text-slate-700">?�균 ?�뢰??/div>
                  <div className={`font-bold ${getTrustColor(seller.avgTrust)}`}>
                    {seller.avgTrust}??                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="font-semibold text-slate-700">?�록 ?�품</div>
                  <div className="font-bold text-slate-800">{seller.itemCount}�?/div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="font-semibold text-slate-700">?�균 가�?/div>
                  <div className="font-bold text-slate-800">
                    {seller.avgPrice > 0 ? `${seller.avgPrice.toLocaleString()}?? : '미정'}
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="font-semibold text-slate-700">카테고리</div>
                  <div className="font-bold text-slate-800">{seller.categoryCount}�?/div>
                </div>
              </div>

              {/* AI ?�약 */}
              <div className="mb-4">
                <div className="text-sm font-semibold text-slate-700 mb-2">?�� AI 분석 ?�약</div>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                  {seller.summary}
                </p>
              </div>

              {/* 강점 */}
              {seller.strengths && seller.strengths.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-emerald-700 mb-1">??강점</div>
                  <div className="text-xs text-emerald-600">
                    {seller.strengths.map((strength, index) => (
                      <span key={index} className="inline-block bg-emerald-100 text-emerald-700 px-2 py-1 rounded mr-1 mb-1">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ?�문 분야 */}
              {seller.specialties && seller.specialties.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-blue-700 mb-1">?�� ?�문 분야</div>
                  <div className="text-xs text-blue-600">
                    {seller.specialties.map((specialty, index) => (
                      <span key={index} className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded mr-1 mb-1">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 주의??*/}
              {seller.risks && seller.risks.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-amber-700 mb-1">?�️ 주의??/div>
                  <div className="text-xs text-amber-600">
                    {seller.risks.map((risk, index) => (
                      <span key={index} className="inline-block bg-amber-100 text-amber-700 px-2 py-1 rounded mr-1 mb-1">
                        {risk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 거래 권장?�항 */}
              {seller.recommendations && seller.recommendations.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-purple-700 mb-1">?�� 거래 권장?�항</div>
                  <ul className="text-xs text-purple-600 list-disc list-inside">
                    {seller.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ?�뢰???�급 */}
              <div className="flex items-center justify-between">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${getTrustBgColor(seller.sellerScore)}`}>
                  {getTrustLabel(seller.sellerScore)}
                </div>
                <div className="text-xs text-slate-500">
                  마�?�??��?: {seller.lastEvaluatedAt ? 
                    new Date(seller.lastEvaluatedAt.toDate()).toLocaleDateString() : 
                    '?�보 ?�음'
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ?�단 ?�보 */}
      <div className="text-center text-xs text-slate-500 mt-8">
        <div>?�� AI ?�매???�뢰 ?�로???�스??| OpenAI GPT-4o-mini 기반</div>
        <div>?�� 분석 ??��: ?�적 거래, ?�균 ?�뢰?? 가�??�턴, 카테고리 ?�양??/div>
        <div>?���??�전??거래�??�한 AI 기반 ?�매???�뢰???��?</div>
      </div>
    </div>
  );
};

export default SellerTrustProfile;
