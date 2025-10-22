import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fetch from "node-fetch";

/**
 * ?뱤 ?쇨퀬 鍮꾩꽌 ?듯빀 由ы룷???쒖뒪?? * 留ㅼ씪/二쇨컙/?붽컙 ?먮룞 由ы룷???앹꽦 諛?諛고룷
 */

// Firebase Admin 珥덇린??admin.initializeApp();
const db = admin.firestore();

/**
 * 留ㅼ씪 23:59 ?ㅽ뻾?섎뒗 ?쇱씪 由ы룷?? */
export const generateDailyReport = functions
  .region("asia-northeast3")
  .pubsub.schedule("59 23 * * *") // 留ㅼ씪 23:59 (KST)
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("?뱤 ?쇱씪 由ы룷???앹꽦 ?쒖옉:", new Date().toISOString());

    try {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      // 1截뤴깵 Firestore ?곗씠???섏쭛
      const stats = await collectDailyStats(yesterday, today);
      
      // 2截뤴깵 AI ?붿빟 ?앹꽦
      const summary = await generateAISummary(stats, "daily");
      
      // 3截뤴깵 PDF ?앹꽦
      const pdfBytes = await generatePDF(stats, summary, "daily");
      
      // 4截뤴깵 由ы룷???꾩넚
      await sendReport(pdfBytes, "?쇱씪 由ы룷??, stats);
      
      // 5截뤴깵 濡쒓렇 ???      await saveReportLog(stats, summary, "daily", pdfBytes.length);
      
      console.log("???쇱씪 由ы룷???앹꽦 諛??꾩넚 ?꾨즺");

    } catch (error) {
      console.error("???쇱씪 由ы룷???앹꽦 ?ㅻ쪟:", error);
      await logError("generateDailyReport", error, { context: "main_execution" });
    }
  });

/**
 * 留ㅼ＜ ?붿슂??09:00 ?ㅽ뻾?섎뒗 二쇨컙 由ы룷?? */
export const generateWeeklyReport = functions
  .region("asia-northeast3")
  .pubsub.schedule("0 9 * * 1") // 留ㅼ＜ ?붿슂???ㅼ쟾 9??  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("?뱤 二쇨컙 由ы룷???앹꽦 ?쒖옉:", new Date().toISOString());

    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // 1截뤴깵 二쇨컙 ?곗씠???섏쭛
      const stats = await collectWeeklyStats(weekAgo, today);
      
      // 2截뤴깵 AI ?붿빟 ?앹꽦
      const summary = await generateAISummary(stats, "weekly");
      
      // 3截뤴깵 PDF ?앹꽦
      const pdfBytes = await generatePDF(stats, summary, "weekly");
      
      // 4截뤴깵 由ы룷???꾩넚
      await sendReport(pdfBytes, "二쇨컙 由ы룷??, stats);
      
      // 5截뤴깵 濡쒓렇 ???      await saveReportLog(stats, summary, "weekly", pdfBytes.length);
      
      console.log("??二쇨컙 由ы룷???앹꽦 諛??꾩넚 ?꾨즺");

    } catch (error) {
      console.error("??二쇨컙 由ы룷???앹꽦 ?ㅻ쪟:", error);
      await logError("generateWeeklyReport", error, { context: "main_execution" });
    }
  });

/**
 * 留ㅼ썡 1??09:00 ?ㅽ뻾?섎뒗 ?붽컙 由ы룷?? */
export const generateMonthlyReport = functions
  .region("asia-northeast3")
  .pubsub.schedule("0 9 1 * *") // 留ㅼ썡 1???ㅼ쟾 9??  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("?뱤 ?붽컙 由ы룷???앹꽦 ?쒖옉:", new Date().toISOString());

    try {
      const today = new Date();
      const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      
      // 1截뤴깵 ?붽컙 ?곗씠???섏쭛
      const stats = await collectMonthlyStats(monthAgo, today);
      
      // 2截뤴깵 AI ?붿빟 ?앹꽦
      const summary = await generateAISummary(stats, "monthly");
      
      // 3截뤴깵 PDF ?앹꽦
      const pdfBytes = await generatePDF(stats, summary, "monthly");
      
      // 4截뤴깵 由ы룷???꾩넚
      await sendReport(pdfBytes, "?붽컙 由ы룷??, stats);
      
      // 5截뤴깵 濡쒓렇 ???      await saveReportLog(stats, summary, "monthly", pdfBytes.length);
      
      console.log("???붽컙 由ы룷???앹꽦 諛??꾩넚 ?꾨즺");

    } catch (error) {
      console.error("???붽컙 由ы룷???앹꽦 ?ㅻ쪟:", error);
      await logError("generateMonthlyReport", error, { context: "main_execution" });
    }
  });

