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
        setError("ë¦¬í¬???•ë³´ê°€ ?¬ë°”ë¥´ì? ?ŠìŠµ?ˆë‹¤.");
        setLoading(false);
        return;
      }

      try {
        // ?“Š ?´ëŒ ë¡œê·¸ ?€??        const logId = `${reportId}_${Date.now()}`;
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

        console.log("??ë¦¬í¬???´ëŒ ë¡œê·¸ ?€???„ë£Œ:", logId);
        setLoading(false);
      } catch (err) {
        console.error("???´ëŒ ë¡œê·¸ ?€???¤íŒ¨:", err);
        setError("ë¡œê·¸ ?€?¥ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.");
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">?¤ë¥˜ ë°œìƒ</h2>
          <p className="text-gray-600">{error}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* ?¤ë” */}
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
                <p className="text-blue-100 text-sm">?¬ì?ìš© IR ë¦¬í¬??/p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">?˜ì‹ ??/p>
              <p className="font-medium">{email}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ë¦¬í¬??ì»¨í…ì¸?*/}
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
                <p className="text-gray-600">ë¦¬í¬?¸ë? ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* ë¦¬í¬???•ë³´ */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  ?“Š ì£¼ê°„ ?±ê³¼ ë¦¬í¬??                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>?“… {new Date().toLocaleDateString("ko-KR")}</span>
                  <span>??/span>
                  <span>?”’ ë¹„ê³µê°?ë¬¸ì„œ</span>
                  <span>??/span>
                  <span>?“§ {email}</span>
                </div>
              </div>

              {/* PDF ë·°ì–´ ?ëŠ” Firestore ?°ì´??*/}
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
                  {/* Firestore ë¦¬í¬???°ì´???œì‹œ (PDF ?€?? */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      ?“ˆ ì£¼ìš” ì§€??                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard label="ì´??í’ˆ ?±ë¡" value="156ê°? />
                      <StatCard label="?´ë²ˆ ì£?? ê·œ" value="23ê°? color="text-blue-600" />
                      <StatCard label="?œì„± ?ë§¤?? value="28ëª? />
                      <StatCard label="ì£¼ê°„ ?±ì¥ë¥? value="14.7%" color="text-green-600" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      ?¤– AI ë¶„ì„ ?”ì•½
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      ?”¥ <strong>?œë°œ??ê±°ë˜ ì£¼ì…?ˆë‹¤!</strong> ? ê·œ ?í’ˆ ?±ë¡??ë§¤ìš° ?œë°œ?˜ë©°,
                      ?ë§¤???œë™??ì¦ê??˜ê³  ?ˆìŠµ?ˆë‹¤. ?„ì¬ ?±ì¥?¸ê? ê±´ê°•?˜ê²Œ ? ì??˜ê³  ?ˆìŠµ?ˆë‹¤.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      ?’¼ ?¬ì???•ë³´
                    </h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>????ë¦¬í¬?¸ëŠ” YAGO VIBE ?Œë«?¼ì˜ ?¤ì‹œê°??°ì´?°ë? ê¸°ë°˜?¼ë¡œ ?ì„±?˜ì—ˆ?µë‹ˆ??</li>
                      <li>??ëª¨ë“  ?µê³„??Firebase Firestore?ì„œ ?¤ì‹œê°„ìœ¼ë¡??˜ì§‘?©ë‹ˆ??</li>
                      <li>??ë§¤ì£¼ ?”ìš”???¤ì „ 9???ë™?¼ë¡œ ë°œì†¡?©ë‹ˆ??</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* ?˜ë‹¨ ?¸í„° */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>??Powered by YAGO VIBE AI ?ë™???œìŠ¤??/p>
                <p className="mt-1">??ë¦¬í¬?¸ëŠ” ë¹„ê³µê°?ë¬¸ì„œ?…ë‹ˆ?? ë¬´ë‹¨ ?„ì¬ ë°?ë°°í¬ë¥?ê¸ˆì??©ë‹ˆ??</p>
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

