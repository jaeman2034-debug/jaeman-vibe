import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { motion } from "framer-motion";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { generateInvestorPDF } from "../lib/testReports";
import { generateReportPDF, generateInvestorReportPDF } from "../utils/generateReportPDF";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadReports();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadReports = () => {
    console.log("?�� AI 리포???�이??로드 ?�작");
    
    const q = query(
      collection(db, "reports"), 
      orderBy("date", "desc"),
      limit(30) // 최근 30??    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      console.log("?�� AI 리포???�데?�트:", snapshot.docs.length, "�?);
      
      const items = snapshot.docs.map((d) => ({ 
        id: d.id, 
        ...d.data(),
        formattedDate: formatDate(d.data().date)
      }));
      
      setReports(items);
      setLoading(false);
    }, (error) => {
      console.error("??AI 리포??로드 ?�패:", error);
      setLoading(false);
    });

    return () => unsub();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // 차트 ?�이??준�?  const chartData = reports.slice().reverse().map((r) => ({
    name: formatDate(r.date),
    date: r.date,
    FCM: r.stats?.FCM || r.stats?.fcm || 0,
    Slack: r.stats?.Slack || r.stats?.slack || 0,
    Kakao: r.stats?.Kakao || r.stats?.kakao || 0,
    Message: r.stats?.message || 0,
    Comment: r.stats?.comment || 0,
    Market: r.stats?.market || 0,
    System: r.stats?.system || 0,
    Total: (r.stats?.FCM || 0) + (r.stats?.Slack || 0) + (r.stats?.Kakao || 0) + 
           (r.stats?.message || 0) + (r.stats?.comment || 0) + (r.stats?.market || 0) + (r.stats?.system || 0)
  }));

  // 최신 리포??  const latest = reports[0];

  // ?�계 계산
  const totalNotifications = reports.reduce((sum, r) => {
    return sum + ((r.stats?.FCM || 0) + (r.stats?.Slack || 0) + (r.stats?.Kakao || 0) + 
                  (r.stats?.message || 0) + (r.stats?.comment || 0) + (r.stats?.market || 0) + (r.stats?.system || 0));
  }, 0);

  const avgDaily = reports.length > 0 ? Math.round(totalNotifications / reports.length) : 0;

  // PDF ?�운로드 ?�수
  const downloadPDF = async (reportDate: string) => {
    if (downloading === reportDate) return;
    
    setDownloading(reportDate);
    try {
      console.log("?�� PDF ?�운로드 ?�작:", reportDate);
      
      // 리포???�이??가?�오�?      const report = reports.find(r => r.date === reportDate);
      if (!report) {
        alert("리포???�이?��? 찾을 ???�습?�다.");
        return;
      }

      // HTML ?�플�??�성
      const htmlContent = generateHTMLTemplate(report);
      
      // HTML??PDF�?변?�하???�운로드
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // ??창에???�기 (브라?��????�쇄 기능 ?�용)
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      // ?�는 직접 ?�운로드 링크 ?�성
      const link = document.createElement('a');
      link.href = url;
      link.download = `YAGO_VIBE_Report_${reportDate}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log("??PDF ?�운로드 ?�료");
    } catch (error) {
      console.error("??PDF ?�운로드 ?�패:", error);
      alert("PDF ?�운로드???�패?�습?�다.");
    } finally {
      setDownloading(null);
    }
  };

  // HTML ?�플�??�성 ?�수
  const generateHTMLTemplate = (report: any) => {
    const reportDate = new Date(report.date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>YAGO VIBE 리포??- ${report.date}</title>
  <style>
    body {
      font-family: 'Segoe UI', 'Malgun Gothic', sans-serif;
      color: #333;
      margin: 0;
      padding: 40px;
      background: #f8fafc;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 10px;
    }
    h1 {
      color: #2563eb;
      font-size: 28px;
      margin: 0;
    }
    .subtitle {
      color: #6b7280;
      font-size: 16px;
      margin-top: 5px;
    }
    .section {
      margin-bottom: 35px;
    }
    h2 {
      color: #1f2937;
      font-size: 20px;
      border-left: 4px solid #2563eb;
      padding-left: 15px;
      margin-bottom: 15px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
    }
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 12px;
      text-align: center;
    }
    th {
      background: #f3f4f6;
      font-weight: bold;
      color: #374151;
    }
    .summary-box {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-left: 4px solid #0ea5e9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    @media print {
      body { background: white; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">??/div>
      <h1>YAGO VIBE ?�일 리포??/h1>
      <div class="subtitle">AI ?�동 ?�성 리포????${reportDate}</div>
    </div>

    <div class="section">
      <h2>?�� ?�심 ?�과 지??/h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${(report.stats?.FCM || 0) + (report.stats?.Slack || 0) + (report.stats?.Kakao || 0) + (report.stats?.message || 0) + (report.stats?.comment || 0) + (report.stats?.market || 0) + (report.stats?.system || 0)}</div>
          <div class="stat-label">�??�림 ??/div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${report.stats?.FCM || 0}</div>
          <div class="stat-label">FCM ?�림</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${report.stats?.Slack || 0}</div>
          <div class="stat-label">Slack ?�림</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${report.stats?.Kakao || 0}</div>
          <div class="stat-label">Kakao ?�림</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>?�� ?�세 ?�계</h2>
      <table>
        <thead>
          <tr>
            <th>채널/?�??/th>
            <th>?�림 ??/th>
            <th>비율</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>FCM</td><td>${report.stats?.FCM || 0}</td><td>${Math.round(((report.stats?.FCM || 0) / ((report.stats?.FCM || 0) + (report.stats?.Slack || 0) + (report.stats?.Kakao || 0) + (report.stats?.message || 0) + (report.stats?.comment || 0) + (report.stats?.market || 0) + (report.stats?.system || 0))) * 100)}%</td></tr>
          <tr><td>Slack</td><td>${report.stats?.Slack || 0}</td><td>${Math.round(((report.stats?.Slack || 0) / ((report.stats?.FCM || 0) + (report.stats?.Slack || 0) + (report.stats?.Kakao || 0) + (report.stats?.message || 0) + (report.stats?.comment || 0) + (report.stats?.market || 0) + (report.stats?.system || 0))) * 100)}%</td></tr>
          <tr><td>Kakao</td><td>${report.stats?.Kakao || 0}</td><td>${Math.round(((report.stats?.Kakao || 0) / ((report.stats?.FCM || 0) + (report.stats?.Slack || 0) + (report.stats?.Kakao || 0) + (report.stats?.message || 0) + (report.stats?.comment || 0) + (report.stats?.market || 0) + (report.stats?.system || 0))) * 100)}%</td></tr>
          <tr><td>메시지</td><td>${report.stats?.message || 0}</td><td>${Math.round(((report.stats?.message || 0) / ((report.stats?.FCM || 0) + (report.stats?.Slack || 0) + (report.stats?.Kakao || 0) + (report.stats?.message || 0) + (report.stats?.comment || 0) + (report.stats?.market || 0) + (report.stats?.system || 0))) * 100)}%</td></tr>
          <tr><td>?��?</td><td>${report.stats?.comment || 0}</td><td>${Math.round(((report.stats?.comment || 0) / ((report.stats?.FCM || 0) + (report.stats?.Slack || 0) + (report.stats?.Kakao || 0) + (report.stats?.message || 0) + (report.stats?.comment || 0) + (report.stats?.market || 0) + (report.stats?.system || 0))) * 100)}%</td></tr>
          <tr><td>마켓</td><td>${report.stats?.market || 0}</td><td>${Math.round(((report.stats?.market || 0) / ((report.stats?.FCM || 0) + (report.stats?.Slack || 0) + (report.stats?.Kakao || 0) + (report.stats?.message || 0) + (report.stats?.comment || 0) + (report.stats?.market || 0) + (report.stats?.system || 0))) * 100)}%</td></tr>
          <tr><td>?�스??/td><td>${report.stats?.system || 0}</td><td>${Math.round(((report.stats?.system || 0) / ((report.stats?.FCM || 0) + (report.stats?.Slack || 0) + (report.stats?.Kakao || 0) + (report.stats?.message || 0) + (report.stats?.comment || 0) + (report.stats?.market || 0) + (report.stats?.system || 0))) * 100)}%</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>?�� AI 분석 ?�약</h2>
      <div class="summary-box">
        ${report.summary ? report.summary.replace(/\n/g, '<br>') : 'AI ?�약 ?�이?��? ?�습?�다.'}
      </div>
    </div>

    <div class="footer">
      <p>??<strong>YAGO VIBE AI ?�동 리포???�스??/strong></p>
      <p>?�성?�시: ${new Date().toLocaleString('ko-KR')}</p>
      <p>�?리포?�는 n8n + OpenAI + Firebase�??�해 ?�동?�로 ?�성?�었?�니??</p>
    </div>
  </div>
</body>
</html>`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">AI 리포?��? 불러?�는 �?..</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 text-center">
        <div className="text-6xl mb-4">?��</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">AI ?�동 리포??/h1>
        <p className="text-gray-600 mb-6">로그?�이 ?�요?�니??/p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          ?�으�??�아가�?        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-7xl mx-auto py-8 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ?�더 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">?�� AI ?�동 리포??/h1>
        <p className="text-gray-500 text-lg">YAGO VIBE ?�루 ?�림 ?�계 & AI ?�약 분석</p>
      </div>

      {/* ?�계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">�??�림 ??/p>
              <p className="text-3xl font-bold text-blue-600">{totalNotifications.toLocaleString()}</p>
            </div>
            <div className="text-4xl">?��</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">?�평�??�림</p>
              <p className="text-3xl font-bold text-green-600">{avgDaily}</p>
            </div>
            <div className="text-4xl">?��</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">리포??기간</p>
              <p className="text-3xl font-bold text-purple-600">{reports.length}??/p>
            </div>
            <div className="text-4xl">?��</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">최신 리포??/p>
              <p className="text-lg font-bold text-orange-600">
                {latest ? formatDate(latest.date) : "?�음"}
              </p>
            </div>
            <div className="text-4xl">?��</div>
          </div>
        </motion.div>
      </div>

      {/* 차트 ?�션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* ?�림 추이 ?�인 차트 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <h2 className="text-xl font-semibold mb-6 text-gray-800">?�� 채널�??�림 추이</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line type="monotone" dataKey="FCM" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Slack" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Kakao" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Message" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* ?�별 �??�림 �?차트 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <h2 className="text-xl font-semibold mb-6 text-gray-800">?�� ?�별 �??�림??/h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="Total" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* AI ?�약 ?�션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">?�� AI ?�일 ?�약</h2>
          {latest && (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {latest.date}
            </span>
          )}
        </div>
        
        {latest && latest.summary ? (
          <>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100 mb-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                {latest.summary}
              </p>
            </div>
            
            {/* PDF ?�운로드 버튼 */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={async () => {
                  try {
                    await generateReportPDF(latest);
                    alert("??브랜??PDF가 ?�성?�었?�니??");
                  } catch (error) {
                    console.error("PDF ?�성 ?�패:", error);
                    alert("??PDF ?�성???�패?�습?�다.");
                  }
                }}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                ?�� 브랜??PDF ?�운로드
              </button>
              
              <button
                onClick={async () => {
                  try {
                    await generateInvestorReportPDF(latest);
                    alert("???�자?�용 ?�리미엄 PDF가 ?�성?�었?�니??");
                  } catch (error) {
                    console.error("?�자?�용 PDF ?�성 ?�패:", error);
                    alert("???�자?�용 PDF ?�성???�패?�습?�다.");
                  }
                }}
                className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                ?�� ?�자?�용 PDF ?�운로드
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">?��</div>
            <p className="text-gray-400 text-lg">AI ?�약 ?�이?��? ?�습?�다</p>
            <p className="text-gray-400 text-sm mt-2">
              n8n ?�크?�로?��? ?�행?�면 AI ?�약???�동?�로 ?�성?�니??            </p>
          </div>
        )}
      </motion.div>

      {/* 최근 리포??목록 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
      >
        <h2 className="text-xl font-semibold mb-6 text-gray-800">?�� 최근 리포??목록</h2>
        
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">?��</div>
            <p className="text-gray-400 text-lg">리포???�이?��? ?�습?�다</p>
            <p className="text-gray-400 text-sm mt-2">
              n8n ?�크?�로?��? ?�행?�면 리포?��? ?�동?�로 ?�성?�니??            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {reports.slice(0, 10).map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border rounded-xl p-4 flex justify-between items-center hover:shadow-md transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-800">{report.date}</h3>
                    {index === 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">최신</span>}
                  </div>
                  {report.summary && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {report.summary.substring(0, 100)}...
                    </p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>FCM: {report.stats?.FCM || 0}</span>
                    <span>Slack: {report.stats?.Slack || 0}</span>
                    <span>Kakao: {report.stats?.Kakao || 0}</span>
                    <span>총계: {((report.stats?.FCM || 0) + (report.stats?.Slack || 0) + (report.stats?.Kakao || 0))}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadPDF(report.date)}
                    disabled={downloading === report.date}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                    title="?�반 PDF 리포???�운로드"
                  >
                    {downloading === report.date ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ?�성�?..
                      </>
                    ) : (
                      <>
                        ?�� PDF
                      </>
                    )}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await generateReportPDF(report);
                        alert("??브랜??PDF가 ?�성?�었?�니??");
                      } catch (error) {
                        console.error("PDF ?�성 ?�패:", error);
                        alert("??PDF ?�성???�패?�습?�다.");
                      }
                    }}
                    className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                    title="브랜??PDF 리포???�운로드 (jsPDF)"
                  >
                    ?�� 브랜??PDF
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await generateInvestorReportPDF(report);
                        alert("???�자?�용 ?�리미엄 PDF가 ?�성?�었?�니??");
                      } catch (error) {
                        console.error("?�자?�용 PDF ?�성 ?�패:", error);
                        alert("???�자?�용 PDF ?�성???�패?�습?�다.");
                      }
                    }}
                    className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                    title="?�자?�용 ?�리미엄 PDF 리포???�운로드"
                  >
                    ?�� ?�자?�용
                  </button>
                  <div className="text-2xl">?��</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ?�터 */}
      <div className="text-center mt-8 text-gray-400 text-sm">
        <p>?�� AI 리포?�는 n8n ?�크?�로?�에 ?�해 매일 ?�동?�로 ?�성?�니??/p>
        <p className="mt-1">
          <a href="/notification-test" className="text-blue-600 hover:underline">
            ?�림 ?�스??          </a> | 
          <a href="/notifications" className="text-blue-600 hover:underline ml-2">
            ?�림 ?�?�보??          </a>
        </p>
      </div>
    </motion.div>
  );
}
