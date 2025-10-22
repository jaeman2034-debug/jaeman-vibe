import React, { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";

type Dashboard = {
  summary: string;
  riskSellers: string[];
  highTrust: string[];
  avgTrust: number;
  trend: string;
  productCount: number;
  sellerCount: number;
  avgPrice: number;
  highTrustRatio: number;
  lowTrustRatio: number;
  topCategories: [string, number][];
  topBrands: [string, number][];
  topSellers: [string, number][];
  recommendations: string[];
  alerts: string[];
  insights: {
    topCategory: string;
    topBrand: string;
    mostActiveSeller: string;
  };
  updatedAt?: any;
  lastAnalyzedAt?: any;
};

const AdminTrustDashboard: React.FC = () => {
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  const app = getApps().length ? getApps()[0] : initializeApp(cfg);
  const db = getFirestore(app);

  const [report, setReport] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(doc(db, "dashboard", "summary"), (snap) => {
      if (snap.exists()) {
        setReport(snap.data() as Dashboard);
      }
      setLoading(false);
    }, (error) => {
      console.error("Dashboard subscription error:", error);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  // ?�?�보??리포???�로고침
  const refreshReport = async () => {
    setRefreshing(true);
    try {
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const functionUrl = `https://asia-northeast3-${projectId}.cloudfunctions.net/aiDashboardReport`;
      
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({})
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      console.log("Dashboard report refreshed:", data);
    } catch (error) {
      console.error("Failed to refresh dashboard report:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="text-center py-8">
          <div className="text-slate-500">?�� AI ?�?�보???�이?��? 불러?�는 �?..</div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="text-center py-8">
          <div className="text-slate-500 mb-4">?�� ?�?�보???�이?��? ?�습?�다.</div>
          <button
            onClick={refreshReport}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            {refreshing ? "분석 �?.." : "AI 리포???�성"}
          </button>
        </div>
      </div>
    );
  }

  // 차트 ?�이??준�?  const trustDistributionData = [
    { name: "?��? ?�뢰 (80+)", value: report.highTrustRatio, color: "#10b981" },
    { name: "보통 ?�뢰 (50-79)", value: 100 - report.highTrustRatio - report.lowTrustRatio, color: "#f59e0b" },
    { name: "??? ?�뢰 (50-)", value: report.lowTrustRatio, color: "#ef4444" }
  ];

  const categoryData = report.topCategories.map(([name, value]) => ({
    name: name.length > 8 ? name.substring(0, 8) + "..." : name,
    value: value
  }));

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold mb-2">?�� AI 거래 ?�?�보??/h1>
          <p className="text-slate-600">YAGO VIBE ?�체 거래 ?�태 모니?�링 �?AI 분석</p>
        </div>
        <button
          onClick={refreshReport}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600"
        >
          {refreshing ? "?�� 분석 �?.." : "?�� 리포???�로고침"}
        </button>
      </div>

      {/* ?�체 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{report.productCount}</div>
          <div className="text-sm text-slate-600">�??�품 ??/div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="text-2xl font-bold text-green-600">{report.sellerCount}</div>
          <div className="text-sm text-slate-600">�??�매????/div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="text-2xl font-bold text-purple-600">{report.avgTrust}</div>
          <div className="text-sm text-slate-600">?�균 ?�뢰??/div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="text-2xl font-bold text-orange-600">
            {report.avgPrice > 0 ? `${Math.round(report.avgPrice / 10000)}만원` : '미정'}
          </div>
          <div className="text-sm text-slate-600">?�균 가�?/div>
        </div>
      </div>

      {/* AI 분석 리포??*/}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?�� AI ?�체 분석</h2>
          <p className="text-slate-700 mb-4">{report.summary}</p>
          <div className="text-sm text-slate-600 italic">
            ?�� ?�렌?? {report.trend}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?�� ?�뢰??분포</h2>
          <div className="space-y-3">
            {trustDistributionData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded mr-2" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-slate-700">{item.name}</span>
                </div>
                <span className="text-sm font-semibold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ?�험 ?��? �??�수 ?�매??*/}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4 text-red-600">?�️ ?�험 ?�매??/h2>
          {report.riskSellers && report.riskSellers.length > 0 ? (
            <div className="space-y-2">
              {report.riskSellers.map((sellerId, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <span className="text-sm font-mono text-red-700">{sellerId}</span>
                  <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">?�험</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">???�험 ?�매???�음</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4 text-emerald-600">?�� ?�수 ?�매??/h2>
          {report.highTrust && report.highTrust.length > 0 ? (
            <div className="space-y-2">
              {report.highTrust.map((sellerId, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-emerald-50 rounded">
                  <span className="text-sm font-mono text-emerald-700">{sellerId}</span>
                  <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded">?�수</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">?�� ?�수 ?�매???�이???�음</p>
          )}
        </div>
      </div>

      {/* ?�기 카테고리 �?브랜??*/}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?�� ?�기 카테고리</h2>
          <div className="space-y-2">
            {report.topCategories.map(([category, count], index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{category}</span>
                <span className="text-sm font-semibold text-blue-600">{count}�?/span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?���??�기 브랜??/h2>
          <div className="space-y-2">
            {report.topBrands.map(([brand, count], index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{brand}</span>
                <span className="text-sm font-semibold text-green-600">{count}�?/span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI 권장?�항 �?주의?�항 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4 text-blue-600">?�� AI 권장?�항</h2>
          {report.recommendations && report.recommendations.length > 0 ? (
            <ul className="space-y-2">
              {report.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">??/span>
                  <span className="text-sm text-slate-700">{rec}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">권장?�항 ?�음</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4 text-amber-600">?�� 주의?�항</h2>
          {report.alerts && report.alerts.length > 0 ? (
            <ul className="space-y-2">
              {report.alerts.map((alert, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-amber-500 mr-2">??/span>
                  <span className="text-sm text-slate-700">{alert}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">주의?�항 ?�음</p>
          )}
        </div>
      </div>

      {/* ?�사?�트 ?�약 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4">?�� 주요 ?�사?�트</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-slate-600">?�기 카테고리</div>
            <div className="text-lg font-bold text-blue-600">{report.insights.topCategory}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-600">?�기 브랜??/div>
            <div className="text-lg font-bold text-green-600">{report.insights.topBrand}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-600">?�발???�매??/div>
            <div className="text-lg font-bold text-purple-600">{report.insights.mostActiveSeller}</div>
          </div>
        </div>
      </div>

      {/* ?�단 ?�보 */}
      <div className="text-center text-xs text-slate-500 mt-8">
        <div>?�� AI 거래 ?�?�보??| OpenAI GPT-4o-mini 기반 종합 분석</div>
        <div>?�� 마�?�??�데?�트: {report.lastAnalyzedAt ? 
          new Date(report.lastAnalyzedAt.toDate()).toLocaleString() : 
          '?�보 ?�음'
        }</div>
        <div>?���??�시�??�험 ?��? �?거래 ?�전??모니?�링</div>
      </div>
    </div>
  );
};

export default AdminTrustDashboard;
