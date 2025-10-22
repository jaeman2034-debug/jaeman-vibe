/**
 * ?�� AI ?�동 거래 리포???�션
 * 
 * OpenAI가 ?�성??주간 거래 ?�약???�시?�니??
 */

import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs, getFirestore } from "firebase/firestore";
import { Brain, TrendingUp, Calendar } from "lucide-react";

const db = getFirestore();

export default function AIReportSection() {
  const [latestReport, setLatestReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestReport = async () => {
      try {
        const q = query(
          collection(db, "reports"),
          orderBy("generatedAt", "desc"),
          limit(1)
        );
        
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const report = { id: snap.docs[0].id, ...snap.docs[0].data() };
          setLatestReport(report);
        }
      } catch (error) {
        console.error("AI 리포??조회 ?�패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestReport();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-md p-6 border border-purple-100 animate-pulse">
        <div className="h-6 bg-purple-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-purple-100 rounded w-full mb-2"></div>
        <div className="h-4 bg-purple-100 rounded w-2/3"></div>
      </div>
    );
  }

  if (!latestReport || !latestReport.aiSummary) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-md p-6 border border-purple-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Brain size={24} className="text-purple-600" />
          ?�� AI 주간 리포??        </h3>
        <p className="text-gray-600">
          ?�직 ?�성??리포?��? ?�습?�다. 매주 ?�요???�벽 4?�에 ?�동?�로 ?�성?�니??
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-md p-6 border border-purple-100">
      {/* ?�더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Brain size={24} className="text-purple-600" />
          ?�� AI 주간 거래 리포??        </h3>
        <span className="text-xs bg-purple-200 text-purple-700 px-3 py-1 rounded-full font-semibold">
          Auto-Generated
        </span>
      </div>

      {/* AI ?�약 문장 */}
      <div className="bg-white rounded-xl p-4 mb-4 border border-purple-100">
        <p className="text-gray-800 leading-relaxed font-medium">
          {latestReport.aiSummary}
        </p>
      </div>

      {/* 주요 ?�계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600 mb-1">
            <TrendingUp size={14} />
            <span>�?거래</span>
          </div>
          <div className="text-xl font-bold text-gray-800">
            {latestReport.totalSales || 0}�?          </div>
        </div>

        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-xs text-gray-600 mb-1">?�료</div>
          <div className="text-xl font-bold text-green-600">
            {latestReport.completedCount || 0}�?          </div>
        </div>

        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-xs text-gray-600 mb-1">?�균 ?�뢰??/div>
          <div className="text-xl font-bold text-purple-600">
            {latestReport.avgTrust || 0}??          </div>
        </div>

        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-xs text-gray-600 mb-1">?�성 ?�매??/div>
          <div className="text-xl font-bold text-blue-600">
            {latestReport.sellerCount || 0}�?          </div>
        </div>
      </div>

      {/* ?�기 카테고리 */}
      {latestReport.topCategories && latestReport.topCategories.length > 0 && (
        <div className="mt-4 bg-white rounded-xl p-3">
          <div className="text-xs text-gray-600 mb-2">?�� ?�기 카테고리 Top 3</div>
          <div className="flex gap-2">
            {latestReport.topCategories.map((cat: string, idx: number) => (
              <span
                key={idx}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold"
              >
                {idx + 1}. {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ?�성 ?�간 */}
      {latestReport.generatedAt && (
        <div className="mt-3 text-xs text-gray-500 flex items-center justify-center gap-1">
          <Calendar size={12} />
          <span>
            ?�성: {latestReport.generatedAt.toDate?.().toLocaleString("ko-KR") || "?�보 ?�음"}
          </span>
        </div>
      )}
    </div>
  );
}

