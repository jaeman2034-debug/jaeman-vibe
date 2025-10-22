/**
 * ?�� ?�산 리포??컴포?�트
 * 
 * 관리자 ?�?�보?�에???�일/?�별 ?�산 ?�황 ?�시
 */

import React, { useEffect, useState } from "react";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { DollarSign, TrendingUp, Users, Calendar, RefreshCw } from "lucide-react";

const db = getFirestore();
const functions = getFunctions();

export default function SettlementReport() {
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [monthlyReport, setMonthlyReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().toISOString().slice(0, 7);

  // ?�일 리포??조회
  const fetchDailyReport = async () => {
    try {
      const ref = doc(db, "reports", `daily_${today}`);
      const snap = await getDoc(ref);
      
      if (snap.exists()) {
        setDailyReport(snap.data());
      } else {
        setDailyReport(null);
      }
    } catch (error) {
      console.error("?�일 리포??조회 ?�패:", error);
    }
  };

  // ?�별 ?�계 조회
  const fetchMonthlyReport = async () => {
    try {
      const getMonthlySettlement = httpsCallable(functions, "getMonthlySettlement");
      const result = await getMonthlySettlement({ month: currentMonth });
      const data = result.data as any;
      
      if (data.success) {
        setMonthlyReport(data);
      }
    } catch (error) {
      console.error("?�별 ?�계 조회 ?�패:", error);
    }
  };

  // ?�동 ?�산 ?�리�?  const handleTriggerSettlement = async () => {
    if (!confirm("지�??�동 ?�산???�행?�시겠습?�까?")) {
      return;
    }

    try {
      setTriggering(true);
      const triggerSettlement = httpsCallable(functions, "triggerSettlement");
      const result = await triggerSettlement({});
      const data = result.data as any;

      if (data.success) {
        alert(data.message);
        // 리포???�로고침
        await fetchDailyReport();
        await fetchMonthlyReport();
      }
    } catch (error: any) {
      console.error("?�동 ?�산 ?�패:", error);
      alert(`?�산 ?�패: ${error.message}`);
    } finally {
      setTriggering(false);
    }
  };

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      await Promise.all([fetchDailyReport(), fetchMonthlyReport()]);
      setLoading(false);
    };
    loadReports();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ?�일 ?�산 리포??*/}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-md p-6 border border-green-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <DollarSign size={24} className="text-green-600" />
            ?�늘???�산 ?�약
            <span className="text-sm font-normal text-gray-500">({today})</span>
          </h3>
          
          <button
            onClick={handleTriggerSettlement}
            disabled={triggering}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={triggering ? "animate-spin" : ""} />
            {triggering ? "?�산 �?.." : "?�동 ?�산"}
          </button>
        </div>

        {dailyReport ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={20} className="text-green-600" />
                <span className="text-sm text-gray-600">�??�산 금액</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {dailyReport.totalPayout?.toLocaleString()}??              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} className="text-blue-600" />
                <span className="text-sm text-gray-600">?�산 건수</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {dailyReport.totalCount}�?              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Users size={20} className="text-purple-600" />
                <span className="text-sm text-gray-600">?�매????/span>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {dailyReport.sellerCount}�?              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>?�� ?�늘 ?�산 ?�역???�습?�다.</p>
            <p className="text-sm mt-2">매일 ?�벽 3?�에 ?�동 ?�산???�행?�니??</p>
          </div>
        )}

        {/* ?�매?�별 ?�세 */}
        {dailyReport && dailyReport.detail && dailyReport.detail.length > 0 && (
          <div className="mt-4 bg-white rounded-xl p-4">
            <h4 className="font-semibold text-gray-700 mb-2">?�매?�별 ?�세</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {dailyReport.detail.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-sm border-b last:border-0 pb-2 last:pb-0"
                >
                  <span className="text-gray-600">
                    ?�매??{item.sellerId.slice(-6)} ({item.count}�?
                  </span>
                  <span className="font-semibold text-green-600">
                    {item.payout.toLocaleString()}??                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ?�별 ?�산 ?�계 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-md p-6 border border-blue-100">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Calendar size={24} className="text-blue-600" />
          ?�번 ???�산 ?�계
          <span className="text-sm font-normal text-gray-500">
            ({currentMonth})
          </span>
        </h3>

        {monthlyReport ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={20} className="text-blue-600" />
                  <span className="text-sm text-gray-600">??�??�산??/span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {monthlyReport.totalPayout?.toLocaleString()}??                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={20} className="text-green-600" />
                  <span className="text-sm text-gray-600">???�산 건수</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {monthlyReport.totalCount}�?                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={20} className="text-purple-600" />
                  <span className="text-sm text-gray-600">?�성 ?�매??/span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {monthlyReport.sellerCount}�?                </div>
              </div>
            </div>

            {/* Top ?�매??*/}
            {monthlyReport.topSellers && monthlyReport.topSellers.length > 0 && (
              <div className="bg-white rounded-xl p-4">
                <h4 className="font-semibold text-gray-700 mb-3">?�� Top ?�매??/h4>
                <div className="space-y-2">
                  {monthlyReport.topSellers.slice(0, 5).map((seller: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-sm border-b last:border-0 pb-2 last:pb-0"
                    >
                      <span className="text-gray-600">
                        {idx + 1}. ?�매??{seller.sellerId.slice(-6)} ({seller.count}�?
                      </span>
                      <span className="font-semibold text-blue-600">
                        {seller.payout.toLocaleString()}??                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>?�� ?�번 ???�산 ?�역???�습?�다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

