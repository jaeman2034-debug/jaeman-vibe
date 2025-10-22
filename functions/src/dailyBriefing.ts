import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import { logBriefing, logError, logAIRequest } from "./loggingUtils";

/**
 * ?똿 ?쇱씪 AI 釉뚮━???쒖뒪?? * 留ㅼ씪 ?꾩묠 9?쒖뿉 ?ㅻ뒛???ㅽ룷痢??뚯떇??AI媛 ?붿빟?댁꽌 ?몄떆濡??꾩넚
 */

// Firebase Admin 珥덇린??admin.initializeApp();
const db = admin.firestore();

/**
 * 留ㅼ씪 ?꾩묠 9???ㅽ뻾?섎뒗 ?쇱씪 釉뚮━?? */
export const dailyBriefing = functions
  .region("asia-northeast3")
  .pubsub.schedule("0 9 * * *") // 留ㅼ씪 ?ㅼ쟾 9??(KST)
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("?똿 ?쇱씪 釉뚮━???쒖옉:", new Date().toISOString());

    try {
      // OpenAI ?대씪?댁뼵??珥덇린??      const openai = new OpenAI({ 
        apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY 
      });

      // 吏??24?쒓컙 ?곗씠???섏쭛
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // ???곹뭹 ?곗씠??議고쉶
      const itemsSnapshot = await db
        .collection("marketItems")
        .where("createdAt", ">=", since)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      // ? 紐⑥쭛 ?곗씠??議고쉶 (異뷀썑 援ы쁽 ?덉젙)
      const teamsSnapshot = await db
        .collection("teamRecruitments")
        .where("createdAt", ">=", since)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

      // ?댁씪 ?덉륫 ?곗씠???섏쭛
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowKey = tomorrow.toISOString().slice(0, 10);
      
      const forecastSnapshot = await db.collection("forecasts")
        .doc(tomorrowKey)
        .collection("cells")
        .orderBy("yhat", "desc")
        .limit(5)
        .get();

      const items = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'item'
      }));

      const teams = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'team'
      }));

      const forecasts = forecastSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'forecast'
      }));

      const allData = [...items, ...teams, ...forecasts];
      
      console.log(`?뱤 ?섏쭛???곗씠?? ?곹뭹 ${items.length}媛? ? 紐⑥쭛 ${teams.length}媛? ?덉륫 ${forecasts.length}媛?);

      // ?곗씠?곌? ?놁쑝硫?湲곕낯 硫붿떆吏
      if (allData.length === 0) {
        await sendDefaultBriefing();
        return;
      }

      // AI ?붿빟 ?앹꽦
      const startTime = Date.now();
      const summary = await generateAISummary(allData, openai);
      const processingTime = Date.now() - startTime;
      
      if (!summary) {
        console.error("??AI ?붿빟 ?앹꽦 ?ㅽ뙣");
        await logError("dailyBriefing", new Error("AI ?붿빟 ?앹꽦 ?ㅽ뙣"), { dataCount: allData.length });
        return;
      }

      console.log("?쭬 ?앹꽦???붿빟:", summary);
      
      // AI ?붿껌 濡쒓렇 ???      await logAIRequest({
        type: 'briefing',
        input: JSON.stringify(allData.slice(0, 5)), // 泥섏쓬 5媛쒕쭔
        output: summary,
        model: 'gpt-4o-mini',
        processingTime
      });

      // 紐⑤뱺 援щ룆?먯뿉寃?釉뚮━???꾩넚
      await sendBriefingToSubscribers(summary, allData);

      // 釉뚮━??濡쒓렇 ???      await saveBriefingLog(summary, allData);

      console.log("???쇱씪 釉뚮━???꾨즺");

    } catch (error) {
      console.error("???쇱씪 釉뚮━???ㅻ쪟:", error);
      await logError("dailyBriefing", error, { context: "main_execution" });
    }
  });

/**
 * AI ?붿빟 ?앹꽦
 */
async function generateAISummary(data: any[], openai: OpenAI): Promise<string | null> {
  try {
    // ?곗씠?곕? AI媛 ?댄빐?섍린 ?ъ슫 ?뺥깭濡?蹂??    const formattedData = data.map(item => ({
      type: item.type === 'item' ? '?곹뭹' : '? 紐⑥쭛',
      title: item.title,
      description: item.autoDescription || item.description,
      tags: item.autoTags || item.tags || [],
      location: item.location ? `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}` : '?꾩튂 誘몄긽',
      createdAt: item.createdAt?.toDate?.()?.toLocaleString() || '?쒓컙 誘몄긽'
    }));

    const prompt = `?ㅼ쓬? 吏??24?쒓컙 ?숈븞 ?깅줉???ㅽ룷痢?愿????ぉ?ㅺ낵 ?댁씪 ?덉륫 ?뺣낫?낅땲??

