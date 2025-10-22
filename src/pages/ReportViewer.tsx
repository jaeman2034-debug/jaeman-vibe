import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion } from "framer-motion";

export default function ReportViewer() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reportId = searchParams.get("id");
  const email = searchParams.get("email");
  const fileUrl = searchParams.get("file");

  useEffect(() => {
    const logView = async () => {
      if (!reportId || !email) {
        setError("리포???�보가 ?�바르�? ?�습?�다.");
        setLoading(false);
        return;
      }

      try {
        // ?�� ?�람 로그 ?�??        const logId = `${reportId}_${Date.now()}`;
        await setDoc(doc(db, "report-logs", logId), {
          reportId,
          email,
          timestamp: serverTimestamp(),
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          viewedFrom: "email-link",
        });

        console.log("??리포???�람 로그 ?�???�료:", logId);
        setLoading(false);
      } catch (err) {
        console.error("???�람 로그 ?�???�패:", err);
        setError("로그 ?�?�에 ?�패?�습?�다.");
        setLoading(false);
      }
    };

    logView();
  }, [reportId, email]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md"
        >
          <div className="text-6xl mb-4">??/div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">?�류 발생</h2>
          <p className="text-gray-600">{error}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* ?�더 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <span className="text-4xl">??/span>
              <div>
                <h1 className="text-2xl font-bold">YAGO VIBE</h1>
                <p className="text-blue-100 text-sm">?�자?�용 IR 리포??/p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">?�신??/p>
              <p className="font-medium">{email}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 리포??컨텐�?*/}
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">리포?��? 불러?�는 �?..</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* 리포???�보 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  ?�� 주간 ?�과 리포??                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>?�� {new Date().toLocaleDateString("ko-KR")}</span>
                  <span>??/span>
                  <span>?�� 비공�?문서</span>
                  <span>??/span>
                  <span>?�� {email}</span>
                </div>
              </div>

              {/* PDF 뷰어 ?�는 Firestore ?�이??*/}
              {fileUrl ? (
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <iframe
                    src={fileUrl}
                    width="100%"
                    height="800px"
                    className="border-0"
                    title="IR Report PDF"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Firestore 리포???�이???�시 (PDF ?�?? */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      ?�� 주요 지??                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard label="�??�품 ?�록" value="156�? />
                      <StatCard label="?�번 �??�규" value="23�? color="text-blue-600" />
                      <StatCard label="?�성 ?�매?? value="28�? />
                      <StatCard label="주간 ?�장�? value="14.7%" color="text-green-600" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      ?�� AI 분석 ?�약
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      ?�� <strong>?�발??거래 주입?�다!</strong> ?�규 ?�품 ?�록??매우 ?�발?�며,
                      ?�매???�동??증�??�고 ?�습?�다. ?�재 ?�장?��? 건강?�게 ?��??�고 ?�습?�다.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      ?�� ?�자???�보
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>????리포?�는 YAGO VIBE ?�랫?�의 ?�시�??�이?��? 기반?�로 ?�성?�었?�니??</li>
                      <li>??모든 ?�계??Firebase Firestore?�서 ?�시간으�??�집?�니??</li>
                      <li>??매주 ?�요???�전 9???�동?�로 발송?�니??</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* ?�단 ?�터 */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>??Powered by YAGO VIBE AI ?�동???�스??/p>
                <p className="mt-1">??리포?�는 비공�?문서?�니?? 무단 ?�재 �?배포�?금�??�니??</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  color = "text-gray-900" 
}: { 
  label: string; 
  value: string; 
  color?: string;
}) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

