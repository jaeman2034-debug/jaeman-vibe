// ?“Š AI ì±„íŒ… ?µê³„ ?ë™???€?œë³´??import { useEffect, useState } from "react";
import { collectionGroup, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthProvider";
import { exportDailyStatsToCSV, exportSummaryStats, downloadCSV } from "@/utils/exportStats";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type DailyStats = {
  date: string;
  ai: number;
  seller: number;
  total: number;
};

type SummaryStats = {
  ai: number;
  seller: number;
  total: number;
  avgResponseTime: number;
  totalRooms: number;
  activeRooms: number;
};

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  createdAt: any;
  isAI?: boolean;
};

export default function ChatStats() {
  const { user, isAdmin } = useAuth();
  const [dailyData, setDailyData] = useState<DailyStats[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    ai: 0,
    seller: 0,
    total: 0,
    avgResponseTime: 0,
    totalRooms: 0,
    activeRooms: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [exporting, setExporting] = useState(false);

  // ?” ê´€ë¦¬ì ê¶Œí•œ ?•ì¸
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="text-6xl mb-4">?”</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">?‘ê·¼ ê¶Œí•œ ?†ìŒ</h2>
          <p className="text-gray-600">???˜ì´ì§€??ê´€ë¦¬ìë§??‘ê·¼?????ˆìŠµ?ˆë‹¤.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    console.log("?“Š AI ì±„íŒ… ?µê³„ ì´ˆê¸°??..");

    // ?¤ì‹œê°??µê³„ ?˜ì§‘
    const fetchStats = async () => {
      try {
        // ëª¨ë“  ë©”ì‹œì§€ ?˜ì§‘
        const messagesQuery = query(
          collectionGroup(db, "messages"),
          orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          const messages: Message[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.createdAt) {
              messages.push({
                id: doc.id,
                ...data,
              } as Message);
            }
          });

          console.log(`?“Š ì´?${messages.length}ê°?ë©”ì‹œì§€ ?˜ì§‘ ?„ë£Œ`);

          // ? ì§œ ë²”ìœ„ ?„í„°ë§?          const now = new Date();
          const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
          const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

          const filteredMessages = messages.filter((msg) => {
            const msgDate = msg.createdAt?.toDate();
            return msgDate && msgDate >= cutoffDate;
          });

          // ?¼ìë³??µê³„ ê³„ì‚°
          const dailyStats: { [key: string]: { ai: number; seller: number; total: number } } = {};
          let aiCount = 0;
          let sellerCount = 0;
          let totalResponseTime = 0;
          let responseCount = 0;
          let lastTimestamp: Date | null = null;

          // ? ì§œë³„ë¡œ ê·¸ë£¹??          filteredMessages.forEach((msg) => {
            const msgDate = msg.createdAt?.toDate();
            if (!msgDate) return;

            const dateKey = msgDate.toISOString().split("T")[0];
            
            if (!dailyStats[dateKey]) {
              dailyStats[dateKey] = { ai: 0, seller: 0, total: 0 };
            }

            dailyStats[dateKey].total++;

            // AI vs ?ë§¤??êµ¬ë¶„
            if (msg.senderId === "yago-bot" || msg.senderId === "AI" || msg.isAI) {
              dailyStats[dateKey].ai++;
              aiCount++;
            } else {
              dailyStats[dateKey].seller++;
              sellerCount++;
            }

            // ?‘ë‹µ?œê°„ ê³„ì‚°
            if (lastTimestamp) {
              const timeDiff = msgDate.getTime() - lastTimestamp.getTime();
              if (timeDiff > 0 && timeDiff < 30 * 60 * 1000) { // 30ë¶??´ë‚´ ?‘ë‹µë§?                totalResponseTime += timeDiff;
                responseCount++;
              }
            }
            lastTimestamp = msgDate;
          });

          // ì°¨íŠ¸ ?°ì´???ì„± (ìµœê·¼ N??
          const chartData: DailyStats[] = [];
          for (let i = daysAgo - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateKey = date.toISOString().split("T")[0];
            
            chartData.push({
              date: dateKey,
              ai: dailyStats[dateKey]?.ai || 0,
              seller: dailyStats[dateKey]?.seller || 0,
              total: dailyStats[dateKey]?.total || 0,
            });
          }

          // ?”ì•½ ?µê³„ ê³„ì‚°
          const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000 / 60) : 0;

          setDailyData(chartData);
          setSummary({
            ai: aiCount,
            seller: sellerCount,
            total: aiCount + sellerCount,
            avgResponseTime,
            totalRooms: messages.length > 0 ? Math.ceil(messages.length / 10) : 0, // ì¶”ì •ê°?            activeRooms: chartData.reduce((sum, day) => sum + day.total, 0) > 0 ? Math.ceil(chartData.reduce((sum, day) => sum + day.total, 0) / 5) : 0, // ì¶”ì •ê°?          });

          setLoading(false);
          console.log("?“Š ?µê³„ ê³„ì‚° ?„ë£Œ:", summary);
        }, (error) => {
          console.error("???µê³„ ?˜ì§‘ ?¤íŒ¨:", error);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error("???µê³„ ì´ˆê¸°???¤íŒ¨:", error);
        setLoading(false);
      }
    };

    const unsubscribe = fetchStats();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [timeRange]);

  // CSV ?´ë³´?´ê¸° ?¨ìˆ˜??  const handleExportDailyStats = async () => {
    try {
      setExporting(true);
      const csvContent = await exportDailyStatsToCSV(30);
      downloadCSV(csvContent, `YAGO_AI_Chat_Stats_${new Date().toISOString().split("T")[0]}.csv`);
    } catch (error) {
      console.error("???¼ì¼ ?µê³„ ?´ë³´?´ê¸° ?¤íŒ¨:", error);
      alert("?µê³„ ?´ë³´?´ê¸°???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportSummary = async () => {
    try {
      setExporting(true);
      const summaryContent = await exportSummaryStats();
      downloadCSV(summaryContent, `YAGO_AI_Summary_${new Date().toISOString().split("T")[0]}.txt`);
    } catch (error) {
      console.error("???”ì•½ ?µê³„ ?´ë³´?´ê¸° ?¤íŒ¨:", error);
      alert("?”ì•½ ?µê³„ ?´ë³´?´ê¸°???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    } finally {
      setExporting(false);
    }
  };

  // ì°¨íŠ¸ ?‰ìƒ
  const colors = {
    ai: "#8B5CF6",
    seller: "#10B981",
    total: "#3B82F6",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">?µê³„ ?°ì´?°ë? ?˜ì§‘?˜ëŠ” ì¤?..</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ?¤ë” */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ?“Š AI ì±„íŒ… ?µê³„ ?€?œë³´??          </h1>
          <p className="text-gray-600">?¤ì‹œê°?AI & ?ë§¤???‘ë‹µ ?µê³„ ë°?ë¶„ì„</p>
        </div>

        {/* ?œê°„ ë²”ìœ„ ? íƒ ë°??´ë³´?´ê¸° */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-2">
            {[
              { key: "7d", label: "ìµœê·¼ 7?? },
              { key: "30d", label: "ìµœê·¼ 30?? },
              { key: "90d", label: "ìµœê·¼ 90?? },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTimeRange(key as "7d" | "30d" | "90d")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === key
                    ? "bg-purple-500 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ?´ë³´?´ê¸° ë²„íŠ¼??*/}
          <div className="flex gap-2">
            <button
              onClick={handleExportDailyStats}
              disabled={exporting}
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ì²˜ë¦¬ ì¤?..
                </>
              ) : (
                <>
                  ?“Š CSV ?´ë³´?´ê¸°
                </>
              )}
            </button>
            <button
              onClick={handleExportSummary}
              disabled={exporting}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ì²˜ë¦¬ ì¤?..
                </>
              ) : (
                <>
                  ?“‹ ?”ì•½ ?¤ìš´ë¡œë“œ
                </>
              )}
            </button>
          </div>
        </div>

        {/* ?”ì•½ ?µê³„ ì¹´ë“œ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">?¤–</div>
              <div className="text-sm opacity-80">AI ?‘ë‹µ</div>
            </div>
            <div className="text-3xl font-bold">{summary.ai.toLocaleString()}</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">?‘¤</div>
              <div className="text-sm opacity-80">?ë§¤???‘ë‹µ</div>
            </div>
            <div className="text-3xl font-bold">{summary.seller.toLocaleString()}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">?’¬</div>
              <div className="text-sm opacity-80">ì´?ë©”ì‹œì§€</div>
            </div>
            <div className="text-3xl font-bold">{summary.total.toLocaleString()}</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">?±ï¸</div>
              <div className="text-sm opacity-80">?‰ê·  ?‘ë‹µ?œê°„</div>
            </div>
            <div className="text-3xl font-bold">{summary.avgResponseTime}ë¶?/div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">? </div>
              <div className="text-sm opacity-80">ì´?ì±„íŒ…ë°?/div>
            </div>
            <div className="text-3xl font-bold">{summary.totalRooms.toLocaleString()}</div>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">?”¥</div>
              <div className="text-sm opacity-80">?œì„± ì±„íŒ…ë°?/div>
            </div>
            <div className="text-3xl font-bold">{summary.activeRooms.toLocaleString()}</div>
          </div>
        </div>

        {/* ì°¨íŠ¸ ?¹ì…˜ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* ?¼ìë³??‘ë‹µ ì¶”ì´ (êº¾ì???ê·¸ë˜?? */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">?“ˆ ?¼ìë³??‘ë‹µ ì¶”ì´</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString([], { month: "short", day: "numeric" })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value, name) => [value, name === "ai" ? "AI ?‘ë‹µ" : name === "seller" ? "?ë§¤???‘ë‹µ" : "ì´??‘ë‹µ"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="ai" 
                  stroke={colors.ai} 
                  strokeWidth={3}
                  name="AI ?‘ë‹µ"
                  dot={{ fill: colors.ai, strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="seller" 
                  stroke={colors.seller} 
                  strokeWidth={3}
                  name="?ë§¤???‘ë‹µ"
                  dot={{ fill: colors.seller, strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ?‘ë‹µ ë¹„ìœ¨ (?Œì´ ì°¨íŠ¸) */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">?¥§ ?‘ë‹µ ë¹„ìœ¨</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "AI ?‘ë‹µ", value: summary.ai, color: colors.ai },
                    { name: "?ë§¤???‘ë‹µ", value: summary.seller, color: colors.seller },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { name: "AI ?‘ë‹µ", value: summary.ai, color: colors.ai },
                    { name: "?ë§¤???‘ë‹µ", value: summary.seller, color: colors.seller },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(name) => `${name}: ${((value / summary.total) * 100).toFixed(1)}%`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors.ai }}></div>
                <span className="text-sm text-gray-600">AI ?‘ë‹µ ({((summary.ai / summary.total) * 100).toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors.seller }}></div>
                <span className="text-sm text-gray-600">?ë§¤???‘ë‹µ ({((summary.seller / summary.total) * 100).toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ?¼ìë³??ì„¸ ?µê³„ (ë§‰ë? ê·¸ë˜?? */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">?“Š ?¼ìë³??ì„¸ ?µê³„</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString([], { month: "short", day: "numeric" })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value, name) => [value, name === "ai" ? "AI ?‘ë‹µ" : name === "seller" ? "?ë§¤???‘ë‹µ" : "ì´??‘ë‹µ"]}
              />
              <Bar dataKey="ai" fill={colors.ai} name="AI ?‘ë‹µ" />
              <Bar dataKey="seller" fill={colors.seller} name="?ë§¤???‘ë‹µ" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ?µê³„ ?”ì•½ ?Œì´ë¸?*/}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">?“‹ ?ì„¸ ?µê³„ ?”ì•½</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{summary.ai}</div>
              <div className="text-sm text-gray-500">AI ì´??‘ë‹µ</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.seller}</div>
              <div className="text-sm text-gray-500">?ë§¤??ì´??‘ë‹µ</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
              <div className="text-sm text-gray-500">?„ì²´ ë©”ì‹œì§€</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.avgResponseTime}ë¶?/div>
              <div className="text-sm text-gray-500">?‰ê·  ?‘ë‹µ?œê°„</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
