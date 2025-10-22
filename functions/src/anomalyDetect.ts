import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import fetch from "node-fetch";

/**
 * ?슚 AI ?대깽???먯? ?쒖뒪?? * ?ㅼ떆媛??쒕룞??湲됱쬆/湲됯컧 媛먯? 諛??먮룞 ?뚮┝
 */

// Firebase Admin 珥덇린??admin.initializeApp();
const db = admin.firestore();

/**
 * 30遺꾨쭏???ㅽ뻾?섎뒗 ?댁긽 ?먯?
 */
export const detectAnomalies = functions
  .region("asia-northeast3")
  .pubsub.schedule("*/30 * * * *") // 30遺꾨쭏???ㅽ뻾
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("?슚 ?댁긽 ?먯? ?쒖옉:", new Date().toISOString());

    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // 1截뤴깵 理쒓렐 1?쒓컙 ?곗씠???섏쭛
      const [recentVoiceSnap, recentMarketSnap, recentTeamSnap] = await Promise.all([
        db.collection("voiceSessions")
          .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(oneHourAgo))
          .get(),
        db.collection("marketItems")
          .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(oneHourAgo))
          .get(),
        db.collection("teamRecruitments")
          .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(oneHourAgo))
          .get()
      ]);

      // 2截뤴깵 吏??7???됯퇏 ?곗씠???섏쭛
      const [weekVoiceSnap, weekMarketSnap, weekTeamSnap] = await Promise.all([
        db.collection("voiceSessions")
          .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
          .get(),
        db.collection("marketItems")
          .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
          .get(),
        db.collection("teamRecruitments")
          .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
          .get()
      ]);

      // 3截뤴깵 ?곗씠??蹂??      const recentData = {
        voice: recentVoiceSnap.docs.map(d => d.data()),
        market: recentMarketSnap.docs.map(d => d.data()),
        team: recentTeamSnap.docs.map(d => d.data())
      };

      const weekData = {
        voice: weekVoiceSnap.docs.map(d => d.data()),
        market: weekMarketSnap.docs.map(d => d.data()),
        team: weekTeamSnap.docs.map(d => d.data())
      };

      // 4截뤴깵 ?댁긽 ?먯? ?ㅽ뻾
      const anomalies = await detectAnomaliesInData(recentData, weekData);

      if (anomalies.length === 0) {
        console.log("???댁긽 ?먯? ?꾨즺: ?댁긽 ?놁쓬");
        return;
      }

      // 5截뤴깵 AI 遺꾩꽍
      const analysis = await generateAIAnalysis(anomalies);

      // 6截뤴깵 ?뚮┝ ?꾩넚
      await sendAnomalyAlerts(anomalies, analysis);

      // 7截뤴깵 濡쒓렇 ???      await saveAnomalyLog(anomalies, analysis);

      console.log(`???댁긽 ?먯? ?꾨즺: ${anomalies.length}媛??댁긽 媛먯?`);

    } catch (error) {
      console.error("???댁긽 ?먯? ?ㅻ쪟:", error);
      await logError("detectAnomalies", error, { context: "main_execution" });
    }
  });

/**
 * ?곗씠?곗뿉???댁긽 ?먯?
 */
