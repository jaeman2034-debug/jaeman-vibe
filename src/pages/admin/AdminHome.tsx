// ?”¥ YAGO VIBE ê´€ë¦¬ì ???€?œë³´???„ì„±??import { useEffect, useState } from "react";
import { doc, getDoc, collectionGroup, getDocs, collection, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthProvider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Link, useSearchParams } from "react-router-dom";
import AdminSummaryCard from "@/components/AdminSummaryCard";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import FCMTestButton from "@/components/FCMTestButton";
import MultilingualTestButton from "@/components/MultilingualTestButton"; // ?Œ ?¤êµ­??TTS ?ŒìŠ¤??ë²„íŠ¼ ?„í¬??import VoiceControlPanel from "@/components/VoiceControlPanel"; // ?¤ ?Œì„± ?œì–´ ?¨ë„ ?„í¬??import VoiceCommandTest from "@/components/VoiceCommandTest"; // ?§ª ?Œì„± ëª…ë ¹???ŒìŠ¤???„í¬??import { useSpeech } from "@/hooks/useSpeech";
import { 
  BarChart3, 
  MessageCircle, 
  Users, 
  Clock, 
  Activity, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Bot,
  User
} from "lucide-react";

export default function AdminHome() {
  const { user, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const { speak } = useSpeech();
  const [todayStats, setTodayStats] = useState({ ai: 0, seller: 0, avg: 0, total: 0 });
  const [chartData, setChartData] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState({ ai: 0, seller: 0, avg: 0 });
  const [lastSync, setLastSync] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState({
    slack: false,
    sheets: false,
    lastReport: null
  });
  const [voiceReport, setVoiceReport] = useState<any>(null); // ?¤ ?Œì„±?¼ë¡œ ì¡°íšŒ??ë¦¬í¬??
  // ?” ê´€ë¦¬ì ê¶Œí•œ ?•ì¸
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="text-6xl mb-4">?”</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">ê´€ë¦¬ì ?„ìš© ?˜ì´ì§€</h2>
          <p className="text-gray-600">???˜ì´ì§€??ê´€ë¦¬ìë§??‘ê·¼?????ˆìŠµ?ˆë‹¤.</p>
        </div>
      </div>
    );
  }

  // ?”¥ FCM ?¸ì‹œ ?Œë¦¼?ì„œ ???ë™ TTS ?¬ìƒ ì²˜ë¦¬
  useEffect(() => {
    if (searchParams.get('autoplay') === 'tts') {
      // FCM ?Œë¦¼?ì„œ ??ê²½ìš° ?ë™?¼ë¡œ TTS ?¬ìƒ
      loadLatestAIReport().then((report) => {
        if (report) {
          const reportText = `?¤ëŠ˜??AI ë¦¬í¬?¸ì…?ˆë‹¤. ${report.summary}`;
          
          // ?½ê°„??ì§€????TTS ?¬ìƒ (?˜ì´ì§€ ë¡œë”© ?„ë£Œ ?? - ?¤êµ­???ë™ ê°ì?
          const timer = setTimeout(() => {
            speak(reportText); // ?¸ì–´ ?ë™ ê°ì?
            console.log('?”Š FCM ?Œë¦¼?ì„œ ???ë™ TTS ?¬ìƒ ?œì‘ (?¤êµ­???ë™ ê°ì?)');
          }, 1500);
          
          return () => clearTimeout(timer);
        } else {
          // ê¸°ë³¸ ë¦¬í¬??          const defaultReportText = `?¤ëŠ˜??AI ë¦¬í¬?¸ì…?ˆë‹¤. ? ê·œ ê°€?…ì ${todayStats.total}ëª? AI ?‘ë‹µ ${todayStats.ai}ê±? ?ë§¤???‘ë‹µ ${todayStats.seller}ê±? ?‰ê·  ?‘ë‹µ?œê°„ ${todayStats.avg}ë¶„ì…?ˆë‹¤. ?„ì²´?ìœ¼ë¡??‘í˜¸???±ê³¼ë¥?ë³´ì´ê³??ˆìŠµ?ˆë‹¤.`;
          
          const timer = setTimeout(() => {
            speak(defaultReportText); // ?¸ì–´ ?ë™ ê°ì?
            console.log('?”Š ê¸°ë³¸ TTS ?¬ìƒ ?œì‘ (?¤êµ­???ë™ ê°ì?)');
          }, 1500);
          
          return () => clearTimeout(timer);
        }
      });
    }
  }, [searchParams, speak, todayStats]);

  // ?”¥ ìµœì‹  AI ë¦¬í¬??ë¡œë“œ ?¨ìˆ˜
  const loadLatestAIReport = async () => {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, "adminReports"),
          orderBy("createdAt", "desc"),
          limit(1)
        )
      );

      if (!snapshot.empty) {
        const latestReport = snapshot.docs[0].data();
        console.log('??ìµœì‹  AI ë¦¬í¬??ë¡œë“œ ?„ë£Œ:', latestReport);
        return latestReport;
      }
      
      return null;
    } catch (error) {
      console.error('??AI ë¦¬í¬??ë¡œë“œ ?¤íŒ¨:', error);
      return null;
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // ëª¨ë“  ë©”ì‹œì§€ ?˜ì§‘
      const snapshot = await getDocs(collectionGroup(db, "messages"));
      const daily = {};
      let ai = 0;
      let seller = 0;
      let totalGap = 0;
      let gapCount = 0;
      let lastTime = null;
      const todayStr = new Date().toISOString().split("T")[0];

      // ë©”ì‹œì§€ ë¶„ì„
      snapshot.forEach((doc) => {
        const msg = doc.data();
        const ts = msg.createdAt?.toDate?.();
        if (!ts) return;
        
        const dStr = ts.toISOString().split("T")[0];
        if (!daily[dStr]) daily[dStr] = { ai: 0, seller: 0 };

        // AI vs ?¬ìš©??êµ¬ë¶„
        if (msg.senderId === "yago-bot" || msg.senderId === "AI" || msg.isAI) {
          daily[dStr].ai++;
          if (dStr === todayStr) ai++;
        } else {
          daily[dStr].seller++;
          if (dStr === todayStr) seller++;
        }

        // ?‘ë‹µ?œê°„ ê³„ì‚° (?¤ëŠ˜ë§?
        if (dStr === todayStr && lastTime) {
          const gap = ts - lastTime;
          if (gap > 0 && gap < 1000 * 60 * 30) { // 30ë¶??´ë‚´
            totalGap += gap;
            gapCount++;
          }
        }
        if (dStr === todayStr) lastTime = ts;
      });

      // ì°¨íŠ¸ ?°ì´???ì„± (ìµœê·¼ 30??
      const chart = Object.keys(daily)
        .sort()
        .slice(-30)
        .map((d) => ({
          date: d.split('-').slice(1).join('/'), // MM/DD ?•ì‹
          ai: daily[d].ai,
          seller: daily[d].seller,
          total: daily[d].ai + daily[d].seller,
        }));

      setChartData(chart);

      // ?¤ëŠ˜ ?µê³„
      const avgResponse = gapCount > 0 ? Math.round(totalGap / gapCount / 1000 / 60) : 0;
      setTodayStats({
        ai,
        seller,
        avg: avgResponse,
        total: ai + seller,
      });

      // ì£¼ê°„ ?‰ê·  ê³„ì‚°
      const weeklyData = Object.keys(daily)
        .sort()
        .slice(-7)
        .map(d => daily[d]);
      
      if (weeklyData.length > 0) {
        const weeklyAi = Math.round(weeklyData.reduce((sum, day) => sum + day.ai, 0) / weeklyData.length);
        const weeklySeller = Math.round(weeklyData.reduce((sum, day) => sum + day.seller, 0) / weeklyData.length);
        setWeeklyStats({ ai: weeklyAi, seller: weeklySeller, avg: 0 });
      }

      // ?¤ì?ì¤„ëŸ¬ ?íƒœ ?•ì¸ (ìµœê·¼ dailyStats ?•ì¸)
      try {
        const dailyStatsRef = collection(db, "dailyStats");
        const q = query(dailyStatsRef, orderBy("createdAt", "desc"), limit(1));
        const dailyStatsSnap = await getDocs(q);
        
        if (!dailyStatsSnap.empty) {
          const lastReport = dailyStatsSnap.docs[0].data();
          const reportDate = lastReport.createdAt?.toDate?.();
          const isRecent = reportDate && (Date.now() - reportDate.getTime()) < 24 * 60 * 60 * 1000; // 24?œê°„ ?´ë‚´
          
          setSchedulerStatus({
            slack: true, // ?˜ê²½ ë³€?˜ëŠ” Functions?ì„œë§??‘ê·¼ ê°€??            sheets: true, // ?˜ê²½ ë³€?˜ëŠ” Functions?ì„œë§??‘ê·¼ ê°€??            lastReport: reportDate?.toLocaleString("ko-KR") || "?†ìŒ"
          });
        }
      } catch (schedulerError) {
        console.warn("?¤ì?ì¤„ëŸ¬ ?íƒœ ?•ì¸ ?¤íŒ¨:", schedulerError);
      }

      setLastSync(new Date().toLocaleString("ko-KR"));
      setLoading(false);

    } catch (err) {
      console.error("???€?œë³´???°ì´??ë¡œë“œ ?¤íŒ¨:", err);
      setError("?°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadDashboardData();
  };

  // ?Œì´ì°¨íŠ¸ ?°ì´??  const pieData = [
    { name: "AI ?‘ë‹µ", value: todayStats.ai, color: "#3b82f6" },
    { name: "?ë§¤???‘ë‹µ", value: todayStats.seller, color: "#10b981" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">?€?œë³´???°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="text-6xl mb-4">??/div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">?¤ë¥˜ ë°œìƒ</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ?¤ì‹œ ?œë„
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ?¤ë” */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              ?™ï¸ YAGO VIBE ê´€ë¦¬ì ?€?œë³´??            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              ?¤ì‹œê°?AI ì±„íŒ… ?µê³„ ë°??œìŠ¤??ëª¨ë‹ˆ?°ë§
            </p>
          </div>
          <div className="flex gap-2">
            {/* PWA ?¤ì¹˜ ë²„íŠ¼ */}
            <button
              id="pwa-install-button"
              className="hidden bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
              style={{ display: 'none' }}
            >
              ?“± ???¤ì¹˜
            </button>
            <button
              onClick={refreshData}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <RefreshCw size={16} />
              ?ˆë¡œê³ ì¹¨
            </button>
          </div>
        </div>

        {/* AI ?”ì•½ + TTS ì¹´ë“œ */}
        <div className="mb-6 sm:mb-8">
          <AdminSummaryCard
            today={todayStats}
            weekly={{
              aiAvg: Math.round(
                chartData.slice(-7).reduce((s, d) => s + (d.ai || 0), 0) / Math.max(1, chartData.slice(-7).length)
              ),
              sellerAvg: Math.round(
                chartData.slice(-7).reduce((s, d) => s + (d.seller || 0), 0) / Math.max(1, chartData.slice(-7).length)
              ),
              respAvg: todayStats.avg // ì£¼ê°„ ?‰ê·  ?‘ë‹µ?œê°„ (ê°„ë‹¨ ?ìš©)
            }}
            autoplay={false} // ?ë™ ??… ë¹„í™œ?±í™” (?˜ë™ ë²„íŠ¼ ?´ë¦­)
          />
        </div>

        {/* ?ë‹¨ ?”ì•½ ì¹´ë“œ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 font-medium text-sm sm:text-base">?¤– ?¤ëŠ˜ AI ?‘ë‹µ</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{todayStats.ai}</p>
              </div>
              <Bot size={24} className="text-blue-200 sm:hidden" />
              <Bot size={32} className="text-blue-200 hidden sm:block" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 font-medium text-sm sm:text-base">?‘¤ ?ë§¤???‘ë‹µ</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{todayStats.seller}</p>
              </div>
              <User size={24} className="text-green-200 sm:hidden" />
              <User size={32} className="text-green-200 hidden sm:block" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 font-medium text-sm sm:text-base">???‰ê·  ?‘ë‹µ?œê°„</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{todayStats.avg}ë¶?/p>
              </div>
              <Clock size={24} className="text-yellow-200 sm:hidden" />
              <Clock size={32} className="text-yellow-200 hidden sm:block" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 font-medium text-sm sm:text-base">?’¬ ì´?ë©”ì‹œì§€</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{todayStats.total}</p>
              </div>
              <MessageCircle size={24} className="text-purple-200 sm:hidden" />
              <MessageCircle size={32} className="text-purple-200 hidden sm:block" />
            </div>
          </div>
        </div>

        {/* ì°¨íŠ¸ ?¹ì…˜ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* ?¼ìë³?ì¶”ì´ ê·¸ë˜??*/}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <TrendingUp size={18} className="text-blue-600 sm:hidden" />
              <TrendingUp size={20} className="text-blue-600 hidden sm:block" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">?“ˆ ?¼ìë³??‘ë‹µ ì¶”ì´ (ìµœê·¼ 30??</h2>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="ai" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="AI ?‘ë‹µ" 
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="seller" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="?ë§¤???‘ë‹µ" 
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ?¤ëŠ˜ ?‘ë‹µ ë¹„ìœ¨ ?Œì´ì°¨íŠ¸ */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={20} className="text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">?“Š ?¤ëŠ˜ ?‘ë‹µ ë¹„ìœ¨</h2>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">AI ?‘ë‹µ: {todayStats.ai}ê±?/span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">?ë§¤???‘ë‹µ: {todayStats.seller}ê±?/span>
              </div>
            </div>
          </div>
        </div>

        {/* ?œìŠ¤???íƒœ ?¹ì…˜ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Slack + Sheets ?°ë™ ?íƒœ */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={20} className="text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">?”„ ?µê³„ ?ë™???íƒœ</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Slack ?ë™ ë¦¬í¬??/span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${schedulerStatus.slack ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-sm ${schedulerStatus.slack ? 'text-green-600' : 'text-red-600'}`}>
                    {schedulerStatus.slack ? '?œì„±?? : 'ë¹„í™œ?±í™”'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Google Sheets ?™ê¸°??/span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${schedulerStatus.sheets ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-sm ${schedulerStatus.sheets ? 'text-green-600' : 'text-red-600'}`}>
                    {schedulerStatus.sheets ? '?œì„±?? : 'ë¹„í™œ?±í™”'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">ìµœê·¼ ë¦¬í¬??/span>
                <span className="text-sm text-gray-500">{schedulerStatus.lastReport || '?†ìŒ'}</span>
              </div>
              <div className="pt-2 border-t">
                <span className="text-sm text-gray-500">
                  ?“… ë§¤ì¼ 23:00 ?ë™ ?¤í–‰ | ?”„ ë§ˆì?ë§??…ë°?´íŠ¸: {lastSync}
                </span>
              </div>
            </div>
          </div>

          {/* ì£¼ê°„ ?‰ê·  ?µê³„ */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={20} className="text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">?“† ì£¼ê°„ ?‰ê·  (7??</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-purple-700 font-medium">?¤– AI ?‘ë‹µ</span>
                  <span className="text-2xl font-bold text-purple-800">{weeklyStats.ai}ê±?/span>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-green-700 font-medium">?‘¤ ?ë§¤???‘ë‹µ</span>
                  <span className="text-2xl font-bold text-green-800">{weeklyStats.seller}ê±?/span>
                </div>
              </div>
              <div className="text-sm text-gray-500 text-center">
                ì§€??7?¼ê°„???¼í‰ê·??µê³„
              </div>
            </div>
          </div>
        </div>

        {/* ê´€ë¦¬ì ê¸°ëŠ¥ ë§í¬ */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">?› ï¸?ê´€ë¦¬ì ê¸°ëŠ¥</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/chat-dashboard"
              className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <MessageCircle size={20} className="text-blue-600 group-hover:text-blue-700" />
              <div>
                <p className="font-medium text-blue-800">ì±„íŒ… ?€?œë³´??/p>
                <p className="text-sm text-blue-600">?¤ì‹œê°?ì±„íŒ… ëª¨ë‹ˆ?°ë§</p>
              </div>
              <ExternalLink size={16} className="text-blue-400 ml-auto" />
            </Link>

            <Link
              to="/admin/chat-stats"
              className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <BarChart3 size={20} className="text-green-600 group-hover:text-green-700" />
              <div>
                <p className="font-medium text-green-800">?µê³„ ?ì„¸ë³´ê¸°</p>
                <p className="text-sm text-green-600">ì°¨íŠ¸ ë°?ë¶„ì„ ?„êµ¬</p>
              </div>
              <ExternalLink size={16} className="text-green-400 ml-auto" />
            </Link>

            <Link
              to="/admin/slack-test"
              className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <AlertCircle size={20} className="text-purple-600 group-hover:text-purple-700" />
              <div>
                <p className="font-medium text-purple-800">Slack ?ŒìŠ¤??/p>
                <p className="text-sm text-purple-600">ë¦¬í¬???˜ë™ ?„ì†¡</p>
              </div>
              <ExternalLink size={16} className="text-purple-400 ml-auto" />
            </Link>

            <Link
              to="/market"
              className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
            >
              <Users size={20} className="text-orange-600 group-hover:text-orange-700" />
              <div>
                <p className="font-medium text-orange-800">ë§ˆì¼“ ê´€ë¦?/p>
                <p className="text-sm text-orange-600">?í’ˆ ë°?ê±°ë˜ ê´€ë¦?/p>
              </div>
              <ExternalLink size={16} className="text-orange-400 ml-auto" />
            </Link>
          </div>
        </div>

          {/* FCM ?ŒìŠ¤???¹ì…˜ */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              ?”” ?¸ì‹œ ?Œë¦¼ ?œìŠ¤??            </h2>
            <FCMTestButton />
          </div>

          {/* ?Œ ?¤êµ­??TTS ?ŒìŠ¤???¹ì…˜ */}
          <MultilingualTestButton />

          {/* ?§ª ?Œì„± ëª…ë ¹???ŒìŠ¤???¹ì…˜ */}
          <VoiceCommandTest />

          {/* ?¤ ?Œì„± ?œì–´ ?¨ë„ ?¹ì…˜ */}
          <VoiceControlPanel onReportUpdate={setVoiceReport} />

          {/* ?¤ ?Œì„±?¼ë¡œ ì¡°íšŒ??ë¦¬í¬???œì‹œ */}
          {voiceReport && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                ?¤ ?Œì„± ì¡°íšŒ ë¦¬í¬??              </h2>
              <AdminSummaryCard 
                today={{
                  ai: voiceReport.kpis?.[0]?.value || 0,
                  seller: voiceReport.kpis?.[1]?.value || 0,
                  avg: voiceReport.kpis?.[2]?.value || 0,
                  total: (voiceReport.kpis?.[0]?.value || 0) + (voiceReport.kpis?.[1]?.value || 0)
                }}
                weekly={undefined}
                autoplay={false}
              />
            </div>
          )}
      </div>

      {/* PWA ?¤ì¹˜ ë°°ë„ˆ */}
      <InstallPrompt />
    </div>
  );
}