?곗씠??
${JSON.stringify(formattedData, null, 2)}

???곗씠?곕? 諛뷀깢?쇰줈 "?쇨퀬 鍮꾩꽌" 罹먮┃?곕줈 ?ㅻ뒛??釉뚮━?묒쓣 ?묒꽦?댁＜?몄슂.

?붽뎄?ы빆:
1. 移쒓렐?섍퀬 ?쒕컻???ㅼ쑝濡??묒꽦
2. "?뺣떂"?대씪怨?遺瑜대ŉ ??붿껜濡??묒꽦
3. ?ㅻ뒛??二쇱슂 ?쒕룞怨??덈줈???뚯떇??媛뺤“
4. ?댁씪 ?덉륫 ?뺣낫???ы븿 (?쒕룞?됱씠 ?믪? 吏?? ?덉긽 ?몃젋????
5. 二쇱슂 ?ㅼ썙?쒖? ?レ옄瑜??ы븿
6. ??臾몃떒?쇰줈 媛꾧껐?섍쾶 ?묒꽦 (150???대궡)
7. ?앹뿉 "?ㅻ뒛??醫뗭? ?섎（ ?섏꽭??" 媛숈? 寃⑸젮 硫섑듃 ?ы븿

?덉떆:
"?뺣떂! ?ㅻ뒛? ?뚰쓽FC ?좎엯 ???紐⑥쭛怨?異뺢뎄??2嫄댁씠 ?덈줈 ?깅줉?섏뿀?댁슂. ?댁씪? 媛뺣궓援??쇰??먯꽌 ?쒕룞?됱씠 30% 利앷????덉젙?대땲 誘몃━ 以鍮꾪븯?몄슂! ?ㅻ뒛??醫뗭? ?섎（ ?섏꽭??"

釉뚮━??`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "?뱀떊? '?쇨퀬 鍮꾩꽌'?쇰뒗 移쒓렐?섍퀬 ?쒕컻???ㅽ룷痢?AI ?댁떆?ㅽ꽩?몄엯?덈떎. ?ъ슜?먮? '?뺣떂'?대씪怨?遺瑜대ŉ ??붿껜濡??뚰넻?⑸땲??" 
        },
        { role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 150
    });

    return completion.choices[0]?.message?.content?.trim() || null;

  } catch (error) {
    console.error("OpenAI ?붿빟 ?앹꽦 ?ㅻ쪟:", error);
    return null;
  }
}

/**
 * 援щ룆?먮뱾?먭쾶 釉뚮━???꾩넚
 */
async function sendBriefingToSubscribers(summary: string, data: any[]) {
  try {
    // ?쒖꽦 援щ룆??議고쉶
    const subscriptionsSnapshot = await db
      .collection("subscriptions")
      .where("fcmToken", "!=", null)
      .get();

    if (subscriptionsSnapshot.empty) {
      console.log("?벊 ?쒖꽦 援щ룆?먭? ?놁뒿?덈떎.");
      return;
    }

    const subscriptions = subscriptionsSnapshot.docs.map(doc => doc.data());
    const tokens = subscriptions
      .map(sub => sub.fcmToken)
      .filter(token => token && token.startsWith('ExponentPushToken'));

    console.log(`?벑 釉뚮━???꾩넚 ??? ${tokens.length}紐?);

    if (tokens.length === 0) {
      console.log("?벊 ?좏슚??FCM ?좏겙???놁뒿?덈떎.");
      return;
    }

    // FCM ?좏겙??500媛쒖뵫 ?섎늻???꾩넚 (FCM ?쒗븳)
    const chunks = [];
    while (tokens.length) {
      chunks.push(tokens.splice(0, 500));
    }

    const sendPromises = chunks.map(async (chunk, index) => {
      try {
        const response = await admin.messaging().sendMulticast({
          tokens: chunk,
          notification: {
            title: "?똿 ?쇨퀬 鍮꾩꽌 ?꾩묠 釉뚮━??,
            body: summary,
            sound: "default",
            badge: "1"
          },
          data: {
            type: "daily_briefing",
            summary: summary,
            dataCount: data.length.toString(),
            timestamp: new Date().toISOString()
          },
          android: {
            priority: "high",
            notification: {
              sound: "default",
              channelId: "daily_briefing"
            }
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
                badge: 1
              }
            }
          }
        });

        console.log(`?뱾 泥?겕 ${index + 1} ?꾩넚 寃곌낵: ?깃났 ${response.successCount}嫄? ?ㅽ뙣 ${response.failureCount}嫄?);
        
        // ?ㅽ뙣???좏겙 泥섎━
        if (response.failureCount > 0) {
          response.responses.forEach((resp, i) => {
            if (!resp.success && resp.error) {
              console.error(`?좏겙 ${i} ?꾩넚 ?ㅽ뙣:`, resp.error.message);
              
              // 留뚮즺???좏겙 ?뺣━ (?좏깮?ы빆)
              if (resp.error.code === 'messaging/registration-token-not-registered') {
                // ?대떦 ?좏겙??媛吏?援щ룆 ??젣
                const failedToken = chunk[i];
                cleanupExpiredToken(failedToken);
              }
            }
          });
        }

      } catch (error) {
        console.error(`泥?겕 ${index + 1} ?꾩넚 ?ㅻ쪟:`, error);
      }
    });

    await Promise.allSettled(sendPromises);
    console.log("??紐⑤뱺 釉뚮━???꾩넚 ?꾨즺");

  } catch (error) {
    console.error("釉뚮━???꾩넚 ?ㅻ쪟:", error);
  }
}

/**
 * 湲곕낯 釉뚮━???꾩넚 (?곗씠?곌? ?놁쓣 ??
 */
async function sendDefaultBriefing() {
  try {
    const subscriptionsSnapshot = await db
      .collection("subscriptions")
      .where("fcmToken", "!=", null)
      .get();

    if (subscriptionsSnapshot.empty) return;

    const tokens = subscriptionsSnapshot.docs
      .map(doc => doc.data().fcmToken)
      .filter(token => token && token.startsWith('ExponentPushToken'));

    const defaultMessage = "?뺣떂! ?ㅻ뒛? ?덈줈???깅줉???놁뼱?? 醫뗭? ?섎（ 蹂대궡?몄슂! ?똿";

    await admin.messaging().sendMulticast({
      tokens: tokens.slice(0, 500), // ?쒗븳
      notification: {
        title: "?똿 ?쇨퀬 鍮꾩꽌 ?꾩묠 釉뚮━??,
        body: defaultMessage,
        sound: "default"
      },
      data: {
        type: "daily_briefing",
        summary: defaultMessage,
        dataCount: "0"
      }
    });

    console.log("?뱾 湲곕낯 釉뚮━???꾩넚 ?꾨즺");

  } catch (error) {
    console.error("湲곕낯 釉뚮━???꾩넚 ?ㅻ쪟:", error);
  }
}

/**
 * 釉뚮━??濡쒓렇 ??? */
async function saveBriefingLog(summary: string, data: any[]) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    await db.collection("briefingLogs").doc(today).set({
      date: today,
      summary,
      itemCount: data.filter(d => d.type === 'item').length,
      teamCount: data.filter(d => d.type === 'team').length,
      totalCount: data.length,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      data: data.slice(0, 10) // 理쒓렐 10媛쒕쭔 ???    });

    console.log("?뱷 釉뚮━??濡쒓렇 ????꾨즺");

  } catch (error) {
    console.error("釉뚮━??濡쒓렇 ????ㅻ쪟:", error);
  }
}

/**
 * 留뚮즺???좏겙 ?뺣━
 */
async function cleanupExpiredToken(token: string) {
  try {
    const expiredSubscriptions = await db
      .collection("subscriptions")
      .where("fcmToken", "==", token)
      .get();

    const deletePromises = expiredSubscriptions.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    console.log(`?뿊截?留뚮즺???좏겙 ?뺣━ ?꾨즺: ${expiredSubscriptions.size}媛?);

  } catch (error) {
    console.error("?좏겙 ?뺣━ ?ㅻ쪟:", error);
  }
}

/**
 * ?섎룞 釉뚮━???ㅽ뻾 (?뚯뒪?몄슜)
 */
export const manualBriefing = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      // ?쇱씪 釉뚮━??濡쒖쭅 ?ъ궗??      const openai = new OpenAI({ 
        apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY 
      });

      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const itemsSnapshot = await db
        .collection("marketItems")
        .where("createdAt", ">=", since)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      const items = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'item'
      }));

      if (items.length === 0) {
        return res.json({ message: "?좉퇋 ??ぉ ?놁쓬", summary: null });
      }

      const summary = await generateAISummary(items, openai);
      
      if (summary) {
        await sendBriefingToSubscribers(summary, items);
        await saveBriefingLog(summary, items);
      }

      res.json({ 
        message: "?섎룞 釉뚮━???꾨즺", 
        summary,
        itemCount: items.length 
      });

    } catch (error) {
      console.error("?섎룞 釉뚮━???ㅻ쪟:", error);
      res.status(500).json({ error: error.message });
    }
  });
