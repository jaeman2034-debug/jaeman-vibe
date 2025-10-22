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
      console.log("?“Š ?¼ì • ?µê³„ ê³„ì‚° ì¤?..");
      const data = await listSchedules();
      
      const summaryStats = {
        totalEvents: data.length,
        matches: data.filter((e) => e.type === "team").length,
        academies: data.filter((e) => e.type === "academy").length,
        tournaments: data.filter((e) => e.type === "tournament").length,
      };
      
      setStats(summaryStats);
      console.log("???µê³„ ê³„ì‚° ?„ë£Œ:", summaryStats);
    } catch (error) {
      console.error("???µê³„ ê³„ì‚° ?¤ë¥˜:", error);
    }
  }

  async function generateSummary() {
    if (!stats) {
      alert("?µê³„ ?°ì´?°ë? ë¨¼ì? ê³„ì‚°?´ì£¼?¸ìš”.");
      return;
    }

    setLoading(true);
    try {
      console.log("?§  AI ?”ì•½ ?ì„± ?œì‘...");
      const text = await generateReportAI(stats);
      setSummary(text || "?”ì•½ ?ì„± ?¤íŒ¨");
      
      // Firestore???€??      await saveReport(text, stats, "monthly");
      setLastGenerated(new Date());
      
      console.log("??AI ?”ì•½ ?ì„± ë°??€???„ë£Œ");
    } catch (error) {
      console.error("??AI ?”ì•½ ?ì„± ?¤ë¥˜:", error);
      alert("AI ?”ì•½ ?ì„± ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    calculateStats();
  }, []);

  const chartData = stats
    ? [
        { name: "ì´??¼ì •", value: stats.totalEvents },
        { name: "?€ ?ˆë ¨", value: stats.matches },
        { name: "?„ì¹´?°ë?", value: stats.academies },
        { name: "?€??, value: stats.tournaments },
      ]
    : [];

  const pieData = stats
    ? [
        { name: "?€ ?ˆë ¨", value: stats.matches },
        { name: "?„ì¹´?°ë?", value: stats.academies },
        { name: "?€??, value: stats.tournaments },
      ]
    : [];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 pb-24">
      {/* ?¤ë” */}
      <motion.div
        className="bg-white rounded-2xl shadow-md p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">?† ?”ê°„ AI ë¦¬í¬??/h1>
            <p className="text-sm text-gray-500">
              ?¼ì • ?µê³„ë¥?AIê°€ ?ë™?¼ë¡œ ë¶„ì„?˜ê³  ?”ì•½?©ë‹ˆ??            </p>
            {lastGenerated && (
              <p className="text-xs text-gray-400 mt-1">
                ë§ˆì?ë§??ì„±: {lastGenerated.toLocaleString("ko-KR")}
              </p>
            )}
          </div>
          <button
            onClick={generateSummary}
            disabled={loading || !stats}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? "?§  ?ì„± ì¤?.." : "AI ?”ì•½ ?ì„±"}
          </button>
        </div>
      </motion.div>

      {/* ?µê³„ ì¹´ë“œ */}
      {stats && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition-shadow">
            <p className="text-3xl font-bold text-blue-600">{stats.totalEvents}</p>
            <p className="text-sm text-gray-500 mt-1">ì´??¼ì •</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition-shadow">
            <p className="text-3xl font-bold text-purple-600">{stats.matches}</p>
            <p className="text-sm text-gray-500 mt-1">?€ ?ˆë ¨</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition-shadow">
            <p className="text-3xl font-bold text-indigo-600">{stats.academies}</p>
            <p className="text-sm text-gray-500 mt-1">?„ì¹´?°ë?</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg transition-shadow">
            <p className="text-3xl font-bold text-orange-600">{stats.tournaments}</p>
            <p className="text-sm text-gray-500 mt-1">?€??/p>
          </div>
        </motion.div>
      )}

      {/* ì°¨íŠ¸ */}
      {stats && (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* ë§‰ë? ì°¨íŠ¸ */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">?“Š ?¼ì • ë¶„í¬</h2>
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

          {/* ?Œì´ ì°¨íŠ¸ */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">?“ˆ ?œë™ ë¹„ìœ¨</h2>
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

      {/* AI ?”ì•½ */}
      {summary && (
        <motion.div
          className="bg-white rounded-2xl shadow-md p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">?§ </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AI ?ì„± ?”ì•½</h2>
              <p className="text-xs text-gray-500">
                OpenAI GPT-4o-miniê°€ ë¶„ì„???”ê°„ ?œë™ ë¦¬í¬??              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
            <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
              {summary}
            </p>
          </div>
          {lastGenerated && (
            <p className="text-xs text-gray-400 mt-3 text-right">
              ?ì„± ?œê°: {lastGenerated.toLocaleString("ko-KR")}
            </p>
          )}
        </motion.div>
      )}

      {/* ë¡œë”© ?íƒœ */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">AI ?”ì•½ ?ì„± ì¤?..</p>
            <p className="text-sm text-gray-400 mt-2">
              GPT-4o-miniê°€ ?¼ì • ?°ì´?°ë? ë¶„ì„?˜ê³  ?ˆìŠµ?ˆë‹¤
            </p>
          </div>
        </div>
      )}

      {/* ?ˆë‚´ */}
      {!summary && !loading && stats && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-blue-800">
            ?’¡ "AI ?”ì•½ ?ì„±" ë²„íŠ¼???´ë¦­?˜ë©´ ?´ë²ˆ ???œë™??AIê°€ ?ë™?¼ë¡œ ë¶„ì„?©ë‹ˆ??
          </p>
        </div>
      )}
    </div>
  );
}

