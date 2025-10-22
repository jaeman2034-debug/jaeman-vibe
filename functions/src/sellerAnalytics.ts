import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

// ?뱤 ?먮ℓ???듦퀎 ?먮룞 ?낅뜲?댄듃 (留ㅼ떆媛?
export const updateSellerAnalytics = functions.pubsub
  .schedule("every 1 hours")
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("?뱤 ?먮ℓ???듦퀎 ?먮룞 ?낅뜲?댄듃 ?쒖옉");

    try {
      const sellersSnap = await db.collection("sellers").get();
      console.log(`?뵇 ?먮ℓ???? ${sellersSnap.docs.length}紐?);

      for (const sellerDoc of sellersSnap.docs) {
        const sellerId = sellerDoc.id;
        console.log(`?뱢 ${sellerId} ?듦퀎 ?섏쭛 以?..`);

        // ?대떦 ?먮ℓ?먯쓽 紐⑤뱺 梨꾪똿諛?議고쉶
        const chatsSnap = await db
          .collection("chats")
          .where("sellerId", "==", sellerId)
          .get();

        let totalMessages = 0;
        let aiMessages = 0;
        let aiAssistantMessages = 0;
        let aiShopBotMessages = 0;
        let buyerMessages = 0;
        let sellerMessages = 0;
        let last24hMessages = 0;
        let last7daysMessages = 0;
        const hourlyDistribution: { [key: number]: number } = {};
        const keywordMap: { [key: string]: number } = {};

        const now = Date.now();
        const last24h = 24 * 60 * 60 * 1000;
        const last7days = 7 * 24 * 60 * 60 * 1000;

        // 媛?梨꾪똿諛⑹쓽 硫붿떆吏 ?섏쭛
        for (const chatDoc of chatsSnap.docs) {
          const chatId = chatDoc.id;
          const messagesSnap = await db
            .collection("chats")
            .doc(chatId)
            .collection("messages")
            .get();

          for (const msgDoc of messagesSnap.docs) {
            const data = msgDoc.data();
            totalMessages++;

            // 諛쒖떊?먮퀎 遺꾨쪟
            if (data.senderId === "AI_Assistant") {
              aiMessages++;
              aiAssistantMessages++;
            } else if (data.senderId === "AI_ShopBot") {
              aiMessages++;
              aiShopBotMessages++;
            } else if (data.senderId === sellerId) {
              sellerMessages++;
            } else {
              buyerMessages++;
            }

            // ?쒓컙?蹂?遺꾨쪟
            if (data.createdAt) {
              const timestamp = data.createdAt.toMillis ? data.createdAt.toMillis() : 0;
              const timeDiff = now - timestamp;

              if (timeDiff < last24h) {
                last24hMessages++;
              }

              if (timeDiff < last7days) {
                last7daysMessages++;
              }

              // ?쒓컙? 遺꾪룷 (0-23??
              const hour = new Date(timestamp).getHours();
              hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
            }

            // ?ㅼ썙??異붿텧 (援щℓ??硫붿떆吏留?
            if (data.senderId !== sellerId && 
                data.senderId !== "AI_Assistant" && 
                data.senderId !== "AI_ShopBot") {
              const text = data.text || "";
              const keywords = ["諛곗넚", "?ъ씠利?, "媛寃?, "?좎씤", "援먰솚", "?섎텋", "吏곴굅??, "?뺥뭹"];
              
              keywords.forEach(keyword => {
                if (text.includes(keyword)) {
                  keywordMap[keyword] = (keywordMap[keyword] || 0) + 1;
                }
              });
            }
          }
        }

        // AI ?묐떟瑜?怨꾩궛
        const aiResponseRate = buyerMessages > 0 
          ? Math.round((aiMessages / buyerMessages) * 100) 
          : 0;

        // ?됯퇏 ?묐떟 ?쒓컙 (?덉떆: 5珥덈줈 怨좎젙, ?ㅼ젣濡쒕뒗 timestamp 李⑥씠 怨꾩궛)
        const avgAIResponseTime = 5;

        // ?쒓컙?蹂??곗씠??蹂??        const hourlyData = Object.entries(hourlyDistribution).map(([hour, count]) => ({
          hour: `${hour}??,
          count: count
        }));

        // ?ㅼ썙??鍮덈룄 Top 5
        const topKeywords = Object.entries(keywordMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([keyword, count]) => ({ keyword, count }));

        // ?뱤 Firestore analytics 而щ젆?섏뿉 ???        await db.collection("analytics").doc(sellerId).set(
          {
            sellerId,
            totalMessages,
            aiMessages,
            aiAssistantMessages,
            aiShopBotMessages,
            buyerMessages,
            sellerMessages,
            aiResponseRate,
            last24hMessages,
            last7daysMessages,
            avgAIResponseTime,
            hourlyDistribution: hourlyData,
            topKeywords,
            chatRoomCount: chatsSnap.docs.length,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        console.log(`??${sellerId} ?듦퀎 ?낅뜲?댄듃 ?꾨즺:`, {
          totalMessages,
          aiMessages,
          aiResponseRate: `${aiResponseRate}%`
        });
      }

      console.log("?럦 紐⑤뱺 ?먮ℓ???듦퀎 ?낅뜲?댄듃 ?꾨즺!");
      return null;

    } catch (error) {
      console.error("???듦퀎 ?낅뜲?댄듃 ?ㅻ쪟:", error);
      return null;
    }
  });

// ?뱤 ?섎룞 ?듦퀎 媛깆떊 (利됱떆 ?ㅽ뻾)
export const refreshSellerAnalytics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "濡쒓렇?몄씠 ?꾩슂?⑸땲??);
  }

  const sellerId = context.auth.uid;
  console.log("?봽 ?섎룞 ?듦퀎 媛깆떊 ?붿껌:", sellerId);

  try {
    // ?꾩? ?숈씪??濡쒖쭅?쇰줈 利됱떆 媛깆떊
    const chatsSnap = await db
      .collection("chats")
      .where("sellerId", "==", sellerId)
      .get();

    let totalMessages = 0;
    let aiMessages = 0;
    let buyerMessages = 0;

    for (const chatDoc of chatsSnap.docs) {
      const messagesSnap = await db
        .collection("chats")
        .doc(chatDoc.id)
        .collection("messages")
        .get();

      messagesSnap.forEach((m) => {
        const data = m.data();
        totalMessages++;
        if (data.senderId === "AI_Assistant" || data.senderId === "AI_ShopBot") {
          aiMessages++;
        } else if (data.senderId !== sellerId) {
          buyerMessages++;
        }
      });
    }

    const aiResponseRate = buyerMessages > 0 
      ? Math.round((aiMessages / buyerMessages) * 100) 
      : 0;

    await db.collection("analytics").doc(sellerId).set(
      {
        sellerId,
        totalMessages,
        aiMessages,
        buyerMessages,
        aiResponseRate,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log("???섎룞 ?듦퀎 媛깆떊 ?꾨즺:", { sellerId, aiResponseRate: `${aiResponseRate}%` });

    return {
      success: true,
      sellerId,
      stats: {
        totalMessages,
        aiMessages,
        buyerMessages,
        aiResponseRate
      }
    };

  } catch (error: any) {
    console.error("???섎룞 ?듦퀎 媛깆떊 ?ㅻ쪟:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