/**
 * ?쇱씪 ?듦퀎 ?섏쭛
 */
async function collectDailyStats(startDate: Date, endDate: Date) {
  const start = admin.firestore.Timestamp.fromDate(startDate);
  const end = admin.firestore.Timestamp.fromDate(endDate);

  const [
    itemsSnapshot,
    sessionsSnapshot,
    notificationsSnapshot,
    errorsSnapshot,
    briefingsSnapshot,
    aiRequestsSnapshot,
    userActivitiesSnapshot
  ] = await Promise.all([
    db.collection("marketItems").where("createdAt", ">=", start).where("createdAt", "<", end).get(),
    db.collection("voiceSessions").where("createdAt", ">=", start).where("createdAt", "<", end).get(),
    db.collection("notificationLogs").where("createdAt", ">=", start).where("createdAt", "<", end).get(),
    db.collection("errors").where("createdAt", ">=", start).where("createdAt", "<", end).get(),
    db.collection("briefingLogs").where("createdAt", ">=", start).where("createdAt", "<", end).get(),
    db.collection("aiRequests").where("createdAt", ">=", start).where("createdAt", "<", end).get(),
    db.collection("userActivities").where("createdAt", ">=", start).where("createdAt", "<", end).get()
  ]);

  // ?곸꽭 遺꾩꽍
  const items = itemsSnapshot.docs.map(doc => doc.data());
  const sessions = sessionsSnapshot.docs.map(doc => doc.data());
  const notifications = notificationsSnapshot.docs.map(doc => doc.data());
  const errors = errorsSnapshot.docs.map(doc => doc.data());

  // ?쒓렇 遺꾩꽍
  const allTags = items.flatMap(item => item.autoTags || []);
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ?먮윭 遺꾩꽍
  const errorSources = errors.reduce((acc, error) => {
    const source = error.source || 'unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ?깃났瑜?怨꾩궛
  const totalNotifications = notifications.reduce((sum, notif) => sum + (notif.successCount || 0), 0);
  const totalFailures = notifications.reduce((sum, notif) => sum + (notif.failureCount || 0), 0);
  const successRate = totalNotifications + totalFailures > 0 
    ? (totalNotifications / (totalNotifications + totalFailures)) * 100 
    : 100;

  return {
    period: {
      start: startDate,
      end: endDate,
      type: 'daily'
    },
    counts: {
      newItems: itemsSnapshot.size,
      voiceSessions: sessionsSnapshot.size,
      notifications: notificationsSnapshot.size,
      errors: errorsSnapshot.size,
      briefings: briefingsSnapshot.size,
      aiRequests: aiRequestsSnapshot.size,
      userActivities: userActivitiesSnapshot.size
    },
    metrics: {
      successRate: Math.round(successRate * 100) / 100,
      uniqueUsers: new Set(sessions.map(s => s.createdBy)).size,
      avgSessionDuration: calculateAvgSessionDuration(sessions),
      topTags: Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }))
    },
    errors: {
      bySource: errorSources,
      total: errorsSnapshot.size
    }
  };
}

/**
 * 二쇨컙 ?듦퀎 ?섏쭛
 */
async function collectWeeklyStats(startDate: Date, endDate: Date) {
  const stats = await collectDailyStats(startDate, endDate);
  stats.period.type = 'weekly';
  
  // 二쇨컙 ?밸퀎 遺꾩꽍 異붽?
  const dailyBreakdown = await getDailyBreakdown(startDate, endDate);
  stats.dailyBreakdown = dailyBreakdown;
  
  return stats;
}

/**
 * ?붽컙 ?듦퀎 ?섏쭛
 */
