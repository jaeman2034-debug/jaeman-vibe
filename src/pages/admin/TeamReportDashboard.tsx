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

const COLORS = ["#4ade80", "#60a5fa", "#f87171"]; // ê¸ì •/ì¤‘ë¦½/ë¶€??
const TEAM_LIST = [
  { id: "soheul60", name: "?Œí˜FC 60" },
  { id: "soheul88", name: "?Œí˜FC 88" },
  { id: "academy", name: "?Œí˜ ?„ì¹´?°ë?" },
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
    ê¸ì •: number;
    ë¶€?? number;
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
          
          if (sentimentKey.includes("positive") || sentiment === "ê¸ì •") count.positive++;
          else if (sentimentKey.includes("negative") || sentiment === "ë¶€??) count.negative++;
          else count.neutral++;

          const week = new Date(d.createdAt.toDate()).toLocaleDateString("ko-KR", {
            month: "2-digit",
            day: "2-digit",
          });
          
          if (!weekTrend[week]) weekTrend[week] = { pos: 0, neg: 0 };
          if (sentimentKey.includes("positive") || sentiment === "ê¸ì •") weekTrend[week].pos++;
          if (sentimentKey.includes("negative") || sentiment === "ë¶€??) weekTrend[week].neg++;
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
                ê¸ì •: weekTrend[w].pos,
                ë¶€?? weekTrend[w].neg,
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
        <p className="text-gray-500 animate-pulse">?€ ë¦¬í¬?¸ë? ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto p-6">
        {/* ?¤ë” */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">???€ë³?AI ?€??ë¦¬í¬???€?œë³´??/h2>
          <p className="text-gray-600">?¤ì‹œê°??€ ë¶„ìœ„ê¸?ë¹„êµ & ê°ì • ?¸ë Œ??ë¶„ì„</p>
        </div>

        {/* ?€ë³?ê°ì • ë¹„ìœ¨ (3ê°??Œì´ì°¨íŠ¸) */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-6 text-center">?“Š ?€ë³?ê°ì • ë¹„ìœ¨</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teamStats.map((team) => {
              const total = team.count.positive + team.count.neutral + team.count.negative || 1;
              const positivePercent = ((team.count.positive / total) * 100).toFixed(1);

              return (
                <div key={team.teamId} className="bg-white p-6 rounded-2xl shadow-md">
                  <h3 className="text-lg font-semibold mb-4 text-center text-gray-900">
                    {team.name}
                  </h3>
                  
                  {/* ?µê³„ ì¹´ë“œ */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-500">ê¸ì •</p>
                      <p className="text-xl font-bold text-green-600">{team.count.positive}</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-500">ì¤‘ë¦½</p>
                      <p className="text-xl font-bold text-blue-600">{team.count.neutral}</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded-lg">
                      <p className="text-xs text-gray-500">ë¶€??/p>
                      <p className="text-xl font-bold text-red-600">{team.count.negative}</p>
                    </div>
                  </div>

                  {/* ?Œì´ì°¨íŠ¸ */}
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "ê¸ì •", value: team.count.positive },
                          { name: "ì¤‘ë¦½", value: team.count.neutral },
                          { name: "ë¶€??, value: team.count.negative },
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

                  {/* ê¸ì •ë¥?*/}
                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-500">ê¸ì •ë¥?/p>
                    <p className="text-2xl font-bold text-green-600">{positivePercent}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ì£¼ê°„ë³?ê°ì • ?¸ë Œ??ë¹„êµ */}
        <div className="bg-white p-6 rounded-2xl shadow-md mb-10">
          <h3 className="text-xl font-semibold mb-6 text-center">?“ˆ ì£¼ê°„ë³??€ ë¶„ìœ„ê¸?ë³€??/h3>
          {trendData.length > 0 && trendData[0]?.trend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={
                  trendData[0]?.trend?.map((_, idx) => {
                    const week = trendData[0]?.trend[idx]?.week;
                    const obj: any = { ì£¼ì°¨: week };
                    trendData.forEach((t) => {
                      const found = t.trend.find((f) => f.week === week);
                      obj[`${t.name}_ê¸ì •`] = found?.ê¸ì • || 0;
                      obj[`${t.name}_ë¶€??] = found?.ë¶€??|| 0;
                    });
                    return obj;
                  }) || []
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ì£¼ì°¨" />
                <YAxis />
                <Tooltip />
                <Legend />
                {trendData.map((t, idx) => (
                  <Line
                    key={t.teamId + "_pos"}
                    type="monotone"
                    dataKey={`${t.name}_ê¸ì •`}
                    stroke={["#10b981", "#3b82f6", "#8b5cf6"][idx]}
                    strokeWidth={2}
                  />
                ))}
                {trendData.map((t, idx) => (
                  <Line
                    key={t.teamId + "_neg"}
                    type="monotone"
                    dataKey={`${t.name}_ë¶€??}
                    stroke={["#ef4444", "#f59e0b", "#ec4899"][idx]}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-10">?„ì§ ?¸ë Œ???°ì´?°ê? ?†ìŠµ?ˆë‹¤.</p>
          )}
        </div>

        {/* ìµœê·¼ ?€ë³?ì£¼ìš” ?€???”ì•½ */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-semibold mb-6 text-center">?§  ìµœê·¼ ?€ë³?ì£¼ìš” ?€???”ì•½</h3>
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
                    <span>"?ˆë ¨ ì§‘ì¤‘???¥ìƒ, ?„ìˆ  ?´í•´??ì¦ê?"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">??/span>
                    <span>"ì²´ë ¥ ? ì? ?¼ë“œë°?ê³µìœ , ?ì–‘ ê´€ë¦??¼ì˜"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">??/span>
                    <span>"ì½”ì¹˜ ë¯¸íŒ… ?¼ì • ì¡°ì • ?”ì²­"</span>
                  </li>
                </ul>
                
                {/* ?€ ?íƒœ ë°°ì? */}
                <div className="mt-4 pt-3 border-t">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    team.count.positive > team.count.negative
                      ? "bg-green-100 text-green-700"
                      : team.count.positive === team.count.negative
                      ? "bg-blue-100 text-blue-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {team.count.positive > team.count.negative
                      ? "?˜Š ê¸ì •??ë¶„ìœ„ê¸?
                      : team.count.positive === team.count.negative
                      ? "?˜ ?ˆì •??ë¶„ìœ„ê¸?
                      : "?˜” ê´€???„ìš”"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ?„ì²´ ?µê³„ ?”ì•½ */}
        <div className="mt-10 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">?“Š ?„ì²´ ?€ ?µí•© ?µê³„</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm text-center">
              <p className="text-sm text-gray-500 mb-1">?„ì²´ ë¶„ì„</p>
              <p className="text-2xl font-bold text-blue-600">
                {teamStats.reduce((sum, t) => sum + t.count.positive + t.count.neutral + t.count.negative, 0)}ê°?              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm text-center">
              <p className="text-sm text-gray-500 mb-1">ê¸ì • ?©ê³„</p>
              <p className="text-2xl font-bold text-green-600">
                {teamStats.reduce((sum, t) => sum + t.count.positive, 0)}ê°?              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm text-center">
              <p className="text-sm text-gray-500 mb-1">ì¤‘ë¦½ ?©ê³„</p>
              <p className="text-2xl font-bold text-blue-600">
                {teamStats.reduce((sum, t) => sum + t.count.neutral, 0)}ê°?              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm text-center">
              <p className="text-sm text-gray-500 mb-1">ë¶€???©ê³„</p>
              <p className="text-2xl font-bold text-red-600">
                {teamStats.reduce((sum, t) => sum + t.count.negative, 0)}ê°?              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

