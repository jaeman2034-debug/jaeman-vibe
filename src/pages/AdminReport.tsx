import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#4ade80", "#60a5fa", "#f87171"]; // ê¸ì •, ì¤‘ë¦½, ë¶€??
export default function AdminReport() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [sentimentStats, setSentimentStats] = useState<any[]>([]);
  const [topSummaries, setTopSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "chat_summaries"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSummaries(data);

      // ê°ì • ?µê³„ ê³„ì‚°
      const count: { [key: string]: number } = { positive: 0, neutral: 0, negative: 0 };
      data.forEach((s) => {
        const sentiment = s.sentiment || s.emotion || "neutral";
        const key = sentiment.toLowerCase();
        if (key === "ê¸ì •" || key === "positive") count.positive++;
        else if (key === "ë¶€?? || key === "negative") count.negative++;
        else count.neutral++;
      });

      setSentimentStats([
        { name: "ê¸ì •", value: count.positive, color: "#4ade80" },
        { name: "ì¤‘ë¦½", value: count.neutral, color: "#60a5fa" },
        { name: "ë¶€??, value: count.negative, color: "#f87171" },
      ]);

      // ìµœê·¼ ?”ì•½ 5ê°?      setTopSummaries(data.slice(0, 5));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 animate-pulse">ë¦¬í¬?¸ë? ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
      </div>
    );
  }

  const totalMessages = summaries.length;
  const positiveRate = totalMessages > 0 ? ((sentimentStats[0]?.value || 0) / totalMessages * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto p-6">
        {/* ?¤ë” */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">?“Š AI ?€??ë¦¬í¬??/h2>
          <p className="text-gray-600">?¤ì‹œê°??€???”ì•½ & ê°ì • ë¶„ì„</p>
        </div>

        {/* ?µê³„ ì¹´ë“œ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">ì´?ë¶„ì„ ë©”ì‹œì§€</span>
              <span className="text-2xl">?’¬</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalMessages}ê°?/p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">ê¸ì • ë¹„ìœ¨</span>
              <span className="text-2xl">?˜Š</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{positiveRate}%</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">AI ë¶„ì„ ?íƒœ</span>
              <span className="text-2xl">?¤–</span>
            </div>
            <p className="text-xl font-bold text-blue-600">???œì„±??/p>
          </div>
        </div>

        {/* ê°ì • ë¹„ìœ¨ ê·¸ë˜??*/}
        <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
          <h3 className="text-xl font-semibold mb-6 text-center">?“ˆ ê°ì • ë¹„ìœ¨ ë¶„ì„</h3>
          {sentimentStats.some(s => s.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentStats}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name} (${entry.value})`}
                >
                  {sentimentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-10">?„ì§ ë¶„ì„ ?°ì´?°ê? ?†ìŠµ?ˆë‹¤.</p>
          )}
        </div>

        {/* ìµœê·¼ ?€???”ì•½ TOP 5 */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-semibold mb-6 text-center">?† ìµœê·¼ ?€???”ì•½ TOP 5</h3>
          {topSummaries.length === 0 ? (
            <p className="text-center text-gray-400 py-10">?„ì§ ?”ì•½???†ìŠµ?ˆë‹¤.</p>
          ) : (
            <div className="space-y-4">
              {topSummaries.map((s, index) => {
                const sentiment = s.sentiment || s.emotion || "neutral";
                const sentimentKey = sentiment.toLowerCase();
                const isPositive = sentimentKey === "positive" || sentimentKey === "ê¸ì •";
                const isNegative = sentimentKey === "negative" || sentimentKey === "ë¶€??;

                return (
                  <div key={s.id} className="p-4 border-l-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    style={{
                      borderLeftColor: isPositive ? "#4ade80" : isNegative ? "#f87171" : "#60a5fa"
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <span className="text-xs text-gray-500">
                          {s.createdAt?.toDate
                            ? new Date(s.createdAt.toDate()).toLocaleDateString("ko-KR")
                            : "? ì§œ ?•ë³´ ?†ìŒ"}
                        </span>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        isPositive
                          ? "bg-green-100 text-green-700"
                          : isNegative
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {isPositive ? "?˜Š ê¸ì •" : isNegative ? "?˜” ë¶€?? : "?˜ ì¤‘ë¦½"}
                      </span>
                    </div>

                    {/* ?ë³¸ ë©”ì‹œì§€ */}
                    {s.original && (
                      <div className="mb-2 p-2 bg-white rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">?“ ?ë³¸</p>
                        <p className="text-sm text-gray-700 italic">"{s.original}"</p>
                      </div>
                    )}

                    {/* AI ?”ì•½ */}
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                      {s.summary}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ?„ì²´ ?”ì•½ ê°œìˆ˜ */}
        {summaries.length > 5 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              ì´?{summaries.length}ê°œì˜ ?€?”ê? ë¶„ì„?˜ì—ˆ?µë‹ˆ??
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