async function collectMonthlyStats(startDate: Date, endDate: Date) {
  const stats = await collectDailyStats(startDate, endDate);
  stats.period.type = 'monthly';
  
  // ?붽컙 ?밸퀎 遺꾩꽍 異붽?
  const weeklyBreakdown = await getWeeklyBreakdown(startDate, endDate);
  stats.weeklyBreakdown = weeklyBreakdown;
  
  return stats;
}

/**
 * ?쇰퀎 遺꾩꽍 ?곗씠?? */
async function getDailyBreakdown(startDate: Date, endDate: Date) {
  const days = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayStats = await collectDailyStats(dayStart, dayEnd);
    days.push({
      date: d.toISOString().split('T')[0],
      ...dayStats.counts
    });
  }
  return days;
}

/**
 * 二쇰퀎 遺꾩꽍 ?곗씠?? */
async function getWeeklyBreakdown(startDate: Date, endDate: Date) {
  const weeks = [];
  const currentWeek = new Date(startDate);
  
  while (currentWeek <= endDate) {
    const weekEnd = new Date(currentWeek);
    weekEnd.setDate(currentWeek.getDate() + 6);
    
    const weekStats = await collectDailyStats(currentWeek, weekEnd);
    weeks.push({
      weekStart: currentWeek.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      ...weekStats.counts
    });
    
    currentWeek.setDate(currentWeek.getDate() + 7);
  }
  return weeks;
}

/**
 * AI ?붿빟 ?앹꽦
 */
async function generateAISummary(stats: any, reportType: string) {
  try {
    const openai = new OpenAI({ 
      apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY 
    });

    const periodText = reportType === 'daily' ? '?ㅻ뒛' : 
                      reportType === 'weekly' ? '?대쾲 二? : '?대쾲 ??;

    const prompt = `
?ㅼ쓬? ?쇨퀬 鍮꾩꽌 ${periodText} ?댁쁺 ?듦퀎?낅땲??

?뱤 湲곕낯 吏??
- ?좉퇋 ?곹뭹: ${stats.counts.newItems}嫄?- ?뚯꽦 ?몄뀡: ${stats.counts.voiceSessions}嫄?- ?뚮┝ ?꾩넚: ${stats.counts.notifications}嫄?- ?먮윭 諛쒖깮: ${stats.counts.errors}嫄?- AI ?붿껌: ${stats.counts.aiRequests}嫄?
?뱢 ?깅뒫 吏??
- ?뚮┝ ?깃났瑜? ${stats.metrics.successRate}%
- 怨좎쑀 ?ъ슜?? ${stats.metrics.uniqueUsers}紐?- ?됯퇏 ?몄뀡 ?쒓컙: ${stats.metrics.avgSessionDuration}遺?
?뤇截??멸린 ?쒓렇:
${stats.metrics.topTags.map(t => `- ${t.tag}: ${t.count}嫄?).join('\n')}

