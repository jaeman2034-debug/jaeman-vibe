// ?�� AI 채팅 ?�계 ?�동???�?�보??import { useEffect, useState } from "react";
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

  // ?�� 관리자 권한 ?�인
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="text-6xl mb-4">?��</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">?�근 권한 ?�음</h2>
          <p className="text-gray-600">???�이지??관리자�??�근?????�습?�다.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    console.log("?�� AI 채팅 ?�계 초기??..");

    // ?�시�??�계 ?�집
    const fetchStats = async () => {
      try {
        // 모든 메시지 ?�집
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

          console.log(`?�� �?${messages.length}�?메시지 ?�집 ?�료`);

          // ?�짜 범위 ?�터�?          const now = new Date();
          const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
          const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

          const filteredMessages = messages.filter((msg) => {
            const msgDate = msg.createdAt?.toDate();
            return msgDate && msgDate >= cutoffDate;
          });

          // ?�자�??�계 계산
          const dailyStats: { [key: string]: { ai: number; seller: number; total: number } } = {};
          let aiCount = 0;
          let sellerCount = 0;
          let totalResponseTime = 0;
          let responseCount = 0;
          let lastTimestamp: Date | null = null;

          // ?�짜별로 그룹??          filteredMessages.forEach((msg) => {
            const msgDate = msg.createdAt?.toDate();
            if (!msgDate) return;

            const dateKey = msgDate.toISOString().split("T")[0];
            
            if (!dailyStats[dateKey]) {
              dailyStats[dateKey] = { ai: 0, seller: 0, total: 0 };
            }

            dailyStats[dateKey].total++;

            // AI vs ?�매??구분
            if (msg.senderId === "yago-bot" || msg.senderId === "AI" || msg.isAI) {
              dailyStats[dateKey].ai++;
              aiCount++;
            } else {
              dailyStats[dateKey].seller++;
              sellerCount++;
            }

            // ?�답?�간 계산
            if (lastTimestamp) {
              const timeDiff = msgDate.getTime() - lastTimestamp.getTime();
              if (timeDiff > 0 && timeDiff < 30 * 60 * 1000) { // 30�??�내 ?�답�?                totalResponseTime += timeDiff;
                responseCount++;
              }
            }
            lastTimestamp = msgDate;
          });

          // 차트 ?�이???�성 (최근 N??
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

          // ?�약 ?�계 계산
          const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000 / 60) : 0;

          setDailyData(chartData);
          setSummary({
            ai: aiCount,
            seller: sellerCount,
            total: aiCount + sellerCount,
            avgResponseTime,
            totalRooms: messages.length > 0 ? Math.ceil(messages.length / 10) : 0, // 추정�?            activeRooms: chartData.reduce((sum, day) => sum + day.total, 0) > 0 ? Math.ceil(chartData.reduce((sum, day) => sum + day.total, 0) / 5) : 0, // 추정�?          });

          setLoading(false);
          console.log("?�� ?�계 계산 ?�료:", summary);
        }, (error) => {
          console.error("???�계 ?�집 ?�패:", error);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error("???�계 초기???�패:", error);
        setLoading(false);
      }
    };

    const unsubscribe = fetchStats();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [timeRange]);

  // CSV ?�보?�기 ?�수??  const handleExportDailyStats = async () => {
    try {
      setExporting(true);
      const csvContent = await exportDailyStatsToCSV(30);
      downloadCSV(csvContent, `YAGO_AI_Chat_Stats_${new Date().toISOString().split("T")[0]}.csv`);
    } catch (error) {
      console.error("???�일 ?�계 ?�보?�기 ?�패:", error);
      alert("?�계 ?�보?�기???�패?�습?�다.");
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
      console.error("???�약 ?�계 ?�보?�기 ?�패:", error);
      alert("?�약 ?�계 ?�보?�기???�패?�습?�다.");
    } finally {
      setExporting(false);
    }
  };

  // 차트 ?�상
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
          <p className="text-gray-600">?�계 ?�이?��? ?�집?�는 �?..</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ?�더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ?�� AI 채팅 ?�계 ?�?�보??          </h1>
          <p className="text-gray-600">?�시�?AI & ?�매???�답 ?�계 �?분석</p>
        </div>

        {/* ?�간 범위 ?�택 �??�보?�기 */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-2">
            {[
              { key: "7d", label: "최근 7?? },
              { key: "30d", label: "최근 30?? },
              { key: "90d", label: "최근 90?? },
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

          {/* ?�보?�기 버튼??*/}
          <div className="flex gap-2">
            <button
              onClick={handleExportDailyStats}
              disabled={exporting}
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  처리 �?..
                </>
              ) : (
                <>
                  ?�� CSV ?�보?�기
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
                  처리 �?..
                </>
              ) : (
                <>
                  ?�� ?�약 ?�운로드
                </>
              )}
            </button>
          </div>
        </div>

        {/* ?�약 ?�계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">?��</div>
              <div className="text-sm opacity-80">AI ?�답</div>
            </div>
            <div className="text-3xl font-bold">{summary.ai.toLocaleString()}</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">?��</div>
              <div className="text-sm opacity-80">?�매???�답</div>
            </div>
            <div className="text-3xl font-bold">{summary.seller.toLocaleString()}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">?��</div>
              <div className="text-sm opacity-80">�?메시지</div>
            </div>
            <div className="text-3xl font-bold">{summary.total.toLocaleString()}</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">?�️</div>
              <div className="text-sm opacity-80">?�균 ?�답?�간</div>
            </div>
            <div className="text-3xl font-bold">{summary.avgResponseTime}�?/div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">?��</div>
              <div className="text-sm opacity-80">�?채팅�?/div>
            </div>
            <div className="text-3xl font-bold">{summary.totalRooms.toLocaleString()}</div>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">?��</div>
              <div className="text-sm opacity-80">?�성 채팅�?/div>
            </div>
            <div className="text-3xl font-bold">{summary.activeRooms.toLocaleString()}</div>
          </div>
        </div>

        {/* 차트 ?�션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* ?�자�??�답 추이 (꺾�???그래?? */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">?�� ?�자�??�답 추이</h2>
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
                  formatter={(value, name) => [value, name === "ai" ? "AI ?�답" : name === "seller" ? "?�매???�답" : "�??�답"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="ai" 
                  stroke={colors.ai} 
                  strokeWidth={3}
                  name="AI ?�답"
                  dot={{ fill: colors.ai, strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="seller" 
                  stroke={colors.seller} 
                  strokeWidth={3}
                  name="?�매???�답"
                  dot={{ fill: colors.seller, strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ?�답 비율 (?�이 차트) */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">?�� ?�답 비율</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "AI ?�답", value: summary.ai, color: colors.ai },
                    { name: "?�매???�답", value: summary.seller, color: colors.seller },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { name: "AI ?�답", value: summary.ai, color: colors.ai },
                    { name: "?�매???�답", value: summary.seller, color: colors.seller },
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
                <span className="text-sm text-gray-600">AI ?�답 ({((summary.ai / summary.total) * 100).toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors.seller }}></div>
                <span className="text-sm text-gray-600">?�매???�답 ({((summary.seller / summary.total) * 100).toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ?�자�??�세 ?�계 (막�? 그래?? */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">?�� ?�자�??�세 ?�계</h2>
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
                formatter={(value, name) => [value, name === "ai" ? "AI ?�답" : name === "seller" ? "?�매???�답" : "�??�답"]}
              />
              <Bar dataKey="ai" fill={colors.ai} name="AI ?�답" />
              <Bar dataKey="seller" fill={colors.seller} name="?�매???�답" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ?�계 ?�약 ?�이�?*/}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">?�� ?�세 ?�계 ?�약</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{summary.ai}</div>
              <div className="text-sm text-gray-500">AI �??�답</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.seller}</div>
              <div className="text-sm text-gray-500">?�매??�??�답</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
              <div className="text-sm text-gray-500">?�체 메시지</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.avgResponseTime}�?/div>
              <div className="text-sm text-gray-500">?�균 ?�답?�간</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
