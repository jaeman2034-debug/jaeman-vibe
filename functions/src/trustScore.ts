/**
 * ?쭬 YAGO VIBE ?먮ℓ???좊ː???먮룞 ?됯? ?쒖뒪?? * 
 * 嫄곕옒 ?꾨즺 ???먮룞?쇰줈 ?먮ℓ?먯쓽 ?좊ː?꾨? 怨꾩궛?섏뿬 ?낅뜲?댄듃?⑸땲??
 * ?좊ː??= (?됯퇏 ?됱젏 횞 20) + (嫄곕옒 ?잛닔 횞 2) + (李??곹뼢??
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * 嫄곕옒 ?꾨즺 ???먮ℓ???좊ː???먮룞 媛깆떊
 * marketItems??status媛 "completed"濡?蹂寃쎈릺硫??몃━嫄? */
export const updateTrustScore = functions.firestore
  .document("marketItems/{itemId}")
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      const { itemId } = context.params;

      // 嫄곕옒媛 ?꾨즺濡?諛붾?寃쎌슦留??묐룞
      if (before.status !== "completed" && after.status === "completed") {
        const sellerId = after.sellerUid || after.sellerId;
        
        if (!sellerId) {
          console.warn("?좑툘 sellerId媛 ?놁뒿?덈떎:", itemId);
          return null;
        }

        console.log(`?뱤 [${sellerId}] ?좊ː??媛깆떊 ?쒖옉`);

        const sellerRef = db.collection("users").doc(sellerId);
        const sellerSnap = await sellerRef.get();
        const sellerData = sellerSnap.exists() ? sellerSnap.data()! : {};

        // 嫄곕옒 ?듦퀎 怨꾩궛
        const totalSales = (sellerData.totalSales || 0) + 1;
        const completedTransactions = (sellerData.completedTransactions || 0) + 1;
        const avgRating = sellerData.avgRating || 4.5; // 湲곕낯 ?됱젏
        
        // 李??곹뼢??(理쒕? 30??
        const likesImpact = Math.min(after.likeCount || 0, 30);
        
        // ?좊ː??怨꾩궛 (0-100??
        // = (?됯퇏 ?됱젏 횞 20) + (嫄곕옒 ?잛닔 횞 2) + (李?媛쒖닔, 理쒕? 30)
        const trustScore = Math.min(
          Math.round(avgRating * 20 + totalSales * 2 + likesImpact),
          100
        );

        // ?먮ℓ???뺣낫 ?낅뜲?댄듃
        await sellerRef.set(
          {
            totalSales,
            completedTransactions,
            avgRating,
            trustScore,
            lastActive: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        console.log(`??[${sellerId}] ?좊ː??媛깆떊 ?꾨즺:`);
        console.log(`   - 珥?嫄곕옒: ${totalSales}嫄?);
        console.log(`   - ?됯퇏 ?됱젏: ${avgRating}`);
        console.log(`   - ?좊ː?? ${trustScore}??);

        return { success: true, sellerId, trustScore };
      }

      return null;
    } catch (error: any) {
      console.error("???좊ː??媛깆떊 ?ㅽ뙣:", error);
      return null;
    }
  });

/**
 * ?먮ℓ???좊ː??議고쉶 (?대씪?댁뼵?몄뿉???몄텧)
 */
export const getSellerTrustScore = functions.https.onCall(async (data, context) => {
  try {
    const { sellerId } = data;
    
    if (!sellerId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "sellerId媛 ?꾩슂?⑸땲??"
      );
    }

    const sellerRef = db.collection("users").doc(sellerId);
    const sellerSnap = await sellerRef.get();

    if (!sellerSnap.exists()) {
      return {
        success: false,
        message: "?먮ℓ???뺣낫瑜?李얠쓣 ???놁뒿?덈떎.",
        defaultData: {
          trustScore: 50,
          totalSales: 0,
          avgRating: 0,
          completedTransactions: 0,
        },
      };
    }

    const sellerData = sellerSnap.data()!;

    return {
      success: true,
      sellerId,
      trustScore: sellerData.trustScore || 50,
      totalSales: sellerData.totalSales || 0,
      avgRating: sellerData.avgRating || 0,
      completedTransactions: sellerData.completedTransactions || 0,
      lastActive: sellerData.lastActive,
    };
  } catch (error: any) {
    console.error("???먮ℓ???좊ː??議고쉶 ?ㅽ뙣:", error);
    throw error;
  }
});

/**
 * ?곸쐞 ?좊ː???먮ℓ??議고쉶 (愿由ъ옄??
 */
export const getTopSellers = functions.https.onCall(async (data, context) => {
  try {
    const { limit = 10 } = data;

    const sellersSnap = await db
      .collection("users")
      .where("trustScore", ">", 0)
      .orderBy("trustScore", "desc")
      .limit(limit)
      .get();

    const topSellers = sellersSnap.docs.map((doc) => ({
      sellerId: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      topSellers,
      count: topSellers.length,
    };
  } catch (error: any) {
    console.error("???곸쐞 ?먮ℓ??議고쉶 ?ㅽ뙣:", error);
    throw error;
  }
});

