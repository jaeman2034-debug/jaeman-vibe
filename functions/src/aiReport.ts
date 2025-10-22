/**
 * ?쭬 YAGO VIBE AI ?먮룞 由ы룷???앹꽦 ?쒖뒪?? * 
 * 留ㅼ＜ ?붿슂???덈꼍 4??嫄곕옒 ?곗씠?곕? 遺꾩꽍?섏뿬
 * AI媛 ?먮룞?쇰줈 ?먯뿰???붿빟 由ы룷?몃? ?앹꽦?⑸땲??
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";

const db = admin.firestore();

// OpenAI ?대씪?댁뼵??珥덇린??const openai = new OpenAI({
  apiKey: functions.config().openai?.api_key || process.env.OPENAI_API_KEY,
});

/**
 * 二쇨컙 AI 嫄곕옒 由ы룷???먮룞 ?앹꽦
 * Cloud Scheduler: 留ㅼ＜ ?붿슂???덈꼍 4??(Asia/Seoul)
 * CRON: 0 4 * * 1
 */
export const generateWeeklyReport = functions
  .region("asia-northeast3")
  .pubsub.schedule("0 4 * * 1")
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    try {
      const now = new Date();
      const weekNumber = getWeekNumber(now);
      const reportId = `weekly_${now.getFullYear()}-W${weekNumber}`;
      
      console.log(`?쭬 [${reportId}] AI 二쇨컙 由ы룷???앹꽦 ?쒖옉`);

      // ?ъ슜???곗씠???섏쭛
      const usersSnap = await db.collection("users").get();
      
      let totalSales = 0;
      let trustSum = 0;
      let sellerCount = 0;
      const categoryCount: { [key: string]: number } = {};

      usersSnap.forEach((doc) => {
        const data = doc.data();
        
        if (data.totalSales && data.totalSales > 0) {
          totalSales += data.totalSales;
          trustSum += data.trustScore || 50;
          sellerCount++;
        }

        // 移댄뀒怨좊━ 吏묎퀎 (tags 湲곕컲)
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach((tag: string) => {
            categoryCount[tag] = (categoryCount[tag] || 0) + 1;
          });
        }
      });

      const avgTrust = sellerCount > 0 ? Math.round(trustSum / sellerCount) : 50;
      
      // ?곸쐞 移댄뀒怨좊━ Top 3
      const topCategories = Object.entries(categoryCount)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([cat]) => cat);

      // ?곹뭹 ?곗씠???섏쭛
      const productsSnap = await db
        .collection("marketItems")
        .where("status", "==", "completed")
        .get();

      const completedCount = productsSnap.size;

      // ?쭬 OpenAI濡?AI ?붿빟 ?앹꽦
      let aiSummary = "";
      
      try {
        const prompt = `
?ㅼ쓬? YAGO VIBE ?ㅽ룷痢?留덉폆???대쾲 二?嫄곕옒 ?곗씠?곗엯?덈떎:

- 珥?嫄곕옒 嫄댁닔: ${totalSales}嫄?- ?꾨즺??嫄곕옒: ${completedCount}嫄?- ?쒖꽦 ?먮ℓ?? ${sellerCount}紐?- ?됯퇏 ?좊ː?? ${avgTrust}??- ?멸린 移댄뀒怨좊━: ${topCategories.join(", ")}

???곗씠?곕? 諛뷀깢?쇰줈 **??以꾨줈 媛꾧껐?섍쾶** 嫄곕옒 ?꾪솴???붿빟?댁＜?몄슂.
?덉떆: "?대쾲 二?${totalSales}嫄?嫄곕옒 ?꾨즺, ?됯퇏 ?좊ː??${avgTrust}?먯쑝濡??덉젙???댁쁺 以? ${topCategories[0]} 移댄뀒怨좊━媛 媛???쒕컻?⑸땲??"
        `.trim();

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { 
              role: "system", 
              content: "?뱀떊? 嫄곕옒 ?뚮옯?쇱쓽 ?곗씠??遺꾩꽍媛?낅땲?? 媛꾧껐?섍퀬 紐낇솗???쒓뎅?대줈 鍮꾩쫰?덉뒪 由ы룷?몃? ?묒꽦?⑸땲??" 
            },
            { 
              role: "user", 
              content: prompt 
            },
          ],
          temperature: 0.7,
          max_tokens: 150,
        });

        aiSummary = response.choices[0].message.content?.trim() || "";
        console.log("??AI ?붿빟 ?앹꽦:", aiSummary);
      } catch (aiError) {
        console.warn("?좑툘 AI ?붿빟 ?앹꽦 ?ㅽ뙣, 湲곕낯 ?붿빟 ?ъ슜:", aiError);
        aiSummary = `?대쾲 二?珥?${totalSales}嫄?嫄곕옒, ?됯퇏 ?좊ː??${avgTrust}?? ${topCategories[0] || "?ㅼ뼇??} 移댄뀒怨좊━媛 ?쒕컻?⑸땲??`;
      }

      // 由ы룷?????      await db.collection("reports").doc(reportId).set({
        week: reportId,
        totalSales,
        completedCount,
        sellerCount,
        avgTrust,
        topCategories,
        aiSummary,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`??[${reportId}] AI 二쇨컙 由ы룷???앹꽦 ?꾨즺`);
      console.log(`   - 珥?嫄곕옒: ${totalSales}嫄?);
      console.log(`   - ?됯퇏 ?좊ː?? ${avgTrust}??);
      console.log(`   - AI ?붿빟: ${aiSummary}`);

      return {
        success: true,
        reportId,
        aiSummary,
      };
    } catch (error: any) {
      console.error("??AI 二쇨컙 由ы룷???앹꽦 ?ㅽ뙣:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

/**
 * 二쇨컙 踰덊샇 怨꾩궛 ?ы띁
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

/**
 * ?섎룞 AI 由ы룷???앹꽦 (愿由ъ옄??
 */
export const generateManualReport = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "濡쒓렇?몄씠 ?꾩슂?⑸땲??");
    }

    console.log("?뵩 ?섎룞 AI 由ы룷???앹꽦 ?붿껌");

    // ?꾩옱 ?곗씠???섏쭛
    const usersSnap = await db.collection("users").get();
    const productsSnap = await db.collection("marketItems").get();

    let totalSales = 0;
    let trustSum = 0;
    let sellerCount = 0;

    usersSnap.forEach((doc) => {
      const data = doc.data();
      if (data.totalSales) {
        totalSales += data.totalSales;
        trustSum += data.trustScore || 50;
        sellerCount++;
      }
    });

    const avgTrust = sellerCount > 0 ? Math.round(trustSum / sellerCount) : 50;
    const totalProducts = productsSnap.size;

    // AI ?붿빟 ?앹꽦
    const prompt = `
YAGO VIBE ?ㅽ룷痢?留덉폆 ?꾪솴:
- ?꾩껜 ?곹뭹: ${totalProducts}媛?- 珥?嫄곕옒: ${totalSales}嫄?- ?쒖꽦 ?먮ℓ?? ${sellerCount}紐?- ?됯퇏 ?좊ː?? ${avgTrust}??
???곗씠?곕? ??臾몄옣?쇰줈 ?붿빟?댁＜?몄슂.
    `.trim();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "媛꾧껐???쒓뎅??鍮꾩쫰?덉뒪 由ы룷???묒꽦?? },
        { role: "user", content: prompt },
      ],
    });

    const aiSummary = response.choices[0].message.content?.trim() || "";

    return {
      success: true,
      totalSales,
      avgTrust,
      sellerCount,
      totalProducts,
      aiSummary,
    };
  } catch (error: any) {
    console.error("???섎룞 AI 由ы룷???앹꽦 ?ㅽ뙣:", error);
    throw error;
  }
});

