/**
 * ?뱟 YAGO VIBE ?붽컙 由ы룷???먮룞 吏묎퀎 (鍮꾪솢??怨④꺽)
 * 
 * ?뵶 ?꾩옱 ?곹깭: 鍮꾪솢??(蹂닿???
 * ???쒖꽦?? functions/src/index.ts?먯꽌 二쇱꽍 ?댁젣留??섎㈃ 利됱떆 ?묐룞
 * 
 * 留ㅻ떖 1???덈꼍 4???ㅽ뻾 ??daily_xxx 由ы룷?몃? 紐⑥븘 monthly_xxx ?앹꽦
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * ?붽컙 ?뺤궛 由ы룷???먮룞 吏묎퀎
 * Cloud Scheduler: 留ㅻ떖 1???덈꼍 4??(Asia/Seoul)
 * CRON: 0 4 1 * *
 */
export const aggregateMonthlyReport = functions
  .region("asia-northeast3") // ?쒖슱 由ъ쟾
  .pubsub.schedule("0 4 1 * *")
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    try {
      const now = new Date();
      
      // ?꾩썡 湲곗??쇰줈 吏묎퀎 (1?쇱뿉 ?ㅽ뻾?섎?濡??꾩썡 ?곗씠??吏묎퀎)
      now.setMonth(now.getMonth() - 1);
      const targetMonth = now.toISOString().slice(0, 7); // YYYY-MM
      
      console.log(`?뱠 [${targetMonth}] ?붽컙 由ы룷??吏묎퀎 ?쒖옉`);

      // ?대떦 ?붿쓽 紐⑤뱺 ?쇱씪 由ы룷??議고쉶
      const reportsSnap = await db.collection("reports").get();
      
      let totalPayout = 0;
      let totalCount = 0;
      let totalSellerCount = 0;
      const days: any[] = [];
      const sellerMap = new Map<string, { payout: number; count: number }>();

      reportsSnap.forEach((doc) => {
        const docId = doc.id;
        
        // daily_YYYY-MM-DD ?뺤떇 ?뺤씤
        if (docId.startsWith("daily_") && docId.includes(targetMonth)) {
          const data = doc.data();
          
          totalPayout += data.totalPayout || 0;
          totalCount += data.totalCount || 0;
          
          days.push({
            id: docId,
            date: data.date,
            totalPayout: data.totalPayout,
            totalCount: data.totalCount,
            sellerCount: data.sellerCount,
          });

          // ?먮ℓ?먮퀎 吏묎퀎
          if (data.detail && Array.isArray(data.detail)) {
            data.detail.forEach((item: any) => {
              if (sellerMap.has(item.sellerId)) {
                const current = sellerMap.get(item.sellerId)!;
                current.payout += item.payout;
                current.count += item.count;
              } else {
                sellerMap.set(item.sellerId, {
                  payout: item.payout,
                  count: item.count,
                });
              }
            });
          }
        }
      });

      if (days.length === 0) {
        console.log(`?벊 ${targetMonth}???대떦?섎뒗 ?쇱씪 由ы룷?멸? ?놁뒿?덈떎.`);
        return null;
      }

      // ?먮ℓ?먮퀎 ?곸꽭 諛곗뿴濡?蹂??      const topSellers = Array.from(sellerMap.entries())
        .map(([sellerId, data]) => ({
          sellerId,
          payout: data.payout,
          count: data.count,
        }))
        .sort((a, b) => b.payout - a.payout)
        .slice(0, 10); // Top 10

      totalSellerCount = sellerMap.size;

      // ?붽컙 由ы룷?????      await db
        .collection("reports")
        .doc(`monthly_${targetMonth}`)
        .set({
          month: targetMonth,
          totalPayout,
          totalCount,
          totalSellerCount,
          dayCount: days.length,
          days: days.sort((a, b) => a.date.localeCompare(b.date)),
          topSellers,
          executedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      console.log(`??[${targetMonth}] ?붽컙 由ы룷???앹꽦 ?꾨즺`);
      console.log(`   - 吏묎퀎 湲곌컙: ${days.length}??);
      console.log(`   - 珥??뺤궛 湲덉븸: ${totalPayout.toLocaleString()}??);
      console.log(`   - 珥??뺤궛 嫄댁닔: ${totalCount}嫄?);
      console.log(`   - ?쒖꽦 ?먮ℓ?? ${totalSellerCount}紐?);

      return {
        success: true,
        month: targetMonth,
        totalPayout,
        totalCount,
        dayCount: days.length,
      };
    } catch (error: any) {
      console.error("???붽컙 由ы룷??吏묎퀎 ?ㅽ뙣:", error);
      
      // ?먮윭 濡쒓렇 ???      await db.collection("settlementErrors").add({
        type: "monthly_report",
        error: error.message,
        stack: error.stack,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: false,
        error: error.message,
      };
    }
  });

