/**
 * ?“ˆ ?¼ê³  ë¹„ì„œ ë¦¬í¬??ê´€ë¦¬ì
 * - ?˜ë™ ë¦¬í¬???ì„± ë°??¤ìš´ë¡œë“œ
 * - ë¦¬í¬???ˆìŠ¤? ë¦¬ ì¡°íšŒ
 * - PDF ë¯¸ë¦¬ë³´ê¸° ë°?ê´€ë¦? */

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
      console.error("ë¦¬í¬??ë¡œê·¸ ë¶ˆëŸ¬?¤ê¸° ?¤ë¥˜:", error);
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
      console.log("?˜ë™ ë¦¬í¬???ì„± ê²°ê³¼:", result.data);
      
      alert(`${selectedType === 'daily' ? '?¼ì¼' : selectedType === 'weekly' ? 'ì£¼ê°„' : '?”ê°„'} ë¦¬í¬?¸ê? ?ì„±?˜ì—ˆ?µë‹ˆ??`);
      fetchReports(); // ?ˆë¡œ??ë¦¬í¬?¸ê? ?ì„±?????ˆìœ¼ë¯€ë¡?ëª©ë¡ ?ˆë¡œê³ ì¹¨
      
    } catch (error) {
      console.error("?˜ë™ ë¦¬í¬???ì„± ?¤ë¥˜:", error);
      alert(`ë¦¬í¬???ì„± ?¤íŒ¨: ${(error as Error).message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  const downloadReport = async (reportId: string) => {
    try {
      // Firebase Storage?ì„œ PDF ?¤ìš´ë¡œë“œ
      // ?¤ì œ êµ¬í˜„?ì„œ??Firebase Storage URL???¬ìš©
      const fileName = `report_${reportId}.pdf`;
      alert(`ë¦¬í¬???¤ìš´ë¡œë“œ: ${fileName}`);
    } catch (error) {
      console.error("ë¦¬í¬???¤ìš´ë¡œë“œ ?¤ë¥˜:", error);
      alert("ë¦¬í¬???¤ìš´ë¡œë“œ???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
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
      case 'daily': return '?“… ?¼ì¼';
      case 'weekly': return '?“Š ì£¼ê°„';
      case 'monthly': return '?“ˆ ?”ê°„';
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
        <h1 className="text-2xl font-bold">?“ˆ ?¼ê³  ë¹„ì„œ ë¦¬í¬??ê´€ë¦?/h1>
        <div className="flex items-center gap-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="daily">?“… ?¼ì¼ ë¦¬í¬??/option>
            <option value="weekly">?“Š ì£¼ê°„ ë¦¬í¬??/option>
            <option value="monthly">?“ˆ ?”ê°„ ë¦¬í¬??/option>
          </select>
          <button
            onClick={generateManualReport}
            disabled={generatingReport}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generatingReport ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ?ì„± ì¤?..
              </>
            ) : (
              <>
                ?? ë¦¬í¬???ì„±
              </>
            )}
          </button>
        </div>
      </div>

      {/* ë¦¬í¬???ì„± ?ˆë‚´ */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">?“‹ ?ë™ ë¦¬í¬???¤ì?ì¤?/h3>
        <div className="text-sm text-blue-800 space-y-1">
          <div>??<strong>?¼ì¼ ë¦¬í¬??/strong>: ë§¤ì¼ 23:59 ?ë™ ?ì„±</div>
          <div>??<strong>ì£¼ê°„ ë¦¬í¬??/strong>: ë§¤ì£¼ ?”ìš”??09:00 ?ë™ ?ì„±</div>
          <div>??<strong>?”ê°„ ë¦¬í¬??/strong>: ë§¤ì›” 1??09:00 ?ë™ ?ì„±</div>
          <div>??ëª¨ë“  ë¦¬í¬?¸ëŠ” PDFë¡??ì„±?˜ì–´ n8n ?¹í›…?¼ë¡œ ?„ì†¡?©ë‹ˆ??/div>
        </div>
      </div>

      {/* ë¦¬í¬???ˆìŠ¤? ë¦¬ */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">?“š ë¦¬í¬???ˆìŠ¤? ë¦¬</h2>
          <p className="text-sm text-gray-600">ìµœê·¼ ?ì„±??ë¦¬í¬??ëª©ë¡ (ìµœë? 20ê±?</p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">ë¦¬í¬??ë¡œë”© ì¤?..</p>
          </div>
        ) : (
          <div className="divide-y">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">?“Š</div>
                <p>?„ì§ ?ì„±??ë¦¬í¬?¸ê? ?†ìŠµ?ˆë‹¤.</p>
                <p className="text-sm">?˜ë™?¼ë¡œ ë¦¬í¬?¸ë? ?ì„±?˜ê±°???ë™ ?¤ì?ì¤„ì„ ê¸°ë‹¤?¤ì£¼?¸ìš”.</p>
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
                          PDF ?¬ê¸°: {(report.pdfSize / 1024).toFixed(1)}KB
                        </span>
                      </div>

                      {/* ?µê³„ ?”ì•½ */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">{report.stats.newItems}</div>
                          <div className="text-xs text-gray-600">? ê·œ ?í’ˆ</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">{report.stats.voiceSessions}</div>
                          <div className="text-xs text-gray-600">?Œì„± ?¸ì…˜</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-purple-600">{report.stats.notifications}</div>
                          <div className="text-xs text-gray-600">?Œë¦¼ ?„ì†¡</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-orange-600">{report.metrics.uniqueUsers}</div>
                          <div className="text-xs text-gray-600">ê³ ìœ  ?¬ìš©??/div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-red-600">{report.stats.errors}</div>
                          <div className="text-xs text-gray-600">?ëŸ¬ ë°œìƒ</div>
                        </div>
                      </div>

                      {/* ?±ëŠ¥ ì§€??*/}
                      <div className="flex items-center gap-6 mb-3 text-sm">
                        <span className="text-gray-600">
                          ?±ê³µë¥? <span className="font-semibold text-green-600">{report.metrics.successRate}%</span>
                        </span>
                        <span className="text-gray-600">
                          ?‰ê·  ?¸ì…˜: <span className="font-semibold">{report.metrics.avgSessionDuration}ë¶?/span>
                        </span>
                      </div>

                      {/* ?¸ê¸° ?œê·¸ */}
                      {report.metrics.topTags.length > 0 && (
                        <div className="mb-3">
                          <div className="text-sm text-gray-600 mb-1">?·ï¸??¸ê¸° ?œê·¸:</div>
                          <div className="flex flex-wrap gap-1">
                            {report.metrics.topTags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {tag.tag} ({tag.count})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI ?”ì•½ */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">?§  AI ë¶„ì„ ?”ì•½:</div>
                        <p className="text-sm text-gray-600 line-clamp-2">{report.summary}</p>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => downloadReport(report.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        ?“¥ ?¤ìš´ë¡œë“œ
                      </button>
                      <button
                        onClick={() => alert('PDF ë¯¸ë¦¬ë³´ê¸° ê¸°ëŠ¥?€ ì¶”í›„ êµ¬í˜„ ?ˆì •?…ë‹ˆ??')}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        ?‘ï¸?ë¯¸ë¦¬ë³´ê¸°
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ë¦¬í¬???¤ì • ?ˆë‚´ */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">?™ï¸ ë¦¬í¬???¤ì •</h3>
        <div className="text-sm text-yellow-800 space-y-1">
          <div>??Firebase Functions ?˜ê²½ ë³€???¤ì • ?„ìš”: <code className="bg-yellow-100 px-1 rounded">OPENAI_API_KEY</code></div>
          <div>??n8n ?¹í›… ?¤ì • ?„ìš”: <code className="bg-yellow-100 px-1 rounded">n8n.webhook</code></div>
          <div>??Firebase Storage ê¶Œí•œ ?¤ì • ?„ìš” (PDF ?€?¥ìš©)</div>
        </div>
      </div>
    </div>
  );
}
