import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

export default function ChatSummary() {
  const { id } = useParams(); // chatId
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, "chat_summaries"),
      where("chatId", "==", id),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSummaries(list);
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 animate-pulse">?€???”ì•½??ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* ?¤ë” */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">?§  ?€???”ì•½ & ê°ì • ë¶„ì„</h2>
          <button
            onClick={() => navigate(`/chat/${id}`)}
            className="text-sm text-blue-600 hover:underline"
          >
            ì±„íŒ…?¼ë¡œ ?Œì•„ê°€ê¸?          </button>
        </div>

        {/* ?”ì•½ ëª©ë¡ */}
        {summaries.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">?§ </div>
            <p className="text-gray-400 text-lg mb-6">?„ì§ ?”ì•½???†ìŠµ?ˆë‹¤.</p>
            <p className="text-sm text-gray-500">
              ?Œì„± ë©”ì‹œì§€ë¥??„ì†¡?˜ë©´ ?ë™?¼ë¡œ ?”ì•½???ì„±?©ë‹ˆ??
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {summaries.map((s) => (
              <div key={s.id} className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                {/* ?€?„ìŠ¤?¬í”„ */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <span>?•’</span>
                    {s.createdAt?.toDate
                      ? new Date(s.createdAt.toDate()).toLocaleString("ko-KR")
                      : "?œê°„ ?•ë³´ ?†ìŒ"}
                  </p>
                  <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                    AI ?”ì•½
                  </span>
                </div>

                {/* ?ë³¸ ?€??*/}
                {s.original && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1 font-semibold">?“ ?ë³¸ ë©”ì‹œì§€</p>
                    <p className="text-sm text-gray-700 italic">"{s.original}"</p>
                  </div>
                )}

                {/* AI ?”ì•½ */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2 font-semibold flex items-center gap-1">
                    <span>?§ </span>
                    AI ?”ì•½ & ê°ì • ë¶„ì„
                  </p>
                  <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                    {s.summary}
                  </p>
                </div>

                {/* ê°ì • ?œê·¸ (? íƒ?¬í•­) */}
                {s.emotion && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">ê°ì •:</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      s.emotion === "ê¸ì •" 
                        ? "bg-green-100 text-green-700" 
                        : s.emotion === "ë¶€??
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {s.emotion === "ê¸ì •" ? "?˜Š ê¸ì •" : s.emotion === "ë¶€?? ? "?˜” ë¶€?? : "?˜ ì¤‘ë¦½"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ?µê³„ ?”ì•½ (? íƒ?¬í•­) */}
        {summaries.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">?“Š ?€???µê³„</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-sm text-gray-500 mb-1">ì´??”ì•½ ê°œìˆ˜</p>
                <p className="text-2xl font-bold text-blue-600">{summaries.length}ê°?/p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-sm text-gray-500 mb-1">AI ë¶„ì„ ?œì„±</p>
                <p className="text-2xl font-bold text-green-600">??ON</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

