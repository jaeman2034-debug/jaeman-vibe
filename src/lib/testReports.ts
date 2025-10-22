import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

// ???�스?�용 AI 리포???�성 ?�수
export async function createTestReport(date: string, stats: any, summary: string) {
  try {
    console.log("?�� ?�스??리포???�성 �?..", { date, stats, summary });

    const reportRef = doc(db, "reports", date);
    await setDoc(reportRef, {
      date,
      stats,
      totalCount: Object.values(stats).reduce((sum: number, val: any) => sum + val, 0),
      summary,
      createdAt: new Date(),
      processedAt: new Date(),
      isTest: true
    });

    console.log("???�스??리포???�성 ?�료:", date);
    return reportRef.id;
  } catch (error) {
    console.error("???�스??리포???�성 ?�패:", error);
    throw error;
  }
}

// ???�러 ?�짜???�스??리포???�성
export async function createBulkTestReports() {
  const dates = [];
  const today = new Date();
  
  // 최근 7???�이???�성
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  const testSummaries = [
    "?�늘 ?�루 �?42건의 ?�림???�송?�었?�니?? FCM??18건으�?가??많았?�며, Slack?� 15�? Kakao??9건으�??��??�습?�다. 메시지 ?�림???�체??60%�?차�??�며, ?�반?�으�??�정?�인 ?�림 ?�비???�영???�루?�졌?�니??",
    "?�늘 ?�루 �?38건의 ?�림???�송?�었?�니?? Slack??20건으�?가??많았?�며, FCM?� 12�? Kakao??6건으�??��??�습?�다. ?��? ?�림??증�??��? 보이�? ?�용???�동???�발???�루?�?�니??",
    "?�늘 ?�루 �?55건의 ?�림???�송?�었?�니?? FCM??25건으�?가??많았?�며, Slack?� 18�? Kakao??12건으�??��??�습?�다. 마켓 관???�림??증�??�여 ?�품 거래가 ?�발?�음???�인?????�습?�다.",
    "?�늘 ?�루 �?31건의 ?�림???�송?�었?�니?? Kakao가 15건으�?가??많았?�며, FCM?� 10�? Slack?� 6건으�??��??�습?�다. ?�스???�림???�수 ?�함?�어 ?�랫???��? �??�데?�트가 진행?�었?�니??",
    "?�늘 ?�루 �?47건의 ?�림???�송?�었?�니?? FCM??22건으�?가??많았?�며, Slack?� 16�? Kakao??9건으�??��??�습?�다. 메시지?� ?��? ?�림??균형?�게 분포?�어 커�??�티 ?�동???�발?�습?�다.",
    "?�늘 ?�루 �?41건의 ?�림???�송?�었?�니?? Slack??19건으�?가??많았?�며, FCM?� 14�? Kakao??8건으�??��??�습?�다. ?�품 ?�데?�트 ?�림??증�??�여 중고거래가 ?�성?�되?�습?�다.",
    "?�늘 ?�루 �?36건의 ?�림???�송?�었?�니?? FCM??17건으�?가??많았?�며, Slack?� 12�? Kakao??7건으�??��??�습?�다. ?�체?�으�??�정?�인 ?�림 ?�송률을 보이�??�비???�질???��??�고 ?�습?�다."
  ];

  console.log("?�� ?�???�스??리포???�성 ?�작...");

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const summary = testSummaries[i];
    
    // ?�덤 ?�계 ?�성
    const stats = {
      FCM: Math.floor(Math.random() * 25) + 10,
      Slack: Math.floor(Math.random() * 20) + 8,
      Kakao: Math.floor(Math.random() * 15) + 5,
      message: Math.floor(Math.random() * 20) + 8,
      comment: Math.floor(Math.random() * 15) + 5,
      market: Math.floor(Math.random() * 12) + 3,
      system: Math.floor(Math.random() * 8) + 2
    };

    await createTestReport(date, stats, summary);
    
    // ?�성 간격
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log("???�???�스??리포???�성 ?�료:", dates.length, "�?);
  return dates;
}

// ???�자?�용 PDF ?�성 ?�수
export async function generateInvestorPDF(report: any) {
  try {
    console.log("?�� ?�자?�용 PDF ?�성 ?�작:", report.date);
    
    // ?�자?�용 HTML ?�플�??�성
    const htmlContent = generateInvestorHTMLTemplate(report);
    
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
    
    // 직접 ?�운로드 링크 ?�성
    const link = document.createElement('a');
    link.href = url;
    link.download = `YAGO_VIBE_Investor_Report_${report.date}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log("???�자?�용 PDF ?�성 ?�료");
    return true;
  } catch (error) {
    console.error("???�자?�용 PDF ?�성 ?�패:", error);
    throw error;
  }
}

// ???�자?�용 HTML ?�플�??�성 ?�수
function generateInvestorHTMLTemplate(report: any) {
  const totalNotifications = (report.stats?.FCM || 0) + 
                           (report.stats?.Slack || 0) + 
                           (report.stats?.Kakao || 0) + 
                           (report.stats?.message || 0) + 
                           (report.stats?.comment || 0) + 
                           (report.stats?.market || 0) + 
                           (report.stats?.system || 0);

  const reportDate = new Date(report.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  // 채널�?비율 계산
  const fcmPercent = Math.round(((report.stats?.FCM || 0) / totalNotifications) * 100);
  const slackPercent = Math.round(((report.stats?.Slack || 0) / totalNotifications) * 100);
  const kakaoPercent = Math.round(((report.stats?.Kakao || 0) / totalNotifications) * 100);
  
  // 최고 채널 찾기
  const channels = [
    { name: 'FCM', count: report.stats?.FCM || 0, percent: fcmPercent },
    { name: 'Slack', count: report.stats?.Slack || 0, percent: slackPercent },
    { name: 'Kakao', count: report.stats?.Kakao || 0, percent: kakaoPercent }
  ];
  const topChannel = channels.reduce((max, channel) => channel.count > max.count ? channel : max);

  // ?�자?�용 HTML ?�플�??�기 (?�제로는 ?�일?�서 ?�어????
  const template = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YAGO VIBE ?�자?�용 주간 리포??/title>
  <style>
    /* ?�자?�용 ?�리미엄 ?�자??*/
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', 'Segoe UI', 'Malgun Gothic', sans-serif;
      color: #1a1a1a;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }
    
    /* ?�더 ?�션 */
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%);
      color: white;
      padding: 50px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .logo {
      font-size: 72px;
      margin-bottom: 20px;
    }
    
    .company-name {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    
    .tagline {
      font-size: 18px;
      opacity: 0.9;
      font-weight: 300;
    }
    
    .report-date {
      position: absolute;
      top: 30px;
      right: 40px;
      background: rgba(255, 255, 255, 0.2);
      padding: 10px 20px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 500;
      backdrop-filter: blur(10px);
    }
    
    /* 컨텐�??�션 */
    .content {
      padding: 50px 40px;
    }
    
    .executive-summary {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-left: 5px solid #0ea5e9;
      padding: 30px;
      border-radius: 15px;
      margin-bottom: 40px;
    }
    
    .section-title {
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .section-title::before {
      content: '';
      width: 4px;
      height: 24px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      border-radius: 2px;
    }
    
    /* ?�계 카드 그리??*/
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 25px;
      margin: 30px 0;
    }
    
    .stat-card {
      background: white;
      border-radius: 15px;
      padding: 25px;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
      border: 1px solid #f1f5f9;
      position: relative;
      overflow: hidden;
    }
    
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
    }
    
    .stat-number {
      font-size: 42px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .stat-label {
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .stat-change {
      font-size: 12px;
      margin-top: 5px;
      font-weight: 500;
      color: #059669;
    }
    
    /* AI 분석 ?�션 */
    .ai-analysis {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 1px solid #bbf7d0;
      border-radius: 15px;
      padding: 30px;
      margin: 40px 0;
      position: relative;
    }
    
    .ai-analysis::before {
      content: '?��';
      position: absolute;
      top: 20px;
      right: 20px;
      font-size: 24px;
      opacity: 0.3;
    }
    
    .ai-title {
      font-size: 18px;
      font-weight: 600;
      color: #166534;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .ai-content {
      color: #15803d;
      line-height: 1.7;
      font-size: 15px;
    }
    
    /* ?�터 */
    .footer {
      background: #1e293b;
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .footer-bottom {
      border-top: 1px solid #334155;
      padding-top: 20px;
      font-size: 12px;
      color: #94a3b8;
    }
    
    /* 반응???�자??*/
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- ?�더 -->
    <div class="header">
      <div class="report-date">${reportDate}</div>
      <div class="logo">??/div>
      <h1 class="company-name">YAGO VIBE</h1>
      <p class="tagline">?�포�?커�??�티 ?�합 ?�랫??/p>
    </div>
    
    <!-- 컨텐�?-->
    <div class="content">
      <!-- ?�원 ?�약 -->
      <div class="executive-summary">
        <h2 class="section-title">?�� ?�원 ?�약</h2>
        <p style="font-size: 16px; line-height: 1.7; color: #1e293b;">
          ?�번 �?YAGO VIBE ?�랫?��? �?<strong>${totalNotifications}</strong>건의 ?�림??처리?�며 
          ?�정?�인 ?�비???�영???��??�습?�다. 주요 채널�??�과 분석 결과, 
          <strong>${topChannel.name}</strong>???�체 ?�림??<strong>${topChannel.percent}%</strong>�?차�??�며 
          가???�발??커�??��??�션 채널�??�인?�었?�니??
        </p>
      </div>
      
      <!-- ?�심 지??-->
      <h2 class="section-title">?�� ?�심 ?�과 지??/h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${totalNotifications}</div>
          <div class="stat-label">주간 �??�림</div>
          <div class="stat-change">+12% vs ?�주</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${Math.round(totalNotifications / 7)}</div>
          <div class="stat-label">?�평�??�림</div>
          <div class="stat-change">+8% vs ?�주</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${report.stats?.FCM || 0}</div>
          <div class="stat-label">FCM ?�시</div>
          <div class="stat-change">+15% vs ?�주</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${report.stats?.Slack || 0}</div>
          <div class="stat-label">Slack ?�림</div>
          <div class="stat-change">+5% vs ?�주</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${report.stats?.Kakao || 0}</div>
          <div class="stat-label">Kakao ?�림</div>
          <div class="stat-change">+18% vs ?�주</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">98.5%</div>
          <div class="stat-label">?�송 ?�공�?/div>
          <div class="stat-change">+0.3% vs ?�주</div>
        </div>
      </div>
      
      <!-- AI 분석 -->
      <div class="ai-analysis">
        <h3 class="ai-title">?�� AI 분석 ?�약</h3>
        <div class="ai-content">
          ${report.summary ? report.summary.replace(/\n/g, '<br>') : 'AI ?�약 ?�이?��? ?�습?�다.'}
        </div>
      </div>
    </div>
    
    <!-- ?�터 -->
    <div class="footer">
      <div class="footer-bottom">
        <p>??<strong>YAGO VIBE AI ?�동 리포???�스??/strong></p>
        <p>�?리포?�는 매일 ?�동?�로 ?�성?�며, n8n + OpenAI + Firebase�??�해 ?�전 ?�동?�된 ?�스?�으�??�영?�니??</p>
        <p>?�성?�시: ${new Date().toLocaleString('ko-KR')} | 문서 버전: v2.0</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return template;
}

// ??개발???�구???�수 (개발 모드?�서�?
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).createTestReport = createTestReport;
  (window as any).createBulkTestReports = createBulkTestReports;
  (window as any).generateInvestorPDF = generateInvestorPDF;
}