async function detectAnomaliesInData(recentData: any, weekData: any) {
  const anomalies: Array<{
    location: string;
    type: string;
    recentCount: number;
    weekAverage: number;
    ratio: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    lat: number;
    lng: number;
  }> = [];

  // ?곗씠????낅퀎 泥섎━
  const dataTypes = [
    { key: 'voice', label: '?뚯꽦 ?몄뀡' },
    { key: 'market', label: '?곹뭹 ?깅줉' },
    { key: 'team', label: '? 紐⑥쭛' }
  ];

  for (const dataType of dataTypes) {
    const recent = recentData[dataType.key];
    const week = weekData[dataType.key];

    // 吏??퀎 吏묎퀎
    const recentAgg = aggregateByLocation(recent);
    const weekAgg = aggregateByLocation(week);

    // ?댁긽 ?먯?
    Object.entries(recentAgg).forEach(([location, recentCount]) => {
      const weekAverage = weekAgg[location] ? weekAgg[location] / 7 : 0;
      
      if (weekAverage > 0) {
        const ratio = recentCount / weekAverage;
        
        // 湲됱쬆 媛먯? (>150%)
        if (ratio > 1.5) {
          const [lat, lng] = location.split(',').map(Number);
          const severity = getSeverity(ratio);
          
          anomalies.push({
            location,
            type: dataType.label,
            recentCount: recentCount as number,
            weekAverage,
            ratio,
            severity,
            lat,
            lng
          });
        }
        
        // 湲됯컧 媛먯? (<50%) - ?밸퀎??寃쎌슦留?        if (ratio < 0.5 && weekAverage > 5) {
          const [lat, lng] = location.split(',').map(Number);
          
          anomalies.push({
            location,
            type: dataType.label,
            recentCount: recentCount as number,
            weekAverage,
            ratio,
            severity: 'medium',
            lat,
            lng
          });
        }
      }
    });
  }

  // ?ш컖?꾨퀎 ?뺣젹
  return anomalies.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

/**
 * ?꾩튂蹂??곗씠??吏묎퀎
 */
function aggregateByLocation(data: any[]) {
  const map: Record<string, number> = {};
  
  data.forEach(item => {
    let lat, lng;
    
    // ?꾩튂 ?곗씠??異붿텧 (?ㅼ뼇???꾨뱶紐?吏??
    if (item.geo?.lat && item.geo?.lng) {
      lat = item.geo.lat;
      lng = item.geo.lng;
    } else if (item.location?.latitude && item.location?.longitude) {
      lat = item.location.latitude;
      lng = item.location.longitude;
    }
    
    if (lat && lng) {
      // 0.01???⑥쐞濡?洹몃━?쒗솕 (??1km)
      const gridLat = Math.round(lat * 100) / 100;
      const gridLng = Math.round(lng * 100) / 100;
      const key = `${gridLat},${gridLng}`;
      map[key] = (map[key] || 0) + 1;
    }
  });
  
  return map;
}

/**
 * ?ш컖??怨꾩궛
 */
function getSeverity(ratio: number): 'low' | 'medium' | 'high' | 'critical' {
  if (ratio >= 5.0) return 'critical';  // 5諛??댁긽
  if (ratio >= 3.0) return 'high';      // 3諛??댁긽
  if (ratio >= 2.0) return 'medium';    // 2諛??댁긽
  return 'low';                         // 1.5諛??댁긽
}

/**
 * AI 遺꾩꽍 ?앹꽦
 */
