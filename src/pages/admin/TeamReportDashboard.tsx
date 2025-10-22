import React, { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#4ade80", "#60a5fa", "#f87171"]; // 긍정/중립/부??
const TEAM_LIST = [
  { id: "soheul60", name: "?�흘FC 60" },
  { id: "soheul88", name: "?�흘FC 88" },
  { id: "academy", name: "?�흘 ?�카?��?" },
];

interface TeamStats {
  teamId: string;
  name: string;
  count: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface TrendData {
  teamId: string;
  name: string;
  trend: Array<{
    week: string;
    긍정: number;
    부?? number;
  }>;
}

export default function TeamReportDashboard() {
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribes = TEAM_LIST.map((team) => {
      const q = query(
        collection(db, "chat_summaries"),
        where("teamId", "==", team.id),
        orderBy("createdAt", "desc")
      );
      
      return onSnapshot(q, (snap) => {
        const docs = snap.docs.map((d) => d.data());
        const count = { positive: 0, neutral: 0, negative: 0 };
        const weekTrend: Record<string, { pos: number; neg: number }> = {};

        docs.forEach((d: any) => {
          const sentiment = d.sentiment || d.emotion || "neutral";
          const sentimentKey = sentiment.toLowerCase();
          
          if (sentimentKey.includes("positive") || sentiment === "긍정") count.positive++;
          else if (sentimentKey.includes("negative") || sentiment === "부??) count.negative++;
          else count.neutral++;

          const week = new Date(d.createdAt.toDate()).toLocaleDateString("ko-KR", {
            month: "2-digit",
            day: "2-digit",
          });
          
          if (!weekTrend[week]) weekTrend[week] = { pos: 0, neg: 0 };
          if (sentimentKey.includes("positive") || sentiment === "긍정") weekTrend[week].pos++;
          if (sentimentKey.includes("negative") || sentiment === "부??) weekTrend[week].neg++;
        });

        setTeamStats((prev) => {
          const filtered = prev.filter((t) => t.teamId !== team.id);
          return [...filtered, { teamId: team.id, name: team.name, count }];
        });

        setTrendData((prev) => {
          const filtered = prev.filter((t) => t.teamId !== team.id);
          return [
            ...filtered,
            {
              teamId: team.id,
              name: team.name,
              trend: Object.keys(weekTrend).map((w) => ({
                week: w,
                긍정: weekTrend[w].pos,
                부?? weekTrend[w].neg,
              })),
            },
          ];
        });
        
        setLoading(false);
      });
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 animate-pulse">?� 리포?��? 불러?�는 �?..</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto p-6">
        {/* ?�더 */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">???��?AI ?�??리포???�?�보??/h2>
          <p className="text-gray-600">?�시�??� 분위�?비교 & 감정 ?�렌??분석</p>
        </div>

        {/* ?��?감정 비율 (3�??�이차트) */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-6 text-center">?�� ?��?감정 비율</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teamStats.map((team) => {
              const total = team.count.positive + team.count.neutral + team.count.negative || 1;
              const positivePercent = ((team.count.positive / total) * 100).toFixed(1);

              return (
                <div key={team.teamId} className="bg-white p-6 rounded-2xl shadow-md">
                  <h3 className="text-lg font-semibold mb-4 text-center text-gray-900">
                    {team.name}
                  </h3>
                  
                  {/* ?�계 카드 */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-500">긍정</p>
                      <p className="text-xl font-bold text-green-600">{team.count.positive}</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-500">중립</p>
                      <p className="text-xl font-bold text-blue-600">{team.count.neutral}</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded-lg">
                      <p className="text-xs text-gray-500">부??/p>
                      <p className="text-xl font-bold text-red-600">{team.count.negative}</p>
                    </div>
                  </div>

                  {/* ?�이차트 */}
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "긍정", value: team.count.positive },
                          { name: "중립", value: team.count.neutral },
                          { name: "부??, value: team.count.negative },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        dataKey="value"
                        label={(entry) => `${entry.value}`}
                      >
                        {COLORS.map((c, i) => (
                          <Cell key={`cell-${i}`} fill={c} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* 긍정�?*/}
                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-500">긍정�?/p>
                    <p className="text-2xl font-bold text-green-600">{positivePercent}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 주간�?감정 ?�렌??비교 */}
        <div className="bg-white p-6 rounded-2xl shadow-md mb-10">
          <h3 className="text-xl font-semibold mb-6 text-center">?�� 주간�??� 분위�?변??/h3>
          {trendData.length > 0 && trendData[0]?.trend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={
                  trendData[0]?.trend?.map((_, idx) => {
                    const week = trendData[0]?.trend[idx]?.week;
                    const obj: any = { 주차: week };
                    trendData.forEach((t) => {
                      const found = t.trend.find((f) => f.week === week);
                      obj[`${t.name}_긍정`] = found?.긍정 || 0;
                      obj[`${t.name}_부??] = found?.부??|| 0;
                    });
                    return obj;
                  }) || []
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="주차" />
                <YAxis />
                <Tooltip />
                <Legend />
                {trendData.map((t, idx) => (
                  <Line
                    key={t.teamId + "_pos"}
                    type="monotone"
                    dataKey={`${t.name}_긍정`}
                    stroke={["#10b981", "#3b82f6", "#8b5cf6"][idx]}
                    strokeWidth={2}
                  />
                ))}
                {trendData.map((t, idx) => (
                  <Line
                    key={t.teamId + "_neg"}
                    type="monotone"
                    dataKey={`${t.name}_부??}
                    stroke={["#ef4444", "#f59e0b", "#ec4899"][idx]}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-10">?�직 ?�렌???�이?��? ?�습?�다.</p>
          )}
        </div>

        {/* 최근 ?��?주요 ?�???�약 */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-semibold mb-6 text-center">?�� 최근 ?��?주요 ?�???�약</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teamStats.map((team) => (
              <div key={team.teamId} className="p-4 border-l-4 border-blue-500 rounded-xl bg-blue-50">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">??/span>
                  {team.name}
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">??/span>
                    <span>"?�련 집중???�상, ?�술 ?�해??증�?"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">??/span>
                    <span>"체력 ?��? ?�드�?공유, ?�양 관�??�의"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">??/span>
                    <span>"코치 미팅 ?�정 조정 ?�청"</span>
                  </li>
                </ul>
                
                {/* ?� ?�태 배�? */}
                <div className="mt-4 pt-3 border-t">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    team.count.positive > team.count.negative
                      ? "bg-green-100 text-green-700"
                      : team.count.positive === team.count.negative
                      ? "bg-blue-100 text-blue-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {team.count.positive > team.count.negative
                      ? "?�� 긍정??분위�?
                      : team.count.positive === team.count.negative
                      ? "?�� ?�정??분위�?
                      : "?�� 관???�요"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ?�체 ?�계 ?�약 */}
        <div className="mt-10 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">?�� ?�체 ?� ?�합 ?�계</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm text-center">
              <p className="text-sm text-gray-500 mb-1">?�체 분석</p>
              <p className="text-2xl font-bold text-blue-600">
                {teamStats.reduce((sum, t) => sum + t.count.positive + t.count.neutral + t.count.negative, 0)}�?              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm text-center">
              <p className="text-sm text-gray-500 mb-1">긍정 ?�계</p>
              <p className="text-2xl font-bold text-green-600">
                {teamStats.reduce((sum, t) => sum + t.count.positive, 0)}�?              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm text-center">
              <p className="text-sm text-gray-500 mb-1">중립 ?�계</p>
              <p className="text-2xl font-bold text-blue-600">
                {teamStats.reduce((sum, t) => sum + t.count.neutral, 0)}�?              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm text-center">
              <p className="text-sm text-gray-500 mb-1">부???�계</p>
              <p className="text-2xl font-bold text-red-600">
                {teamStats.reduce((sum, t) => sum + t.count.negative, 0)}�?              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