/**
 * ?섎룞 ?붽컙 由ы룷???앹꽦 (愿由ъ옄??
 * ?뱀젙 ?붿쓽 ?붽컙 由ы룷?몃? ?섎룞?쇰줈 ?앹꽦
 */
export const generateMonthlyReport = functions.https.onCall(async (data, context) => {
  try {
    // 愿由ъ옄 沅뚰븳 ?뺤씤
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "濡쒓렇?몄씠 ?꾩슂?⑸땲??");
    }

    const { month } = data; // YYYY-MM ?뺤떇
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "?щ컮瑜????뺤떇???꾨떃?덈떎 (YYYY-MM)."
      );
    }

    console.log(`?뵩 [${month}] ?섎룞 ?붽컙 由ы룷???앹꽦 ?붿껌`);

    // ?대떦 ?붿쓽 ?쇱씪 由ы룷??議고쉶
    const reportsSnap = await db.collection("reports").get();
    
    let totalPayout = 0;
    let totalCount = 0;
    const days: any[] = [];
    const sellerMap = new Map<string, { payout: number; count: number }>();

    reportsSnap.forEach((doc) => {
      const docId = doc.id;
      
      if (docId.startsWith("daily_") && docId.includes(month)) {
        const data = doc.data();
        
        totalPayout += data.totalPayout || 0;
        totalCount += data.totalCount || 0;
        
        days.push({
          id: docId,
          date: data.date,
          totalPayout: data.totalPayout,
          totalCount: data.totalCount,
        });

        // ?먮ℓ?먮퀎 吏묎퀎
        if (data.detail && Array.isArray(data.detail)) {
          data.detail.forEach((item: any) => {
            if (sellerMap.has(item.sellerId)) {
              const current = sellerMap.get(item.sellerId)!;
              current.payout += item.payout;
              current.count += item.count;
            } else {
              sellerMap.set(item.sellerId, {
                payout: item.payout,
                count: item.count,
              });
            }
          });
        }
      }
    });

    if (days.length === 0) {
      return {
        success: false,
        message: `${month}???대떦?섎뒗 ?쇱씪 由ы룷?멸? ?놁뒿?덈떎.`,
      };
    }

    const topSellers = Array.from(sellerMap.entries())
      .map(([sellerId, data]) => ({ sellerId, ...data }))
      .sort((a, b) => b.payout - a.payout)
      .slice(0, 10);

    // ?붽컙 由ы룷?????    await db
      .collection("reports")
      .doc(`monthly_${month}`)
      .set({
        month,
        totalPayout,
        totalCount,
        totalSellerCount: sellerMap.size,
        dayCount: days.length,
        days: days.sort((a, b) => a.date.localeCompare(b.date)),
        topSellers,
        executedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log(`??[${month}] ?섎룞 ?붽컙 由ы룷???앹꽦 ?꾨즺`);

    return {
      success: true,
      message: `${month} ?붽컙 由ы룷?멸? ?앹꽦?섏뿀?듬땲??`,
      month,
      totalPayout,
      totalCount,
      dayCount: days.length,
    };
  } catch (error: any) {
    console.error("???섎룞 ?붽컙 由ы룷???앹꽦 ?ㅽ뙣:", error);
    throw error;
  }
});

/**
 * ?붽컙 由ы룷??議고쉶 (愿由ъ옄??
 */
export const getMonthlyReport = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "濡쒓렇?몄씠 ?꾩슂?⑸땲??");
    }

    const { month } = data; // YYYY-MM ?뺤떇
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const reportRef = db.collection("reports").doc(`monthly_${targetMonth}`);
    const reportSnap = await reportRef.get();

    if (!reportSnap.exists) {
      return {
        success: false,
        message: "?대떦 ?붿쓽 ?붽컙 由ы룷?멸? ?놁뒿?덈떎.",
        month: targetMonth,
      };
    }

    const report = reportSnap.data()!;

    return {
      success: true,
      month: targetMonth,
      ...report,
    };
  } catch (error: any) {
    console.error("???붽컙 由ы룷??議고쉶 ?ㅽ뙣:", error);
    throw error;
  }
});