async function generateAIAnalysis(anomalies: any[]) {
  try {
    const openai = new OpenAI({ 
      apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY 
    });

    const prompt = `
?ㅼ쓬? ?쇨퀬 鍮꾩꽌???ㅼ떆媛??댁긽 ?먯? 寃곌낵?낅땲??

?슚 ?먯????댁긽 ?꾩긽:
${anomalies.map((a, i) => `
${i + 1}. ${a.type} - ?꾩튂: ${a.location}
   - 理쒓렐 1?쒓컙: ${a.recentCount}嫄?   - 二쇨컙 ?됯퇏: ${a.weekAverage.toFixed(1)}嫄?   - 利앷??? ${(a.ratio * 100).toFixed(0)}%
   - ?ш컖?? ${a.severity}
`).join('')}

???곗씠?곕? 諛뷀깢?쇰줈 ?ㅼ쓬??遺꾩꽍?댁＜?몄슂:

1. 媛?吏??퀎濡??대뼡 ?대깽?멸? 諛쒖깮?덉쓣 媛?μ꽦???덈뒗吏 異붾줎
2. ?쒓컙?? ?쒕룞 ?⑦꽩??怨좊젮??留λ씫???댁꽍
3. 愿由ъ옄?먭쾶 ?쒓났???ㅽ뻾 媛?ν븳 ?몄궗?댄듃
4. 鍮꾩쫰?덉뒪 愿?먯뿉?쒖쓽 ?섎?

?붽뎄?ы빆:
- ?쒓뎅?대줈 ?묒꽦
- 200???대궡濡?媛꾧껐?섍쾶
- 援ъ껜?곸씠怨??ㅽ뻾 媛?ν븳 ?댁슜
- ?꾨Ц?곸씠硫댁꽌???댄빐?섍린 ?쎄쾶

遺꾩꽍 寃곌낵:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "?뱀떊? ?쇨퀬 鍮꾩꽌???곗씠??遺꾩꽍 ?꾨Ц媛?낅땲?? ?댁긽 ?먯? 寃곌낵瑜?諛뷀깢?쇰줈 紐낇솗?섍퀬 ?ㅽ뻾 媛?ν븳 ?몄궗?댄듃瑜??쒓났?⑸땲??" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    return completion.choices[0]?.message?.content?.trim() || "AI 遺꾩꽍 ?앹꽦 ?ㅽ뙣";

  } catch (error) {
    console.error("AI 遺꾩꽍 ?앹꽦 ?ㅻ쪟:", error);
    return "AI 遺꾩꽍 ?앹꽦 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.";
  }
}

/**
 * ?댁긽 ?먯? ?뚮┝ ?꾩넚
 */
async function sendAnomalyAlerts(anomalies: any[], analysis: string) {
  try {
    // n8n ?뱁썒 ?꾩넚
    const n8nWebhook = functions.config().n8n?.webhook_alert;
    if (n8nWebhook) {
      await fetch(n8nWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "anomaly_detection",
          title: "?슚 ?쇨퀬 鍮꾩꽌 ?댁긽 ?먯? ?뚮┝",
          message: analysis,
          anomalies: anomalies.map(a => ({
            location: a.location,
            type: a.type,
            ratio: a.ratio,
            severity: a.severity,
            count: a.recentCount
          })),
          timestamp: new Date().toISOString(),
          criticalCount: anomalies.filter(a => a.severity === 'critical').length,
          totalCount: anomalies.length
        })
      });
    }

    // Firebase FCM?쇰줈 愿由ъ옄 ?뚮┝
    await sendFCMAlert(anomalies, analysis);

    // Slack ?뚮┝ (?좏깮?ы빆)
    const slackWebhook = functions.config().slack?.webhook;
    if (slackWebhook) {
      await sendSlackAlert(anomalies, analysis, slackWebhook);
    }

    console.log("?뱾 ?댁긽 ?먯? ?뚮┝ ?꾩넚 ?꾨즺");

  } catch (error) {
    console.error("?뚮┝ ?꾩넚 ?ㅻ쪟:", error);
    throw error;
  }
}

/**
 * FCM 愿由ъ옄 ?뚮┝
 */
async function sendFCMAlert(anomalies: any[], analysis: string) {
  try {
    // 愿由ъ옄 ?좏겙 紐⑸줉 議고쉶
    const adminTokensSnap = await db.collection("adminTokens").get();
    const adminTokens = adminTokensSnap.docs.map(doc => doc.data().fcmToken).filter(Boolean);

    if (adminTokens.length === 0) {
      console.log("愿由ъ옄 FCM ?좏겙???놁뒿?덈떎.");
      return;
    }

    const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
    const title = criticalCount > 0 
      ? `?슚 湲닿툒: ${criticalCount}媛?吏???댁긽 ?먯?`
      : `?좑툘 ${anomalies.length}媛?吏???댁긽 ?먯?`;

    const message = {
      notification: {
        title,
        body: analysis.length > 100 ? analysis.substring(0, 100) + "..." : analysis,
      },
      data: {
        type: "anomaly_detection",
        anomalyCount: anomalies.length.toString(),
        criticalCount: criticalCount.toString(),
        analysis: analysis
      },
      tokens: adminTokens
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`?벑 FCM ?뚮┝ ?꾩넚: ${response.successCount}/${adminTokens.length}`);

  } catch (error) {
    console.error("FCM ?뚮┝ ?꾩넚 ?ㅻ쪟:", error);
  }
}

/**
 * Slack ?뚮┝ ?꾩넚
 */
async function sendSlackAlert(anomalies: any[], analysis: string, webhookUrl: string) {
  try {
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    const color = criticalAnomalies.length > 0 ? 'danger' : 'warning';

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "?슚 ?쇨퀬 鍮꾩꽌 ?댁긽 ?먯?"
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*?먯? ?쒓컙:* ${new Date().toLocaleString('ko-KR')}\n*遺꾩꽍 寃곌낵:* ${analysis}`
        }
      }
    ];

    if (anomalies.length <= 5) {
      // ?곸? ?섏쓽 ?댁긽? ?곸꽭 ?쒖떆
      anomalies.forEach((anomaly, index) => {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${index + 1}. ${anomaly.type}* (${anomaly.location})\n??理쒓렐 1?쒓컙: ${anomaly.recentCount}嫄?n??利앷??? ${(anomaly.ratio * 100).toFixed(0)}%\n???ш컖?? ${anomaly.severity}`
          }
        });
      });
    } else {
      // 留롮? ?섏쓽 ?댁긽? ?붿빟 ?쒖떆
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*?먯????댁긽 ?꾩긽:* ${anomalies.length}媛?n??Critical: ${criticalAnomalies.length}媛?n??High: ${anomalies.filter(a => a.severity === 'high').length}媛?n??Medium: ${anomalies.filter(a => a.severity === 'medium').length}媛?
        }
      });
    }

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachments: [{
          color,
          blocks
        }]
      })
    });

    console.log("?뮠 Slack ?뚮┝ ?꾩넚 ?꾨즺");

  } catch (error) {
    console.error("Slack ?뚮┝ ?꾩넚 ?ㅻ쪟:", error);
  }
}

/**
 * ?댁긽 ?먯? 濡쒓렇 ??? */
async function saveAnomalyLog(anomalies: any[], analysis: string) {
  try {
    await db.collection("anomalyLogs").add({
      detectedAt: admin.firestore.FieldValue.serverTimestamp(),
      anomalies: anomalies.map(a => ({
        location: a.location,
        type: a.type,
        recentCount: a.recentCount,
        weekAverage: a.weekAverage,
        ratio: a.ratio,
        severity: a.severity,
        lat: a.lat,
        lng: a.lng
      })),
      analysis,
      summary: {
        totalAnomalies: anomalies.length,
        criticalCount: anomalies.filter(a => a.severity === 'critical').length,
        highCount: anomalies.filter(a => a.severity === 'high').length,
        mediumCount: anomalies.filter(a => a.severity === 'medium').length,
        lowCount: anomalies.filter(a => a.severity === 'low').length
      }
    });

    console.log("?뱷 ?댁긽 ?먯? 濡쒓렇 ????꾨즺");

  } catch (error) {
    console.error("濡쒓렇 ????ㅻ쪟:", error);
    throw error;
  }
}

/**
 * ?섎룞 ?댁긽 ?먯? (?뚯뒪?몄슜)
 */
export const manualAnomalyDetection = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      console.log("?뵇 ?섎룞 ?댁긽 ?먯? ?쒖옉");

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // ?곗씠???섏쭛 (?꾩? ?숈씪??濡쒖쭅)
      const [recentVoiceSnap, recentMarketSnap, recentTeamSnap] = await Promise.all([
        db.collection("voiceSessions")
          .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(oneHourAgo))
          .get(),
        db.collection("marketItems")
          .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(oneHourAgo))
          .get(),
        db.collection("teamRecruitments")
          .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(oneHourAgo))
          .get()
      ]);

      const recentData = {
        voice: recentVoiceSnap.docs.map(d => d.data()),
        market: recentMarketSnap.docs.map(d => d.data()),
        team: recentTeamSnap.docs.map(d => d.data())
      };

      // 吏??7???곗씠?곕룄 ?섏쭛...
      const anomalies = await detectAnomaliesInData(recentData, {}); // 媛꾩냼??      const analysis = await generateAIAnalysis(anomalies);

      res.json({
        success: true,
        detectedAt: new Date().toISOString(),
        anomalies,
        analysis,
        summary: {
          totalAnomalies: anomalies.length,
          criticalCount: anomalies.filter(a => a.severity === 'critical').length
        }
      });

    } catch (error) {
      console.error("?섎룞 ?댁긽 ?먯? ?ㅻ쪟:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

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