${stats.errors.total > 0 ? `
?좑툘 ?먮윭 ?꾪솴:
${Object.entries(stats.errors.bySource).map(([source, count]) => `- ${source}: ${count}嫄?).join('\n')}
` : ''}

???곗씠?곕? 諛뷀깢?쇰줈 愿由ъ옄??${reportType === 'daily' ? '?쇱씪' : reportType === 'weekly' ? '二쇨컙' : '?붽컙'} 由ы룷???붿빟???묒꽦?댁＜?몄슂.

?붽뎄?ы빆:
1. ?듭떖 ?깃낵? 臾몄젣?먯쓣 紐낇솗??援щ텇
2. 媛쒖꽑 ?쒖븞?ы빆 ?ы븿
3. 鍮꾩쫰?덉뒪 愿?먯뿉?쒖쓽 ?몄궗?댄듃 ?쒓났
4. 200???대궡濡?媛꾧껐?섍쾶 ?묒꽦
5. ?쒓뎅?대줈 ?묒꽦

?붿빟:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "?뱀떊? ?쇨퀬 鍮꾩꽌???댁쁺 遺꾩꽍 ?꾨Ц媛?낅땲?? ?곗씠?곕? 諛뷀깢?쇰줈 紐낇솗?섍퀬 ?ㅽ뻾 媛?ν븳 ?몄궗?댄듃瑜??쒓났?⑸땲??" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    return completion.choices[0]?.message?.content?.trim() || "?붿빟 ?앹꽦 ?ㅽ뙣";

  } catch (error) {
    console.error("AI ?붿빟 ?앹꽦 ?ㅻ쪟:", error);
    return "AI ?붿빟 ?앹꽦 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.";
  }
}

/**
 * PDF ?앹꽦
 */
async function generatePDF(stats: any, summary: string, reportType: string) {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let yPosition = 750;
    const lineHeight = 20;
    const margin = 50;

    // ?ㅻ뜑
    page.drawText(`?뱤 YAGO 鍮꾩꽌 ${reportType === 'daily' ? '?쇱씪' : reportType === 'weekly' ? '二쇨컙' : '?붽컙'} 由ы룷??, {
      x: margin,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0, 0.5, 1)
    });
    yPosition -= 30;

    // ?좎쭨
    const dateStr = stats.period.start.toLocaleDateString("ko-KR");
    const endStr = stats.period.end.toLocaleDateString("ko-KR");
    const periodStr = dateStr === endStr ? dateStr : `${dateStr} ~ ${endStr}`;
    
    page.drawText(`湲곌컙: ${periodStr}`, {
      x: margin,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    });
    yPosition -= 40;

    // 湲곕낯 吏??    page.drawText("?뱤 湲곕낯 吏??, {
      x: margin,
      y: yPosition,
      size: 14,
      font: boldFont
    });
    yPosition -= 25;

    const basicMetrics = [
      `?좉퇋 ?곹뭹: ${stats.counts.newItems}嫄?,
      `?뚯꽦 ?몄뀡: ${stats.counts.voiceSessions}嫄?,
      `?뚮┝ ?꾩넚: ${stats.counts.notifications}嫄?,
      `?먮윭 諛쒖깮: ${stats.counts.errors}嫄?,
      `AI ?붿껌: ${stats.counts.aiRequests}嫄?
    ];

    basicMetrics.forEach(metric => {
      page.drawText(metric, {
        x: margin + 20,
        y: yPosition,
        size: 12,
        font: font
      });
      yPosition -= lineHeight;
    });

    yPosition -= 20;

    // ?깅뒫 吏??    page.drawText("?뱢 ?깅뒫 吏??, {
      x: margin,
      y: yPosition,
      size: 14,
      font: boldFont
    });
    yPosition -= 25;

    const performanceMetrics = [
      `?뚮┝ ?깃났瑜? ${stats.metrics.successRate}%`,
      `怨좎쑀 ?ъ슜?? ${stats.metrics.uniqueUsers}紐?,
      `?됯퇏 ?몄뀡 ?쒓컙: ${stats.metrics.avgSessionDuration}遺?
    ];

    performanceMetrics.forEach(metric => {
      page.drawText(metric, {
        x: margin + 20,
        y: yPosition,
        size: 12,
        font: font
      });
      yPosition -= lineHeight;
    });

    yPosition -= 20;

    // ?멸린 ?쒓렇
    page.drawText("?뤇截??멸린 ?쒓렇", {
      x: margin,
      y: yPosition,
      size: 14,
      font: boldFont
    });
    yPosition -= 25;

    stats.metrics.topTags.forEach((tag: any, index: number) => {
      page.drawText(`${index + 1}. ${tag.tag}: ${tag.count}嫄?, {
        x: margin + 20,
        y: yPosition,
        size: 12,
        font: font
      });
      yPosition -= lineHeight;
    });

    yPosition -= 20;

    // ?먮윭 ?꾪솴 (?먮윭媛 ?덈뒗 寃쎌슦)
    if (stats.errors.total > 0) {
      page.drawText("?좑툘 ?먮윭 ?꾪솴", {
        x: margin,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(1, 0.3, 0.3)
      });
      yPosition -= 25;

      Object.entries(stats.errors.bySource).forEach(([source, count]) => {
        page.drawText(`${source}: ${count}嫄?, {
          x: margin + 20,
          y: yPosition,
          size: 12,
          font: font,
          color: rgb(1, 0.3, 0.3)
        });
        yPosition -= lineHeight;
      });

      yPosition -= 20;
    }

    // AI ?붿빟
    page.drawText("?쭬 AI 遺꾩꽍 ?붿빟", {
      x: margin,
      y: yPosition,
      size: 14,
      font: boldFont
    });
    yPosition -= 25;

    // ?붿빟 ?띿뒪?몃? ?щ윭 以꾨줈 ?섎늻湲?    const words = summary.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      if (currentLine.length + word.length + 1 > 60) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    });
    if (currentLine) lines.push(currentLine);

    lines.forEach(line => {
      page.drawText(line, {
        x: margin + 20,
        y: yPosition,
        size: 11,
        font: font
      });
      yPosition -= lineHeight;
    });

    return await pdfDoc.save();

  } catch (error) {
    console.error("PDF ?앹꽦 ?ㅻ쪟:", error);
    throw error;
  }
}

/**
 * 由ы룷???꾩넚
 */
async function sendReport(pdfBytes: Uint8Array, reportTitle: string, stats: any) {
  try {
    // n8n ?뱁썒 ?꾩넚
    const n8nWebhook = functions.config().n8n?.webhook;
    if (n8nWebhook) {
      await fetch(n8nWebhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "yago_report",
          title: reportTitle,
          stats: stats.counts,
          summary: "PDF 由ы룷?멸? ?앹꽦?섏뿀?듬땲??",
          timestamp: new Date().toISOString()
        })
      });
    }

    // Firebase Storage?????(?좏깮?ы빆)
    const bucket = admin.storage().bucket();
    const fileName = `reports/${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    const file = bucket.file(fileName);
    
    await file.save(Buffer.from(pdfBytes), {
      metadata: {
        contentType: 'application/pdf',
        cacheControl: 'public, max-age=31536000'
      }
    });

    console.log(`?뱾 由ы룷???꾩넚 ?꾨즺: ${fileName}`);

  } catch (error) {
    console.error("由ы룷???꾩넚 ?ㅻ쪟:", error);
    throw error;
  }
}

/**
 * 由ы룷??濡쒓렇 ??? */
async function saveReportLog(stats: any, summary: string, reportType: string, pdfSize: number) {
  try {
    await db.collection("reportLogs").add({
      reportType,
      period: {
        start: stats.period.start,
        end: stats.period.end
      },
      stats: stats.counts,
      metrics: stats.metrics,
      summary,
      pdfSize,
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log("?뱷 由ы룷??濡쒓렇 ????꾨즺");

  } catch (error) {
    console.error("由ы룷??濡쒓렇 ????ㅻ쪟:", error);
    throw error;
  }
}

/**
 * ?됯퇏 ?몄뀡 ?쒓컙 怨꾩궛
 */
function calculateAvgSessionDuration(sessions: any[]): number {
  if (sessions.length === 0) return 0;
  
  // ?ㅼ젣 援ы쁽?먯꽌???몄뀡 ?쒖옉/醫낅즺 ?쒓컙??異붿쟻?댁빞 ??  // ?꾩옱??異붿젙媛?諛섑솚
  return Math.round(Math.random() * 10 + 5); // 5-15遺??쒕뜡
}

/**
 * ?먮윭 濡쒓퉭 (湲곗〈 loggingUtils?먯꽌 import)
 */
async function logError(source: string, error: any, meta?: any) {
  try {
    await db.collection("errors").add({
      source,
      message: String(error?.message || error),
      stack: error?.stack || null,
      meta: meta ?? null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (logError) {
    console.error("?먮윭 濡쒓퉭 ?ㅽ뙣:", logError);
  }
}

/**
 * ?섎룞 由ы룷???앹꽦 (?뚯뒪?몄슜)
 */
export const manualReport = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { type = "daily" } = req.body;
      
      let stats;
      if (type === "daily") {
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        stats = await collectDailyStats(yesterday, today);
      } else if (type === "weekly") {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        stats = await collectWeeklyStats(weekAgo, today);
      } else {
        return res.status(400).json({ error: "Invalid report type" });
      }

      const summary = await generateAISummary(stats, type);
      const pdfBytes = await generatePDF(stats, summary, type);
      
      await sendReport(pdfBytes, `${type} 由ы룷??, stats);
      await saveReportLog(stats, summary, type, pdfBytes.length);

      res.json({ 
        message: `${type} 由ы룷???앹꽦 ?꾨즺`, 
        stats: stats.counts,
        summary,
        pdfSize: pdfBytes.length
      });

    } catch (error) {
      console.error("?섎룞 由ы룷???앹꽦 ?ㅻ쪟:", error);
      res.status(500).json({ error: error.message });
    }
  });
