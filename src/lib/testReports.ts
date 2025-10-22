import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

// ???ŒìŠ¤?¸ìš© AI ë¦¬í¬???ì„± ?¨ìˆ˜
export async function createTestReport(date: string, stats: any, summary: string) {
  try {
    console.log("?“ ?ŒìŠ¤??ë¦¬í¬???ì„± ì¤?..", { date, stats, summary });

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

    console.log("???ŒìŠ¤??ë¦¬í¬???ì„± ?„ë£Œ:", date);
    return reportRef.id;
  } catch (error) {
    console.error("???ŒìŠ¤??ë¦¬í¬???ì„± ?¤íŒ¨:", error);
    throw error;
  }
}

// ???¬ëŸ¬ ? ì§œ???ŒìŠ¤??ë¦¬í¬???ì„±
export async function createBulkTestReports() {
  const dates = [];
  const today = new Date();
  
  // ìµœê·¼ 7???°ì´???ì„±
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  const testSummaries = [
    "?¤ëŠ˜ ?˜ë£¨ ì´?42ê±´ì˜ ?Œë¦¼???„ì†¡?˜ì—ˆ?µë‹ˆ?? FCM??18ê±´ìœ¼ë¡?ê°€??ë§ì•˜?¼ë©°, Slack?€ 15ê±? Kakao??9ê±´ìœ¼ë¡??˜í??¬ìŠµ?ˆë‹¤. ë©”ì‹œì§€ ?Œë¦¼???„ì²´??60%ë¥?ì°¨ì??˜ë©°, ?„ë°˜?ìœ¼ë¡??ˆì •?ì¸ ?Œë¦¼ ?œë¹„???´ì˜???´ë£¨?´ì¡Œ?µë‹ˆ??",
    "?¤ëŠ˜ ?˜ë£¨ ì´?38ê±´ì˜ ?Œë¦¼???„ì†¡?˜ì—ˆ?µë‹ˆ?? Slack??20ê±´ìœ¼ë¡?ê°€??ë§ì•˜?¼ë©°, FCM?€ 12ê±? Kakao??6ê±´ìœ¼ë¡??˜í??¬ìŠµ?ˆë‹¤. ?“ê? ?Œë¦¼??ì¦ê??¸ë? ë³´ì´ë©? ?¬ìš©???œë™???œë°œ???˜ë£¨?€?µë‹ˆ??",
    "?¤ëŠ˜ ?˜ë£¨ ì´?55ê±´ì˜ ?Œë¦¼???„ì†¡?˜ì—ˆ?µë‹ˆ?? FCM??25ê±´ìœ¼ë¡?ê°€??ë§ì•˜?¼ë©°, Slack?€ 18ê±? Kakao??12ê±´ìœ¼ë¡??˜í??¬ìŠµ?ˆë‹¤. ë§ˆì¼“ ê´€???Œë¦¼??ì¦ê??˜ì—¬ ?í’ˆ ê±°ë˜ê°€ ?œë°œ?ˆìŒ???•ì¸?????ˆìŠµ?ˆë‹¤.",
    "?¤ëŠ˜ ?˜ë£¨ ì´?31ê±´ì˜ ?Œë¦¼???„ì†¡?˜ì—ˆ?µë‹ˆ?? Kakaoê°€ 15ê±´ìœ¼ë¡?ê°€??ë§ì•˜?¼ë©°, FCM?€ 10ê±? Slack?€ 6ê±´ìœ¼ë¡??˜í??¬ìŠµ?ˆë‹¤. ?œìŠ¤???Œë¦¼???¤ìˆ˜ ?¬í•¨?˜ì–´ ?Œë«???ê? ë°??…ë°?´íŠ¸ê°€ ì§„í–‰?˜ì—ˆ?µë‹ˆ??",
    "?¤ëŠ˜ ?˜ë£¨ ì´?47ê±´ì˜ ?Œë¦¼???„ì†¡?˜ì—ˆ?µë‹ˆ?? FCM??22ê±´ìœ¼ë¡?ê°€??ë§ì•˜?¼ë©°, Slack?€ 16ê±? Kakao??9ê±´ìœ¼ë¡??˜í??¬ìŠµ?ˆë‹¤. ë©”ì‹œì§€?€ ?“ê? ?Œë¦¼??ê· í˜•?ˆê²Œ ë¶„í¬?˜ì–´ ì»¤ë??ˆí‹° ?œë™???œë°œ?ˆìŠµ?ˆë‹¤.",
    "?¤ëŠ˜ ?˜ë£¨ ì´?41ê±´ì˜ ?Œë¦¼???„ì†¡?˜ì—ˆ?µë‹ˆ?? Slack??19ê±´ìœ¼ë¡?ê°€??ë§ì•˜?¼ë©°, FCM?€ 14ê±? Kakao??8ê±´ìœ¼ë¡??˜í??¬ìŠµ?ˆë‹¤. ?í’ˆ ?…ë°?´íŠ¸ ?Œë¦¼??ì¦ê??˜ì—¬ ì¤‘ê³ ê±°ë˜ê°€ ?œì„±?”ë˜?ˆìŠµ?ˆë‹¤.",
    "?¤ëŠ˜ ?˜ë£¨ ì´?36ê±´ì˜ ?Œë¦¼???„ì†¡?˜ì—ˆ?µë‹ˆ?? FCM??17ê±´ìœ¼ë¡?ê°€??ë§ì•˜?¼ë©°, Slack?€ 12ê±? Kakao??7ê±´ìœ¼ë¡??˜í??¬ìŠµ?ˆë‹¤. ?„ì²´?ìœ¼ë¡??ˆì •?ì¸ ?Œë¦¼ ?„ì†¡ë¥ ì„ ë³´ì´ë©??œë¹„???ˆì§ˆ??? ì??˜ê³  ?ˆìŠµ?ˆë‹¤."
  ];

  console.log("?“Š ?€???ŒìŠ¤??ë¦¬í¬???ì„± ?œì‘...");

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const summary = testSummaries[i];
    
    // ?œë¤ ?µê³„ ?ì„±
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
    
    // ?ì„± ê°„ê²©
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log("???€???ŒìŠ¤??ë¦¬í¬???ì„± ?„ë£Œ:", dates.length, "ê°?);
  return dates;
}

// ???¬ì?ìš© PDF ?ì„± ?¨ìˆ˜
export async function generateInvestorPDF(report: any) {
  try {
    console.log("?“„ ?¬ì?ìš© PDF ?ì„± ?œì‘:", report.date);
    
    // ?¬ì?ìš© HTML ?œí”Œë¦??ì„±
    const htmlContent = generateInvestorHTMLTemplate(report);
    
    // HTML??PDFë¡?ë³€?˜í•˜???¤ìš´ë¡œë“œ
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // ??ì°½ì—???´ê¸° (ë¸Œë¼?°ì????¸ì‡„ ê¸°ëŠ¥ ?¬ìš©)
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    // ì§ì ‘ ?¤ìš´ë¡œë“œ ë§í¬ ?ì„±
    const link = document.createElement('a');
    link.href = url;
    link.download = `YAGO_VIBE_Investor_Report_${report.date}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log("???¬ì?ìš© PDF ?ì„± ?„ë£Œ");
    return true;
  } catch (error) {
    console.error("???¬ì?ìš© PDF ?ì„± ?¤íŒ¨:", error);
    throw error;
  }
}

// ???¬ì?ìš© HTML ?œí”Œë¦??ì„± ?¨ìˆ˜
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

  // ì±„ë„ë³?ë¹„ìœ¨ ê³„ì‚°
  const fcmPercent = Math.round(((report.stats?.FCM || 0) / totalNotifications) * 100);
  const slackPercent = Math.round(((report.stats?.Slack || 0) / totalNotifications) * 100);
  const kakaoPercent = Math.round(((report.stats?.Kakao || 0) / totalNotifications) * 100);
  
  // ìµœê³  ì±„ë„ ì°¾ê¸°
  const channels = [
    { name: 'FCM', count: report.stats?.FCM || 0, percent: fcmPercent },
    { name: 'Slack', count: report.stats?.Slack || 0, percent: slackPercent },
    { name: 'Kakao', count: report.stats?.Kakao || 0, percent: kakaoPercent }
  ];
  const topChannel = channels.reduce((max, channel) => channel.count > max.count ? channel : max);

  // ?¬ì?ìš© HTML ?œí”Œë¦??½ê¸° (?¤ì œë¡œëŠ” ?Œì¼?ì„œ ?½ì–´????
  const template = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YAGO VIBE ?¬ì?ìš© ì£¼ê°„ ë¦¬í¬??/title>
  <style>
    /* ?¬ì?ìš© ?„ë¦¬ë¯¸ì—„ ?”ì??*/
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
    
    /* ?¤ë” ?¹ì…˜ */
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
    
    /* ì»¨í…ì¸??¹ì…˜ */
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
    
    /* ?µê³„ ì¹´ë“œ ê·¸ë¦¬??*/
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
    
    /* AI ë¶„ì„ ?¹ì…˜ */
    .ai-analysis {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 1px solid #bbf7d0;
      border-radius: 15px;
      padding: 30px;
      margin: 40px 0;
      position: relative;
    }
    
    .ai-analysis::before {
      content: '?¤–';
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
    
    /* ?¸í„° */
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
    
    /* ë°˜ì‘???”ì??*/
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- ?¤ë” -->
    <div class="header">
      <div class="report-date">${reportDate}</div>
      <div class="logo">??/div>
      <h1 class="company-name">YAGO VIBE</h1>
      <p class="tagline">?¤í¬ì¸?ì»¤ë??ˆí‹° ?µí•© ?Œë«??/p>
    </div>
    
    <!-- ì»¨í…ì¸?-->
    <div class="content">
      <!-- ?„ì› ?”ì•½ -->
      <div class="executive-summary">
        <h2 class="section-title">?“Š ?„ì› ?”ì•½</h2>
        <p style="font-size: 16px; line-height: 1.7; color: #1e293b;">
          ?´ë²ˆ ì£?YAGO VIBE ?Œë«?¼ì? ì´?<strong>${totalNotifications}</strong>ê±´ì˜ ?Œë¦¼??ì²˜ë¦¬?˜ë©° 
          ?ˆì •?ì¸ ?œë¹„???´ì˜??? ì??ˆìŠµ?ˆë‹¤. ì£¼ìš” ì±„ë„ë³??±ê³¼ ë¶„ì„ ê²°ê³¼, 
          <strong>${topChannel.name}</strong>???„ì²´ ?Œë¦¼??<strong>${topChannel.percent}%</strong>ë¥?ì°¨ì??˜ë©° 
          ê°€???œë°œ??ì»¤ë??ˆì??´ì…˜ ì±„ë„ë¡??•ì¸?˜ì—ˆ?µë‹ˆ??
        </p>
      </div>
      
      <!-- ?µì‹¬ ì§€??-->
      <h2 class="section-title">?“ˆ ?µì‹¬ ?±ê³¼ ì§€??/h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${totalNotifications}</div>
          <div class="stat-label">ì£¼ê°„ ì´??Œë¦¼</div>
          <div class="stat-change">+12% vs ?„ì£¼</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${Math.round(totalNotifications / 7)}</div>
          <div class="stat-label">?¼í‰ê·??Œë¦¼</div>
          <div class="stat-change">+8% vs ?„ì£¼</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${report.stats?.FCM || 0}</div>
          <div class="stat-label">FCM ?¸ì‹œ</div>
          <div class="stat-change">+15% vs ?„ì£¼</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${report.stats?.Slack || 0}</div>
          <div class="stat-label">Slack ?Œë¦¼</div>
          <div class="stat-change">+5% vs ?„ì£¼</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${report.stats?.Kakao || 0}</div>
          <div class="stat-label">Kakao ?Œë¦¼</div>
          <div class="stat-change">+18% vs ?„ì£¼</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">98.5%</div>
          <div class="stat-label">?„ì†¡ ?±ê³µë¥?/div>
          <div class="stat-change">+0.3% vs ?„ì£¼</div>
        </div>
      </div>
      
      <!-- AI ë¶„ì„ -->
      <div class="ai-analysis">
        <h3 class="ai-title">?¤– AI ë¶„ì„ ?”ì•½</h3>
        <div class="ai-content">
          ${report.summary ? report.summary.replace(/\n/g, '<br>') : 'AI ?”ì•½ ?°ì´?°ê? ?†ìŠµ?ˆë‹¤.'}
        </div>
      </div>
    </div>
    
    <!-- ?¸í„° -->
    <div class="footer">
      <div class="footer-bottom">
        <p>??<strong>YAGO VIBE AI ?ë™ ë¦¬í¬???œìŠ¤??/strong></p>
        <p>ë³?ë¦¬í¬?¸ëŠ” ë§¤ì¼ ?ë™?¼ë¡œ ?ì„±?˜ë©°, n8n + OpenAI + Firebaseë¥??µí•´ ?„ì „ ?ë™?”ëœ ?œìŠ¤?œìœ¼ë¡??´ì˜?©ë‹ˆ??</p>
        <p>?ì„±?¼ì‹œ: ${new Date().toLocaleString('ko-KR')} | ë¬¸ì„œ ë²„ì „: v2.0</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return template;
}

// ??ê°œë°œ???„êµ¬???¨ìˆ˜ (ê°œë°œ ëª¨ë“œ?ì„œë§?
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).createTestReport = createTestReport;
  (window as any).createBulkTestReports = createBulkTestReports;
  (window as any).generateInvestorPDF = generateInvestorPDF;
}
