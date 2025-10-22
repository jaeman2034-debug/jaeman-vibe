import React, { useEffect, useState } from "react";
import { listSchedules, generateReportAI, saveReport } from "../../lib/ai-report";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];

export default function ReportDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  async function calculateStats() {
    try {
      console.log("?�� ?�정 ?�계 계산 �?..");
      const data = await listSchedules();
      
      const summaryStats = {
        totalEvents: data.length,
        matches: data.filter((e) => e.type === "team").length,
        academies: data.filter((e) => e.type === "academy").length,
        tournaments: data.filter((e) => e.type === "tournament").length,
      };
      
      setStats(summaryStats);
      console.log("???�계 계산 ?�료:", summaryStats);
    } catch (error) {
      console.error("???�계 계산 ?�류:", error);
    }
  }

  async function generateSummary() {
    if (!stats) {
      alert("?�계 ?�이?��? 먼�? 계산?�주?�요.");
      return;
    }

    setLoading(true);
    try {
      console.log("?�� AI ?�약 ?�성 ?�작...");
      const text = await generateReportAI(stats);
      setSummary(text || "?�약 ?�성 ?�패");
      
      // Firestore???�??      await saveReport(text, stats, "monthly");
      setLastGenerated(new Date());
      
      console.log("??AI ?�약 ?�성 �??�???�료");
    } catch (error) {
      console.error("??AI ?�약 ?�성 ?�류:", error);
      alert("AI ?�약 ?�성 �??�류가 발생?�습?�다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    calculateStats();
  }, []);

  const chartData = stats
    ? [
        { name: "�??�정", value: stats.totalEvents },
        { name: "?� ?�련", value: stats.matches },
        { name: "?�카?��?", value: stats.academies },
        { name: "?�??, value: stats.tournaments },
      ]
    : [];

  const pieData = stats
    ? [
        { name: "?� ?�련", value: stats.matches },
        { name: "?�카?��?", value: stats.academies },
        { name: "?�??, value: stats.tournaments },
      ]
    : [];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 pb-24">
      {/* ?�더 */}
      <motion.div
        className="bg-white rounded-2xl shadow-md p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">?�� ?�간 AI 리포??/h1>
            <p className="text-sm text-gray-500">
              ?�정 ?�계�?AI가 ?�동?�로 분석?�고 ?�약?�니??            </p>
            {lastGenerated && (
              <p className="text-xs text-gray-400 mt-1">
                마�?�??�성: {lastGenerated.toLocaleString("ko-KR")}
              </p>
            )}
          </div>
          <button
            onClick={generateSummary}
            disabled={loading || !stats}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? "?�� ?�성 �?.." : "AI ?�약 ?�성"}
          </button>
        </div>
      </motion.div>

      {/* ?�계 카드 */}
      {stats && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition-shadow">
            <p className="text-3xl font-bold text-blue-600">{stats.totalEvents}</p>
            <p className="text-sm text-gray-500 mt-1">�??�정</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition-shadow">
            <p className="text-3xl font-bold text-purple-600">{stats.matches}</p>
            <p className="text-sm text-gray-500 mt-1">?� ?�련</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition-shadow">
            <p className="text-3xl font-bold text-indigo-600">{stats.academies}</p>
            <p className="text-sm text-gray-500 mt-1">?�카?��?</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition-shadow">
            <p className="text-3xl font-bold text-orange-600">{stats.tournaments}</p>
            <p className="text-sm text-gray-500 mt-1">?�??/p>
          </div>
        </motion.div>
      )}

      {/* 차트 */}
      {stats && (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* 막�? 차트 */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">?�� ?�정 분포</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ?�이 차트 */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">?�� ?�동 비율</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* AI ?�약 */}
      {summary && (
        <motion.div
          className="bg-white rounded-2xl shadow-md p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">?��</div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AI ?�성 ?�약</h2>
              <p className="text-xs text-gray-500">
                OpenAI GPT-4o-mini가 분석???�간 ?�동 리포??              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
            <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
              {summary}
            </p>
          </div>
          {lastGenerated && (
            <p className="text-xs text-gray-400 mt-3 text-right">
              ?�성 ?�각: {lastGenerated.toLocaleString("ko-KR")}
            </p>
          )}
        </motion.div>
      )}

      {/* 로딩 ?�태 */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">AI ?�약 ?�성 �?..</p>
            <p className="text-sm text-gray-400 mt-2">
              GPT-4o-mini가 ?�정 ?�이?��? 분석?�고 ?�습?�다
            </p>
          </div>
        </div>
      )}

      {/* ?�내 */}
      {!summary && !loading && stats && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-blue-800">
            ?�� "AI ?�약 ?�성" 버튼???�릭?�면 ?�번 ???�동??AI가 ?�동?�로 분석?�니??
          </p>
        </div>
      )}
    </div>
  );
}

