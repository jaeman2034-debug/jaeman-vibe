/**
 * ?�� ?�고 비서 리포??관리자
 * - ?�동 리포???�성 �??�운로드
 * - 리포???�스?�리 조회
 * - PDF 미리보기 �?관�? */

import React, { useEffect, useState } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { httpsCallable, getFunctions } from "firebase/functions";
import app from "@/lib/firebase";

type ReportLog = {
  id: string;
  reportType: string;
  period: {
    start: any;
    end: any;
  };
  stats: {
    newItems: number;
    voiceSessions: number;
    notifications: number;
    errors: number;
    aiRequests: number;
  };
  metrics: {
    successRate: number;
    uniqueUsers: number;
    avgSessionDuration: number;
    topTags: Array<{ tag: string; count: number }>;
  };
  summary: string;
  pdfSize: number;
  generatedAt: any;
};

type Props = {};

export default function ReportManager_AI({}: Props) {
  const [reports, setReports] = useState<ReportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedType, setSelectedType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "reportLogs"), 
        orderBy("generatedAt", "desc"), 
        limit(20)
      );
      const snap = await getDocs(q);
      const fetchedReports: ReportLog[] = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        generatedAt: doc.data().generatedAt?.toDate(),
        period: {
          start: doc.data().period?.start?.toDate(),
          end: doc.data().period?.end?.toDate()
        }
      })) as ReportLog[];
      setReports(fetchedReports);
    } catch (error) {
      console.error("리포??로그 불러?�기 ?�류:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateManualReport = async () => {
    setGeneratingReport(true);
    try {
      const functions = getFunctions(app);
      const manualReportCallable = httpsCallable(functions, 'manualReport');
      
      const result = await manualReportCallable({ type: selectedType });
      console.log("?�동 리포???�성 결과:", result.data);
      
      alert(`${selectedType === 'daily' ? '?�일' : selectedType === 'weekly' ? '주간' : '?�간'} 리포?��? ?�성?�었?�니??`);
      fetchReports(); // ?�로??리포?��? ?�성?????�으므�?목록 ?�로고침
      
    } catch (error) {
      console.error("?�동 리포???�성 ?�류:", error);
      alert(`리포???�성 ?�패: ${(error as Error).message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      // Firebase Storage?�서 PDF ?�운로드
      // ?�제 구현?�서??Firebase Storage URL???�용
      const fileName = `report_${reportId}.pdf`;
      alert(`리포???�운로드: ${fileName}`);
    } catch (error) {
      console.error("리포???�운로드 ?�류:", error);
      alert("리포???�운로드???�패?�습?�다.");
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ko-KR", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return '?�� ?�일';
      case 'weekly': return '?�� 주간';
      case 'monthly': return '?�� ?�간';
      default: return type;
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-blue-100 text-blue-800';
      case 'weekly': return 'bg-green-100 text-green-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">?�� ?�고 비서 리포??관�?/h1>
        <div className="flex items-center gap-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="daily">?�� ?�일 리포??/option>
            <option value="weekly">?�� 주간 리포??/option>
            <option value="monthly">?�� ?�간 리포??/option>
          </select>
          <button
            onClick={generateManualReport}
            disabled={generatingReport}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generatingReport ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ?�성 �?..
              </>
            ) : (
              <>
                ?? 리포???�성
              </>
            )}
          </button>
        </div>
      </div>

      {/* 리포???�성 ?�내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">?�� ?�동 리포???��?�?/h3>
        <div className="text-sm text-blue-800 space-y-1">
          <div>??<strong>?�일 리포??/strong>: 매일 23:59 ?�동 ?�성</div>
          <div>??<strong>주간 리포??/strong>: 매주 ?�요??09:00 ?�동 ?�성</div>
          <div>??<strong>?�간 리포??/strong>: 매월 1??09:00 ?�동 ?�성</div>
          <div>??모든 리포?�는 PDF�??�성?�어 n8n ?�훅?�로 ?�송?�니??/div>
        </div>
      </div>

      {/* 리포???�스?�리 */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">?�� 리포???�스?�리</h2>
          <p className="text-sm text-gray-600">최근 ?�성??리포??목록 (최�? 20�?</p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">리포??로딩 �?..</p>
          </div>
        ) : (
          <div className="divide-y">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">?��</div>
                <p>?�직 ?�성??리포?��? ?�습?�다.</p>
                <p className="text-sm">?�동?�로 리포?��? ?�성?�거???�동 ?��?줄을 기다?�주?�요.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReportTypeColor(report.reportType)}`}>
                          {getReportTypeLabel(report.reportType)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatDate(report.generatedAt)}
                        </span>
                        <span className="text-xs text-gray-500">
                          PDF ?�기: {(report.pdfSize / 1024).toFixed(1)}KB
                        </span>
                      </div>

                      {/* ?�계 ?�약 */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">{report.stats.newItems}</div>
                          <div className="text-xs text-gray-600">?�규 ?�품</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">{report.stats.voiceSessions}</div>
                          <div className="text-xs text-gray-600">?�성 ?�션</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-purple-600">{report.stats.notifications}</div>
                          <div className="text-xs text-gray-600">?�림 ?�송</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-orange-600">{report.metrics.uniqueUsers}</div>
                          <div className="text-xs text-gray-600">고유 ?�용??/div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-red-600">{report.stats.errors}</div>
                          <div className="text-xs text-gray-600">?�러 발생</div>
                        </div>
                      </div>

                      {/* ?�능 지??*/}
                      <div className="flex items-center gap-6 mb-3 text-sm">
                        <span className="text-gray-600">
                          ?�공�? <span className="font-semibold text-green-600">{report.metrics.successRate}%</span>
                        </span>
                        <span className="text-gray-600">
                          ?�균 ?�션: <span className="font-semibold">{report.metrics.avgSessionDuration}�?/span>
                        </span>
                      </div>

                      {/* ?�기 ?�그 */}
                      {report.metrics.topTags.length > 0 && (
                        <div className="mb-3">
                          <div className="text-sm text-gray-600 mb-1">?���??�기 ?�그:</div>
                          <div className="flex flex-wrap gap-1">
                            {report.metrics.topTags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {tag.tag} ({tag.count})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI ?�약 */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">?�� AI 분석 ?�약:</div>
                        <p className="text-sm text-gray-600 line-clamp-2">{report.summary}</p>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => downloadReport(report.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        ?�� ?�운로드
                      </button>
                      <button
                        onClick={() => alert('PDF 미리보기 기능?� 추후 구현 ?�정?�니??')}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        ?���?미리보기
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 리포???�정 ?�내 */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">?�️ 리포???�정</h3>
        <div className="text-sm text-yellow-800 space-y-1">
          <div>??Firebase Functions ?�경 변???�정 ?�요: <code className="bg-yellow-100 px-1 rounded">OPENAI_API_KEY</code></div>
          <div>??n8n ?�훅 ?�정 ?�요: <code className="bg-yellow-100 px-1 rounded">n8n.webhook</code></div>
          <div>??Firebase Storage 권한 ?�정 ?�요 (PDF ?�?�용)</div>
        </div>
      </div>
    </div>
  );
}
