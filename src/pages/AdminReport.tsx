import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#4ade80", "#60a5fa", "#f87171"]; // 긍정, 중립, 부??
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

      // 감정 ?�계 계산
      const count: { [key: string]: number } = { positive: 0, neutral: 0, negative: 0 };
      data.forEach((s) => {
        const sentiment = s.sentiment || s.emotion || "neutral";
        const key = sentiment.toLowerCase();
        if (key === "긍정" || key === "positive") count.positive++;
        else if (key === "부?? || key === "negative") count.negative++;
        else count.neutral++;
      });

      setSentimentStats([
        { name: "긍정", value: count.positive, color: "#4ade80" },
        { name: "중립", value: count.neutral, color: "#60a5fa" },
        { name: "부??, value: count.negative, color: "#f87171" },
      ]);

      // 최근 ?�약 5�?      setTopSummaries(data.slice(0, 5));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 animate-pulse">리포?��? 불러?�는 �?..</p>
      </div>
    );
  }

  const totalMessages = summaries.length;
  const positiveRate = totalMessages > 0 ? ((sentimentStats[0]?.value || 0) / totalMessages * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto p-6">
        {/* ?�더 */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">?�� AI ?�??리포??/h2>
          <p className="text-gray-600">?�시�??�???�약 & 감정 분석</p>
        </div>

        {/* ?�계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">�?분석 메시지</span>
              <span className="text-2xl">?��</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalMessages}�?/p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">긍정 비율</span>
              <span className="text-2xl">?��</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{positiveRate}%</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">AI 분석 ?�태</span>
              <span className="text-2xl">?��</span>
            </div>
            <p className="text-xl font-bold text-blue-600">???�성??/p>
          </div>
        </div>

        {/* 감정 비율 그래??*/}
        <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
          <h3 className="text-xl font-semibold mb-6 text-center">?�� 감정 비율 분석</h3>
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
            <p className="text-center text-gray-400 py-10">?�직 분석 ?�이?��? ?�습?�다.</p>
          )}
        </div>

        {/* 최근 ?�???�약 TOP 5 */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-semibold mb-6 text-center">?�� 최근 ?�???�약 TOP 5</h3>
          {topSummaries.length === 0 ? (
            <p className="text-center text-gray-400 py-10">?�직 ?�약???�습?�다.</p>
          ) : (
            <div className="space-y-4">
              {topSummaries.map((s, index) => {
                const sentiment = s.sentiment || s.emotion || "neutral";
                const sentimentKey = sentiment.toLowerCase();
                const isPositive = sentimentKey === "positive" || sentimentKey === "긍정";
                const isNegative = sentimentKey === "negative" || sentimentKey === "부??;

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
                            : "?�짜 ?�보 ?�음"}
                        </span>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        isPositive
                          ? "bg-green-100 text-green-700"
                          : isNegative
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {isPositive ? "?�� 긍정" : isNegative ? "?�� 부?? : "?�� 중립"}
                      </span>
                    </div>

                    {/* ?�본 메시지 */}
                    {s.original && (
                      <div className="mb-2 p-2 bg-white rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">?�� ?�본</p>
                        <p className="text-sm text-gray-700 italic">"{s.original}"</p>
                      </div>
                    )}

                    {/* AI ?�약 */}
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                      {s.summary}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ?�체 ?�약 개수 */}
        {summaries.length > 5 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              �?{summaries.length}개의 ?�?��? 분석?�었?�니??
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

