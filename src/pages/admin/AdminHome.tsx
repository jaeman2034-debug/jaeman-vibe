// ?�� YAGO VIBE 관리자 ???�?�보???�성??import { useEffect, useState } from "react";
import { doc, getDoc, collectionGroup, getDocs, collection, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthProvider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Link, useSearchParams } from "react-router-dom";
import AdminSummaryCard from "@/components/AdminSummaryCard";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import FCMTestButton from "@/components/FCMTestButton";
import MultilingualTestButton from "@/components/MultilingualTestButton"; // ?�� ?�국??TTS ?�스??버튼 ?�포??import VoiceControlPanel from "@/components/VoiceControlPanel"; // ?�� ?�성 ?�어 ?�널 ?�포??import VoiceCommandTest from "@/components/VoiceCommandTest"; // ?�� ?�성 명령???�스???�포??import { useSpeech } from "@/hooks/useSpeech";
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
  const [voiceReport, setVoiceReport] = useState<any>(null); // ?�� ?�성?�로 조회??리포??
  // ?�� 관리자 권한 ?�인
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="text-6xl mb-4">?��</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">관리자 ?�용 ?�이지</h2>
          <p className="text-gray-600">???�이지??관리자�??�근?????�습?�다.</p>
        </div>
      </div>
    );
  }

  // ?�� FCM ?�시 ?�림?�서 ???�동 TTS ?�생 처리
  useEffect(() => {
    if (searchParams.get('autoplay') === 'tts') {
      // FCM ?�림?�서 ??경우 ?�동?�로 TTS ?�생
      loadLatestAIReport().then((report) => {
        if (report) {
          const reportText = `?�늘??AI 리포?�입?�다. ${report.summary}`;
          
          // ?�간??지????TTS ?�생 (?�이지 로딩 ?�료 ?? - ?�국???�동 감�?
          const timer = setTimeout(() => {
            speak(reportText); // ?�어 ?�동 감�?
            console.log('?�� FCM ?�림?�서 ???�동 TTS ?�생 ?�작 (?�국???�동 감�?)');
          }, 1500);
          
          return () => clearTimeout(timer);
        } else {
          // 기본 리포??          const defaultReportText = `?�늘??AI 리포?�입?�다. ?�규 가?�자 ${todayStats.total}�? AI ?�답 ${todayStats.ai}�? ?�매???�답 ${todayStats.seller}�? ?�균 ?�답?�간 ${todayStats.avg}분입?�다. ?�체?�으�??�호???�과�?보이�??�습?�다.`;
          
          const timer = setTimeout(() => {
            speak(defaultReportText); // ?�어 ?�동 감�?
            console.log('?�� 기본 TTS ?�생 ?�작 (?�국???�동 감�?)');
          }, 1500);
          
          return () => clearTimeout(timer);
        }
      });
    }
  }, [searchParams, speak, todayStats]);

  // ?�� 최신 AI 리포??로드 ?�수
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
        console.log('??최신 AI 리포??로드 ?�료:', latestReport);
        return latestReport;
      }
      
      return null;
    } catch (error) {
      console.error('??AI 리포??로드 ?�패:', error);
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

      // 모든 메시지 ?�집
      const snapshot = await getDocs(collectionGroup(db, "messages"));
      const daily = {};
      let ai = 0;
      let seller = 0;
      let totalGap = 0;
      let gapCount = 0;
      let lastTime = null;
      const todayStr = new Date().toISOString().split("T")[0];

      // 메시지 분석
      snapshot.forEach((doc) => {
        const msg = doc.data();
        const ts = msg.createdAt?.toDate?.();
        if (!ts) return;
        
        const dStr = ts.toISOString().split("T")[0];
        if (!daily[dStr]) daily[dStr] = { ai: 0, seller: 0 };

        // AI vs ?�용??구분
        if (msg.senderId === "yago-bot" || msg.senderId === "AI" || msg.isAI) {
          daily[dStr].ai++;
          if (dStr === todayStr) ai++;
        } else {
          daily[dStr].seller++;
          if (dStr === todayStr) seller++;
        }

        // ?�답?�간 계산 (?�늘�?
        if (dStr === todayStr && lastTime) {
          const gap = ts - lastTime;
          if (gap > 0 && gap < 1000 * 60 * 30) { // 30�??�내
            totalGap += gap;
            gapCount++;
          }
        }
        if (dStr === todayStr) lastTime = ts;
      });

      // 차트 ?�이???�성 (최근 30??
      const chart = Object.keys(daily)
        .sort()
        .slice(-30)
        .map((d) => ({
          date: d.split('-').slice(1).join('/'), // MM/DD ?�식
          ai: daily[d].ai,
          seller: daily[d].seller,
          total: daily[d].ai + daily[d].seller,
        }));

      setChartData(chart);

      // ?�늘 ?�계
      const avgResponse = gapCount > 0 ? Math.round(totalGap / gapCount / 1000 / 60) : 0;
      setTodayStats({
        ai,
        seller,
        avg: avgResponse,
        total: ai + seller,
      });

      // 주간 ?�균 계산
      const weeklyData = Object.keys(daily)
        .sort()
        .slice(-7)
        .map(d => daily[d]);
      
      if (weeklyData.length > 0) {
        const weeklyAi = Math.round(weeklyData.reduce((sum, day) => sum + day.ai, 0) / weeklyData.length);
        const weeklySeller = Math.round(weeklyData.reduce((sum, day) => sum + day.seller, 0) / weeklyData.length);
        setWeeklyStats({ ai: weeklyAi, seller: weeklySeller, avg: 0 });
      }

      // ?��?줄러 ?�태 ?�인 (최근 dailyStats ?�인)
      try {
        const dailyStatsRef = collection(db, "dailyStats");
        const q = query(dailyStatsRef, orderBy("createdAt", "desc"), limit(1));
        const dailyStatsSnap = await getDocs(q);
        
        if (!dailyStatsSnap.empty) {
          const lastReport = dailyStatsSnap.docs[0].data();
          const reportDate = lastReport.createdAt?.toDate?.();
          const isRecent = reportDate && (Date.now() - reportDate.getTime()) < 24 * 60 * 60 * 1000; // 24?�간 ?�내
          
          setSchedulerStatus({
            slack: true, // ?�경 변?�는 Functions?�서�??�근 가??            sheets: true, // ?�경 변?�는 Functions?�서�??�근 가??            lastReport: reportDate?.toLocaleString("ko-KR") || "?�음"
          });
        }
      } catch (schedulerError) {
        console.warn("?��?줄러 ?�태 ?�인 ?�패:", schedulerError);
      }

      setLastSync(new Date().toLocaleString("ko-KR"));
      setLoading(false);

    } catch (err) {
      console.error("???�?�보???�이??로드 ?�패:", err);
      setError("?�이?��? 불러?�는 �??�류가 발생?�습?�다.");
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadDashboardData();
  };

  // ?�이차트 ?�이??  const pieData = [
    { name: "AI ?�답", value: todayStats.ai, color: "#3b82f6" },
    { name: "?�매???�답", value: todayStats.seller, color: "#10b981" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">?�?�보???�이?��? 불러?�는 �?..</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="text-6xl mb-4">??/div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">?�류 발생</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ?�시 ?�도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ?�더 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              ?�️ YAGO VIBE 관리자 ?�?�보??            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              ?�시�?AI 채팅 ?�계 �??�스??모니?�링
            </p>
          </div>
          <div className="flex gap-2">
            {/* PWA ?�치 버튼 */}
            <button
              id="pwa-install-button"
              className="hidden bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
              style={{ display: 'none' }}
            >
              ?�� ???�치
            </button>
            <button
              onClick={refreshData}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <RefreshCw size={16} />
              ?�로고침
            </button>
          </div>
        </div>

        {/* AI ?�약 + TTS 카드 */}
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
              respAvg: todayStats.avg // 주간 ?�균 ?�답?�간 (간단 ?�용)
            }}
            autoplay={false} // ?�동 ??�� 비활?�화 (?�동 버튼 ?�릭)
          />
        </div>

        {/* ?�단 ?�약 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 font-medium text-sm sm:text-base">?�� ?�늘 AI ?�답</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{todayStats.ai}</p>
              </div>
              <Bot size={24} className="text-blue-200 sm:hidden" />
              <Bot size={32} className="text-blue-200 hidden sm:block" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 font-medium text-sm sm:text-base">?�� ?�매???�답</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{todayStats.seller}</p>
              </div>
              <User size={24} className="text-green-200 sm:hidden" />
              <User size={32} className="text-green-200 hidden sm:block" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 font-medium text-sm sm:text-base">???�균 ?�답?�간</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{todayStats.avg}�?/p>
              </div>
              <Clock size={24} className="text-yellow-200 sm:hidden" />
              <Clock size={32} className="text-yellow-200 hidden sm:block" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 font-medium text-sm sm:text-base">?�� �?메시지</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{todayStats.total}</p>
              </div>
              <MessageCircle size={24} className="text-purple-200 sm:hidden" />
              <MessageCircle size={32} className="text-purple-200 hidden sm:block" />
            </div>
          </div>
        </div>

        {/* 차트 ?�션 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* ?�자�?추이 그래??*/}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <TrendingUp size={18} className="text-blue-600 sm:hidden" />
              <TrendingUp size={20} className="text-blue-600 hidden sm:block" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">?�� ?�자�??�답 추이 (최근 30??</h2>
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
                  name="AI ?�답" 
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="seller" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="?�매???�답" 
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ?�늘 ?�답 비율 ?�이차트 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={20} className="text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">?�� ?�늘 ?�답 비율</h2>
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
                <span className="text-sm text-gray-600">AI ?�답: {todayStats.ai}�?/span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">?�매???�답: {todayStats.seller}�?/span>
              </div>
            </div>
          </div>
        </div>

        {/* ?�스???�태 ?�션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Slack + Sheets ?�동 ?�태 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={20} className="text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">?�� ?�계 ?�동???�태</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Slack ?�동 리포??/span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${schedulerStatus.slack ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-sm ${schedulerStatus.slack ? 'text-green-600' : 'text-red-600'}`}>
                    {schedulerStatus.slack ? '?�성?? : '비활?�화'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Google Sheets ?�기??/span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${schedulerStatus.sheets ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-sm ${schedulerStatus.sheets ? 'text-green-600' : 'text-red-600'}`}>
                    {schedulerStatus.sheets ? '?�성?? : '비활?�화'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">최근 리포??/span>
                <span className="text-sm text-gray-500">{schedulerStatus.lastReport || '?�음'}</span>
              </div>
              <div className="pt-2 border-t">
                <span className="text-sm text-gray-500">
                  ?�� 매일 23:00 ?�동 ?�행 | ?�� 마�?�??�데?�트: {lastSync}
                </span>
              </div>
            </div>
          </div>

          {/* 주간 ?�균 ?�계 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={20} className="text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">?�� 주간 ?�균 (7??</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-purple-700 font-medium">?�� AI ?�답</span>
                  <span className="text-2xl font-bold text-purple-800">{weeklyStats.ai}�?/span>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-green-700 font-medium">?�� ?�매???�답</span>
                  <span className="text-2xl font-bold text-green-800">{weeklyStats.seller}�?/span>
                </div>
              </div>
              <div className="text-sm text-gray-500 text-center">
                지??7?�간???�평�??�계
              </div>
            </div>
          </div>
        </div>

        {/* 관리자 기능 링크 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">?���?관리자 기능</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/chat-dashboard"
              className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <MessageCircle size={20} className="text-blue-600 group-hover:text-blue-700" />
              <div>
                <p className="font-medium text-blue-800">채팅 ?�?�보??/p>
                <p className="text-sm text-blue-600">?�시�?채팅 모니?�링</p>
              </div>
              <ExternalLink size={16} className="text-blue-400 ml-auto" />
            </Link>

            <Link
              to="/admin/chat-stats"
              className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <BarChart3 size={20} className="text-green-600 group-hover:text-green-700" />
              <div>
                <p className="font-medium text-green-800">?�계 ?�세보기</p>
                <p className="text-sm text-green-600">차트 �?분석 ?�구</p>
              </div>
              <ExternalLink size={16} className="text-green-400 ml-auto" />
            </Link>

            <Link
              to="/admin/slack-test"
              className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <AlertCircle size={20} className="text-purple-600 group-hover:text-purple-700" />
              <div>
                <p className="font-medium text-purple-800">Slack ?�스??/p>
                <p className="text-sm text-purple-600">리포???�동 ?�송</p>
              </div>
              <ExternalLink size={16} className="text-purple-400 ml-auto" />
            </Link>

            <Link
              to="/market"
              className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
            >
              <Users size={20} className="text-orange-600 group-hover:text-orange-700" />
              <div>
                <p className="font-medium text-orange-800">마켓 관�?/p>
                <p className="text-sm text-orange-600">?�품 �?거래 관�?/p>
              </div>
              <ExternalLink size={16} className="text-orange-400 ml-auto" />
            </Link>
          </div>
        </div>

          {/* FCM ?�스???�션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              ?�� ?�시 ?�림 ?�스??            </h2>
            <FCMTestButton />
          </div>

          {/* ?�� ?�국??TTS ?�스???�션 */}
          <MultilingualTestButton />

          {/* ?�� ?�성 명령???�스???�션 */}
          <VoiceCommandTest />

          {/* ?�� ?�성 ?�어 ?�널 ?�션 */}
          <VoiceControlPanel onReportUpdate={setVoiceReport} />

          {/* ?�� ?�성?�로 조회??리포???�시 */}
          {voiceReport && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                ?�� ?�성 조회 리포??              </h2>
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

      {/* PWA ?�치 배너 */}
      <InstallPrompt />
    </div>
  );
}
