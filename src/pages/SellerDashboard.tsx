import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from "recharts";

interface AnalyticsData {
  sellerId: string;
  totalMessages: number;
  aiMessages: number;
  aiAssistantMessages: number;
  aiShopBotMessages: number;
  buyerMessages: number;
  sellerMessages: number;
  aiResponseRate: number;
  last24hMessages: number;
  last7daysMessages: number;
  avgAIResponseTime: number;
  chatRoomCount: number;
  hourlyDistribution?: { hour: string; count: number }[];
  topKeywords?: { keyword: string; count: number }[];
  updatedAt?: any;
}

export default function SellerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.warn("?�️ 로그?�하지 ?�음");
      navigate("/login");
      return;
    }

    const sellerId = currentUser.uid;
    console.log("?�� ?�계 구독 ?�작:", sellerId);

    // Firestore analytics ?�시�?구독
    const unsub = onSnapshot(
      doc(db, "analytics", sellerId),
      (snap) => {
        if (snap.exists()) {
          console.log("???�계 ?�이???�신:", snap.data());
          setStats(snap.data() as AnalyticsData);
        } else {
          console.warn("?�️ ?�계 ?�이???�음 - �?갱신 ?��?�?);
          setStats(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("???�계 구독 ?�류:", error);
        setLoading(false);
      }
    );

    return () => {
      console.log("?�� ?�계 구독 ?�제");
      unsub();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">?�계 ?�이??로딩 �?..</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">
            ?�계 ?�이?��? ?�직 ?�성?��? ?�았?�니??
          </p>
          <p className="text-sm text-gray-400">
            �?채팅???�작?�거??1?�간 ???�동?�로 ?�성?�니??
          </p>
          <button
            onClick={() => navigate("/market")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            마켓?�로 ?�아가�?          </button>
        </div>
      </div>
    );
  }

  // 메시지 분포 ?�이??  const messageDistribution = [
    { name: "?�체 메시지", value: stats.totalMessages, fill: "#6366F1" },
    { name: "AI ?�답", value: stats.aiMessages, fill: "#22C55E" },
    { name: "구매??메시지", value: stats.buyerMessages, fill: "#F59E0B" },
    { name: "?�매??직접 ?�답", value: stats.sellerMessages, fill: "#EF4444" },
  ];

  // AI ?�형�?분포
  const aiTypeDistribution = [
    { name: "지?�형 AI (ShopBot)", value: stats.aiShopBotMessages, fill: "#22C55E" },
    { name: "기본 AI (Assistant)", value: stats.aiAssistantMessages, fill: "#A78BFA" },
  ];

  const COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444"];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* ?�더 */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">?�� AI ?�점 관리자 ?�?�보??/h1>
            <p className="text-sm text-gray-500 mt-1">
              ?�시�??�계 · AI ?�답 분석 · 고객 문의 ?�사?�트
            </p>
          </div>
          <button
            onClick={() => navigate("/market")}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ??마켓?�로
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* ?�약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">AI ?�답�?/p>
            <p className="text-3xl font-bold text-indigo-600">{stats.aiResponseRate}%</p>
            <p className="text-xs text-gray-400 mt-2">구매??문의 ?��?/p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">�?메시지 ??/p>
            <p className="text-3xl font-bold text-gray-800">{stats.totalMessages}</p>
            <p className="text-xs text-gray-400 mt-2">
              24?�간: {stats.last24hMessages}�?            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">채팅�???/p>
            <p className="text-3xl font-bold text-gray-800">{stats.chatRoomCount}</p>
            <p className="text-xs text-gray-400 mt-2">?�성 채팅�?/p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">?�균 AI ?�답 ?�간</p>
            <p className="text-3xl font-bold text-green-600">{stats.avgAIResponseTime}�?/p>
            <p className="text-xs text-gray-400 mt-2">즉시 ?�답</p>
          </div>
        </div>

        {/* 메인 차트 ?�역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 메시지 분포 ?�이 차트 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">?�� 메시지 분포</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={messageDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {messageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* AI ?�형�?분포 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">?�� AI ?�형�?분포</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={aiTypeDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {aiTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <p className="text-sm text-gray-600">
                  ?�� 지?�형 AI (?�습??: {stats.aiShopBotMessages}�?                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                <p className="text-sm text-gray-600">
                  ?�� 기본 AI: {stats.aiAssistantMessages}�?                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ?�간?��??�래??*/}
        {stats.hourlyDistribution && stats.hourlyDistribution.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">?�� ?�간?��?문의 ?�래??/h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6366F1"
                  strokeWidth={2}
                  name="메시지 ??
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 주요 ?�워??*/}
        {stats.topKeywords && stats.topKeywords.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">?���?고객 주요 문의 ?�워??/h2>
            <div className="space-y-3">
              {stats.topKeywords.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        #{item.keyword}
                      </span>
                      <span className="text-sm text-gray-500">{item.count}??/span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((item.count / stats.buyerMessages) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ?�세 ?�계 ?�이�?*/}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">?�� ?�세 ?�계</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">?�체 메시지</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalMessages}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 mb-1">AI ?�답 (?�체)</p>
              <p className="text-2xl font-bold text-green-700">{stats.aiMessages}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">구매??문의</p>
              <p className="text-2xl font-bold text-blue-700">{stats.buyerMessages}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-xs text-red-600 mb-1">?�매??직접 ?�답</p>
              <p className="text-2xl font-bold text-red-700">{stats.sellerMessages}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-600 mb-1">최근 7??메시지</p>
              <p className="text-2xl font-bold text-purple-700">{stats.last7daysMessages}</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-xs text-indigo-600 mb-1">AI ?�답�?/p>
              <p className="text-2xl font-bold text-indigo-700">{stats.aiResponseRate}%</p>
            </div>
          </div>
        </div>

        {/* ?�단 ?�보 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            마�?�??�데?�트: {stats.updatedAt?.toDate?.().toLocaleString("ko-KR") || "-"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            ?�� ?�계??매시�??�동?�로 갱신?�니??          </p>
        </div>
      </div>
    </div>
  );
}

