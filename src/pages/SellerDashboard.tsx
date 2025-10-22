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
      console.warn("? ï¸ ë¡œê·¸?¸í•˜ì§€ ?ŠìŒ");
      navigate("/login");
      return;
    }

    const sellerId = currentUser.uid;
    console.log("?“Š ?µê³„ êµ¬ë… ?œì‘:", sellerId);

    // Firestore analytics ?¤ì‹œê°?êµ¬ë…
    const unsub = onSnapshot(
      doc(db, "analytics", sellerId),
      (snap) => {
        if (snap.exists()) {
          console.log("???µê³„ ?°ì´???˜ì‹ :", snap.data());
          setStats(snap.data() as AnalyticsData);
        } else {
          console.warn("? ï¸ ?µê³„ ?°ì´???†ìŒ - ì²?ê°±ì‹  ?€ê¸?ì¤?);
          setStats(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("???µê³„ êµ¬ë… ?¤ë¥˜:", error);
        setLoading(false);
      }
    );

    return () => {
      console.log("?”Œ ?µê³„ êµ¬ë… ?´ì œ");
      unsub();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">?µê³„ ?°ì´??ë¡œë”© ì¤?..</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">
            ?µê³„ ?°ì´?°ê? ?„ì§ ?ì„±?˜ì? ?Šì•˜?µë‹ˆ??
          </p>
          <p className="text-sm text-gray-400">
            ì²?ì±„íŒ…???œì‘?˜ê±°??1?œê°„ ???ë™?¼ë¡œ ?ì„±?©ë‹ˆ??
          </p>
          <button
            onClick={() => navigate("/market")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ë§ˆì¼“?¼ë¡œ ?Œì•„ê°€ê¸?          </button>
        </div>
      </div>
    );
  }

  // ë©”ì‹œì§€ ë¶„í¬ ?°ì´??  const messageDistribution = [
    { name: "?„ì²´ ë©”ì‹œì§€", value: stats.totalMessages, fill: "#6366F1" },
    { name: "AI ?‘ë‹µ", value: stats.aiMessages, fill: "#22C55E" },
    { name: "êµ¬ë§¤??ë©”ì‹œì§€", value: stats.buyerMessages, fill: "#F59E0B" },
    { name: "?ë§¤??ì§ì ‘ ?‘ë‹µ", value: stats.sellerMessages, fill: "#EF4444" },
  ];

  // AI ? í˜•ë³?ë¶„í¬
  const aiTypeDistribution = [
    { name: "ì§€?¥í˜• AI (ShopBot)", value: stats.aiShopBotMessages, fill: "#22C55E" },
    { name: "ê¸°ë³¸ AI (Assistant)", value: stats.aiAssistantMessages, fill: "#A78BFA" },
  ];

  const COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444"];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* ?¤ë” */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">?“Š AI ?ì  ê´€ë¦¬ì ?€?œë³´??/h1>
            <p className="text-sm text-gray-500 mt-1">
              ?¤ì‹œê°??µê³„ Â· AI ?‘ë‹µ ë¶„ì„ Â· ê³ ê° ë¬¸ì˜ ?¸ì‚¬?´íŠ¸
            </p>
          </div>
          <button
            onClick={() => navigate("/market")}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ??ë§ˆì¼“?¼ë¡œ
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* ?”ì•½ ì¹´ë“œ */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">AI ?‘ë‹µë¥?/p>
            <p className="text-3xl font-bold text-indigo-600">{stats.aiResponseRate}%</p>
            <p className="text-xs text-gray-400 mt-2">êµ¬ë§¤??ë¬¸ì˜ ?€ë¹?/p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">ì´?ë©”ì‹œì§€ ??/p>
            <p className="text-3xl font-bold text-gray-800">{stats.totalMessages}</p>
            <p className="text-xs text-gray-400 mt-2">
              24?œê°„: {stats.last24hMessages}ê°?            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">ì±„íŒ…ë°???/p>
            <p className="text-3xl font-bold text-gray-800">{stats.chatRoomCount}</p>
            <p className="text-xs text-gray-400 mt-2">?œì„± ì±„íŒ…ë°?/p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">?‰ê·  AI ?‘ë‹µ ?œê°„</p>
            <p className="text-3xl font-bold text-green-600">{stats.avgAIResponseTime}ì´?/p>
            <p className="text-xs text-gray-400 mt-2">ì¦‰ì‹œ ?‘ë‹µ</p>
          </div>
        </div>

        {/* ë©”ì¸ ì°¨íŠ¸ ?ì—­ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* ë©”ì‹œì§€ ë¶„í¬ ?Œì´ ì°¨íŠ¸ */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">?’¬ ë©”ì‹œì§€ ë¶„í¬</h2>
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

          {/* AI ? í˜•ë³?ë¶„í¬ */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">?¤– AI ? í˜•ë³?ë¶„í¬</h2>
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
                  ?§  ì§€?¥í˜• AI (?™ìŠµ??: {stats.aiShopBotMessages}ê°?                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                <p className="text-sm text-gray-600">
                  ?¤– ê¸°ë³¸ AI: {stats.aiAssistantMessages}ê°?                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ?œê°„?€ë³??¸ë˜??*/}
        {stats.hourlyDistribution && stats.hourlyDistribution.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">?“ˆ ?œê°„?€ë³?ë¬¸ì˜ ?¸ë˜??/h2>
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
                  name="ë©”ì‹œì§€ ??
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ì£¼ìš” ?¤ì›Œ??*/}
        {stats.topKeywords && stats.topKeywords.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">?·ï¸?ê³ ê° ì£¼ìš” ë¬¸ì˜ ?¤ì›Œ??/h2>
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

        {/* ?ì„¸ ?µê³„ ?Œì´ë¸?*/}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">?“‹ ?ì„¸ ?µê³„</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">?„ì²´ ë©”ì‹œì§€</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalMessages}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 mb-1">AI ?‘ë‹µ (?„ì²´)</p>
              <p className="text-2xl font-bold text-green-700">{stats.aiMessages}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">êµ¬ë§¤??ë¬¸ì˜</p>
              <p className="text-2xl font-bold text-blue-700">{stats.buyerMessages}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-xs text-red-600 mb-1">?ë§¤??ì§ì ‘ ?‘ë‹µ</p>
              <p className="text-2xl font-bold text-red-700">{stats.sellerMessages}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-600 mb-1">ìµœê·¼ 7??ë©”ì‹œì§€</p>
              <p className="text-2xl font-bold text-purple-700">{stats.last7daysMessages}</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-xs text-indigo-600 mb-1">AI ?‘ë‹µë¥?/p>
              <p className="text-2xl font-bold text-indigo-700">{stats.aiResponseRate}%</p>
            </div>
          </div>
        </div>

        {/* ?˜ë‹¨ ?•ë³´ */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            ë§ˆì?ë§??…ë°?´íŠ¸: {stats.updatedAt?.toDate?.().toLocaleString("ko-KR") || "-"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            ?’¡ ?µê³„??ë§¤ì‹œê°??ë™?¼ë¡œ ê°±ì‹ ?©ë‹ˆ??          </p>
        </div>
      </div>
    </div>
  );
}

