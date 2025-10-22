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

  // ?ÑÌÑ∞ÎßÅÎêú ?êÎß§?êÎì§
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

  // ?µÍ≥Ñ ?ïÎ≥¥
  const stats = React.useMemo(() => {
    const total = sellers.length;
    const highTrust = sellers.filter(s => s.sellerScore >= 80).length;
    const mediumTrust = sellers.filter(s => s.sellerScore >= 60 && s.sellerScore < 80).length;
    const lowTrust = sellers.filter(s => s.sellerScore < 60).length;
    const avgScore = total > 0 ? Math.round(sellers.reduce((sum, s) => sum + s.sellerScore, 0) / total) : 0;
    const totalItems = sellers.reduce((sum, s) => sum + s.itemCount, 0);
    
    return { total, highTrust, mediumTrust, lowTrust, avgScore, totalItems };
  }, [sellers]);

  // ?†Î¢∞???±Í∏â ?âÏÉÅ
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
    if (score >= 80) return "Îß§Ïö∞ ?†Î¢∞";
    if (score >= 60) return "Î≥¥ÌÜµ";
    return "Ï£ºÏùò ?ÑÏöî";
  };

  return (
    <div className="mx-auto max-w-6xl p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold mb-2">?§ù AI ?êÎß§???†Î¢∞ ?ÑÎ°ú??/h1>
        <p className="text-slate-600 mb-4">AIÍ∞Ä Î∂ÑÏÑù???êÎß§?êÎ≥Ñ ?†Î¢∞?ÑÏ? Í±∞Îûò ?®ÌÑ¥???ïÏù∏?òÏÑ∏??</p>
        
        {/* ?µÍ≥Ñ ?ïÎ≥¥ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-sm text-slate-600">Ï¥??êÎß§??/div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-emerald-600">{stats.highTrust}</div>
            <div className="text-sm text-slate-600">?íÏ? ?†Î¢∞</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-amber-600">{stats.mediumTrust}</div>
            <div className="text-sm text-slate-600">Î≥¥ÌÜµ ?†Î¢∞</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-slate-800">{stats.avgScore}</div>
            <div className="text-sm text-slate-600">?âÍ∑† ?êÏàò</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{stats.totalItems}</div>
            <div className="text-sm text-slate-600">Ï¥??ÅÌíà ??/div>
          </div>
        </div>
      </div>

      {/* ?ÑÌÑ∞ */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "all" 
              ? "bg-slate-800 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          ?ÑÏ≤¥ ({sellers.length})
        </button>
        <button
          onClick={() => setSelectedFilter("high")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "high" 
              ? "bg-emerald-500 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          ?íÏ? ?†Î¢∞ ({stats.highTrust})
        </button>
        <button
          onClick={() => setSelectedFilter("medium")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "medium" 
              ? "bg-amber-500 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          Î≥¥ÌÜµ ?†Î¢∞ ({stats.mediumTrust})
        </button>
        <button
          onClick={() => setSelectedFilter("low")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "low" 
              ? "bg-red-500 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          Ï£ºÏùò ?ÑÏöî ({stats.lowTrust})
        </button>
        <button
          onClick={() => setSelectedFilter("new")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "new" 
              ? "bg-blue-500 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          ?†Í∑ú ?êÎß§??({sellers.filter(s => s.itemCount <= 3).length})
        </button>
        <button
          onClick={() => setSelectedFilter("experienced")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            selectedFilter === "experienced" 
              ? "bg-purple-500 text-white" 
              : "bg-white text-slate-600 border hover:bg-slate-50"
          }`}
        >
          Í≤ΩÌóò ÎßéÏ? ?êÎß§??({sellers.filter(s => s.itemCount >= 10).length})
        </button>
      </div>

      {/* ?êÎß§???ÑÎ°ú??Î™©Î°ù */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-slate-500">?§ù ?êÎß§???ÑÎ°ú?ÑÏùÑ Î∂àÎü¨?§Îäî Ï§?..</div>
        </div>
      ) : filteredSellers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-slate-500">
            {selectedFilter === "all" 
              ? "?§ù ?±Î°ù???êÎß§???ÑÎ°ú?ÑÏù¥ ?ÜÏäµ?àÎã§." 
              : "?îç ?¥Îãπ Ï°∞Í±¥??ÎßûÎäî ?êÎß§?êÍ? ?ÜÏäµ?àÎã§."}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSellers.map((seller) => (
            <div
              key={seller.id}
              className="border rounded-2xl p-6 bg-white hover:shadow-md transition-shadow"
            >
              {/* ?êÎß§???§Îçî */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">?ë§ ?êÎß§??ID</h2>
                  <div className="text-sm text-slate-600 font-mono">{seller.id}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${getTrustBgColor(seller.sellerScore)}`}>
                  {seller.sellerScore}??                </div>
              </div>

              {/* Í∏∞Î≥∏ ?µÍ≥Ñ */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-slate-50 p-2 rounded">
                  <div className="font-semibold text-slate-700">?âÍ∑† ?†Î¢∞??/div>
                  <div className={`font-bold ${getTrustColor(seller.avgTrust)}`}>
                    {seller.avgTrust}??                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="font-semibold text-slate-700">?±Î°ù ?ÅÌíà</div>
                  <div className="font-bold text-slate-800">{seller.itemCount}Í∞?/div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="font-semibold text-slate-700">?âÍ∑† Í∞ÄÍ≤?/div>
                  <div className="font-bold text-slate-800">
                    {seller.avgPrice > 0 ? `${seller.avgPrice.toLocaleString()}?? : 'ÎØ∏Ï†ï'}
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="font-semibold text-slate-700">Ïπ¥ÌÖåÍ≥†Î¶¨</div>
                  <div className="font-bold text-slate-800">{seller.categoryCount}Í∞?/div>
                </div>
              </div>

              {/* AI ?îÏïΩ */}
              <div className="mb-4">
                <div className="text-sm font-semibold text-slate-700 mb-2">?ß† AI Î∂ÑÏÑù ?îÏïΩ</div>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                  {seller.summary}
                </p>
              </div>

              {/* Í∞ïÏ†ê */}
              {seller.strengths && seller.strengths.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-emerald-700 mb-1">??Í∞ïÏ†ê</div>
                  <div className="text-xs text-emerald-600">
                    {seller.strengths.map((strength, index) => (
                      <span key={index} className="inline-block bg-emerald-100 text-emerald-700 px-2 py-1 rounded mr-1 mb-1">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ?ÑÎ¨∏ Î∂ÑÏïº */}
              {seller.specialties && seller.specialties.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-blue-700 mb-1">?éØ ?ÑÎ¨∏ Î∂ÑÏïº</div>
                  <div className="text-xs text-blue-600">
                    {seller.specialties.map((specialty, index) => (
                      <span key={index} className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded mr-1 mb-1">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ï£ºÏùò??*/}
              {seller.risks && seller.risks.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-amber-700 mb-1">?†Ô∏è Ï£ºÏùò??/div>
                  <div className="text-xs text-amber-600">
                    {seller.risks.map((risk, index) => (
                      <span key={index} className="inline-block bg-amber-100 text-amber-700 px-2 py-1 rounded mr-1 mb-1">
                        {risk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Í±∞Îûò Í∂åÏû•?¨Ìï≠ */}
              {seller.recommendations && seller.recommendations.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-purple-700 mb-1">?í° Í±∞Îûò Í∂åÏû•?¨Ìï≠</div>
                  <ul className="text-xs text-purple-600 list-disc list-inside">
                    {seller.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ?†Î¢∞???±Í∏â */}
              <div className="flex items-center justify-between">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${getTrustBgColor(seller.sellerScore)}`}>
                  {getTrustLabel(seller.sellerScore)}
                </div>
                <div className="text-xs text-slate-500">
                  ÎßàÏ?Îß??âÍ?: {seller.lastEvaluatedAt ? 
                    new Date(seller.lastEvaluatedAt.toDate()).toLocaleDateString() : 
                    '?ïÎ≥¥ ?ÜÏùå'
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ?òÎã® ?ïÎ≥¥ */}
      <div className="text-center text-xs text-slate-500 mt-8">
        <div>?§ù AI ?êÎß§???†Î¢∞ ?ÑÎ°ú???úÏä§??| OpenAI GPT-4o-mini Í∏∞Î∞ò</div>
        <div>?ìä Î∂ÑÏÑù ??™©: ?ÑÏ†Å Í±∞Îûò, ?âÍ∑† ?†Î¢∞?? Í∞ÄÍ≤??®ÌÑ¥, Ïπ¥ÌÖåÍ≥†Î¶¨ ?§Ïñë??/div>
        <div>?õ°Ô∏??àÏ†Ñ??Í±∞ÎûòÎ•??ÑÌïú AI Í∏∞Î∞ò ?êÎß§???†Î¢∞???âÍ?</div>
      </div>
    </div>
  );
};

export default SellerTrustProfile;
