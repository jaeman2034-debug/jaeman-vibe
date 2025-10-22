/**
 * ?뮩 YAGO VIBE 寃곗젣 ?쒖뒪??(鍮꾪솢??怨④꺽)
 * 
 * ?뵶 ?꾩옱 ?곹깭: ?뚯뒪??紐⑤뱶
 * ???쒖꽦?? TOSS_SECRET???ㅽ궎濡?援먯껜留??섎㈃ 利됱떆 ?ㅺ굅???꾪솚
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

// ?섍꼍 蹂??(firebase functions:config:set?쇰줈 ?ㅼ젙)
const TOSS_SECRET = functions.config().toss?.secret || "sk_test_...";
const TOSS_CLIENT = functions.config().toss?.client || "test_ck_...";
const BASE_URL = functions.config().app?.base_url || "http://localhost:5173";

/**
 * ?섏닔猷?怨꾩궛 ?ы띁
 * @param amount 珥?寃곗젣 湲덉븸
 * @param feeRate ?섏닔猷뚯쑉 (湲곕낯 3%)
 */
function calcFee(amount: number, feeRate = 0.03) {
  const feeAmount = Math.round(amount * feeRate);
  const sellerPayout = amount - feeAmount;
  return { feeAmount, sellerPayout, feeRate };
}

/**
 * 1截뤴깵 寃곗젣 ?앹꽦
 * ?대씪?댁뼵?몄뿉???몄텧?섏뿬 寃곗젣瑜?珥덇린?뷀빀?덈떎.
 * 
 * @param productId ?곹뭹 ID
 * @param buyerId 援щℓ??UID
 * @returns paymentId, checkoutUrl
 */
export const createPayment = functions.https.onCall(async (data, context) => {
  try {
    // ?몄쬆 ?뺤씤
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "濡쒓렇?몄씠 ?꾩슂?⑸땲??");
    }

    const { productId, buyerId } = data;
    
    // ?뚮씪誘명꽣 寃利?    if (!productId || !buyerId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "productId? buyerId媛 ?꾩슂?⑸땲??"
      );
    }

    // ?곹뭹 議고쉶
    const prodRef = db.collection("products").doc(productId);
    const prodSnap = await prodRef.get();
    
    if (!prodSnap.exists) {
      throw new functions.https.HttpsError("not-found", "?곹뭹??李얠쓣 ???놁뒿?덈떎.");
    }

    const product = prodSnap.data()!;
    const amount = Number(product.price);
    const sellerId = product.sellerId;

    // ?먭린 ?먯떊???곹뭹? 援щℓ 遺덇?
    if (sellerId === buyerId) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "蹂몄씤???곹뭹? 援щℓ?????놁뒿?덈떎."
      );
    }

    // ?대? 寃곗젣???곹뭹?몄? ?뺤씤
    if (product.status === "paid" || product.status === "completed") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "?대? 嫄곕옒媛 ?꾨즺???곹뭹?낅땲??"
      );
    }

    // ?섏닔猷?怨꾩궛
    const { feeAmount, sellerPayout, feeRate } = calcFee(amount);

    // payments 臾몄꽌 ?앹꽦
    const paymentRef = db.collection("payments").doc();
    const tossOrderId = `order_${paymentRef.id}`;

    await paymentRef.set({
      productId,
      buyerId,
      sellerId,
      amount,
      feeRate,
      feeAmount,
      sellerPayout,
      status: "initiated",
      tossOrderId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`??Payment created: ${paymentRef.id} for product: ${productId}`);

    // Toss 寃곗젣 留곹겕 ?앹꽦 (?섏궗 肄붾뱶 - ?ㅼ젣 API ?붾뱶?ъ씤?몃뒗 Toss 臾몄꽌 李몄“)
    const successUrl = `${BASE_URL}/payments/success?paymentId=${paymentRef.id}`;
    const failUrl = `${BASE_URL}/payments/fail?paymentId=${paymentRef.id}`;

    // ?뵶 ?ㅼ젣 Toss API ?몄텧 (?꾩옱??怨④꺽留?
    // const fetch = (await import("node-fetch")).default;
    // const response = await fetch("https://api.tosspayments.com/v1/payments", {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Basic ${Buffer.from(`${TOSS_SECRET}:`).toString("base64")}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     amount,
    //     orderId: tossOrderId,
    //     orderName: product.title || "?곹뭹 寃곗젣",
    //     successUrl,
    //     failUrl,
    //   }),
    // });
    // const json = await response.json();

    // ?곹깭 pending ?꾪솚
    await paymentRef.update({
      status: "pending",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ?윟 ?뚯뒪??紐⑤뱶: 媛??URL 諛섑솚
    const mockCheckoutUrl = `${BASE_URL}/mock-checkout?paymentId=${paymentRef.id}`;

    return {
      paymentId: paymentRef.id,
      checkoutUrl: mockCheckoutUrl, // ?ㅼ젣: json.checkoutUrl
      message: "?뵶 ?뚯뒪??紐⑤뱶 - ?ㅼ젣 Toss API ?곕룞 ?꾩슂",
    };
  } catch (error: any) {
    console.error("??createPayment error:", error);
    throw error;
  }
});

/**
 * 2截뤴깵 Toss Webhook
 * Toss?먯꽌 寃곗젣 ?곹깭 蹂寃????몄텧?섎뒗 ?붾뱶?ъ씤?? * 
 * POST https://<region>-<project>.cloudfunctions.net/tossWebhook
 */
export const tossWebhook = functions.https.onRequest(async (req, res) => {
  try {
    console.log("?벂 Webhook received:", req.method, req.body);

    // POST ?붿껌留?泥섎━
    if (req.method !== "POST") {
      res.status(405).send({ ok: false, error: "Method not allowed" });
      return;
    }

    // ?뵍 ?쒕챸 寃利?(?ㅼ젣 援ы쁽 ?꾩슂)
    // const signature = req.headers["x-toss-signature"];
    // if (!verifySignature(req.body, signature)) {
    //   throw new Error("Invalid signature");
    // }

    const event = req.body;
    const { orderId, paymentKey, status, totalAmount } = event.data || {};

    if (!orderId) {
      throw new Error("orderId媛 ?놁뒿?덈떎.");
    }

    // Idempotency 諛⑹? (?좏깮)
    const eventId = event.eventId || `${Date.now()}_${Math.random()}`;
    const logRef = db.collection("webhookEvents").doc(eventId);
    
    const logSnap = await logRef.get();
    if (logSnap.exists) {
      console.log("?좑툘 Duplicate webhook event:", eventId);
      res.status(200).send({ ok: true, message: "Already processed" });
      return;
    }

    await logRef.set({
      type: event.eventType || "unknown",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      processed: true,
    });

    // payments 臾몄꽌 議고쉶
    const paymentSnap = await db
      .collection("payments")
      .where("tossOrderId", "==", orderId)
      .limit(1)
      .get();

    if (paymentSnap.empty) {
      throw new Error(`Payment not found for orderId: ${orderId}`);
    }

    const paymentRef = paymentSnap.docs[0].ref;
    const payment = paymentSnap.docs[0].data();

    // 寃곗젣 ?꾨즺
    if (status === "DONE" || status === "paid" || event.eventType === "PAYMENT_STATUS_CHANGED") {
      console.log(`??Payment completed: ${paymentRef.id}`);

      await paymentRef.update({
        status: "paid",
        tossPaymentKey: paymentKey || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ?뺤궛 ?덉퐫???앹꽦
      await db.collection("settlements").add({
        paymentId: paymentRef.id,
        sellerId: payment.sellerId,
        sellerPayout: payment.sellerPayout,
        status: "ready",
        scheduledAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ?곹뭹 ?곹깭 ?낅뜲?댄듃
      await db.collection("products").doc(payment.productId).update({
        status: "paid",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // ?뵒 ?먮ℓ?먯뿉寃??몄떆 ?뚮┝ (?좏깮)
      // sendPaymentNotification(payment.sellerId, "寃곗젣媛 ?꾨즺?섏뿀?듬땲??");
    }

    // 寃곗젣 ?ㅽ뙣/痍⑥냼
    if (status === "CANCELED" || status === "FAILED") {
      console.log(`??Payment ${status}: ${paymentRef.id}`);
      
      await paymentRef.update({
        status: status === "CANCELED" ? "canceled" : "failed",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.status(200).send({ ok: true });
  } catch (error: any) {
    console.error("??Webhook error:", error);
    res.status(400).send({ ok: false, error: error.message });
  }
});

/**
 * 3截뤴깵 ?섎텋 泥섎━
 * 愿由ъ옄媛 ?몄텧?섏뿬 寃곗젣瑜??섎텋?⑸땲??
 * 
 * @param paymentId 寃곗젣 ID
 * @param amount ?섎텋 湲덉븸 (?좏깮, 湲곕낯媛믪? ?꾩븸)
 * @param reason ?섎텋 ?ъ쑀
 */
export const refundPayment = functions.https.onCall(async (data, context) => {
  try {
    // 愿由ъ옄 沅뚰븳 ?뺤씤 (?ㅼ젣 援ы쁽 ?꾩슂)
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "濡쒓렇?몄씠 ?꾩슂?⑸땲??");
    }

    // ?뵶 愿由ъ옄 沅뚰븳 泥댄겕 濡쒖쭅 異붽? 沅뚯옣
    // if (!context.auth.token.admin) {
    //   throw new functions.https.HttpsError("permission-denied", "愿由ъ옄留??섎텋?????덉뒿?덈떎.");
    // }

    const { paymentId, amount, reason } = data;

    // payments 臾몄꽌 議고쉶
    const snap = await db.collection("payments").doc(paymentId).get();
    
    if (!snap.exists) {
      throw new functions.https.HttpsError("not-found", "寃곗젣 ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎.");
    }

    const payment = snap.data()!;

    if (payment.status !== "paid") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "寃곗젣 ?꾨즺 ?곹깭媛 ?꾨떃?덈떎."
      );
    }

    const refundAmount = amount || payment.amount;

    // ?뵶 ?ㅼ젣 Toss ?섎텋 API ?몄텧 (怨④꺽留?
    // const fetch = (await import("node-fetch")).default;
    // const response = await fetch(
    //   `https://api.tosspayments.com/v1/payments/${payment.tossPaymentKey}/cancel`,
    //   {
    //     method: "POST",
    //     headers: {
    //       Authorization: `Basic ${Buffer.from(`${TOSS_SECRET}:`).toString("base64")}`,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       cancelReason: reason || "愿由ъ옄 ?섎텋",
    //       cancelAmount: refundAmount,
    //     }),
    //   }
    // );
    // const json = await response.json();

    console.log(`?봽 Refund initiated: ${paymentId}, amount: ${refundAmount}`);

    // payments 臾몄꽌 ?낅뜲?댄듃
    await snap.ref.update({
      status: "refunded",
      cancelReason: reason || "愿由ъ옄 ?섎텋",
      refundedAmount: refundAmount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // settlements 痍⑥냼
    const settlementSnap = await db
      .collection("settlements")
      .where("paymentId", "==", paymentId)
      .limit(1)
      .get();

    if (!settlementSnap.empty) {
      await settlementSnap.docs[0].ref.update({
        status: "canceled",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // ?곹뭹 ?곹깭 蹂듭썝
    await db.collection("products").doc(payment.productId).update({
      status: "active",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ?뵒 援щℓ?먯뿉寃??섎텋 ?꾨즺 ?뚮┝ (?좏깮)
    // sendPaymentNotification(payment.buyerId, "?섎텋???꾨즺?섏뿀?듬땲??");

    return {
      ok: true,
      message: "?섎텋???꾨즺?섏뿀?듬땲??",
      refundAmount,
    };
  } catch (error: any) {
    console.error("??refundPayment error:", error);
    throw error;
  }
});

/**
 * 4截뤴깵 寃곗젣 ?곹깭 議고쉶
 * ?대씪?댁뼵?몄뿉??寃곗젣 ?곹깭瑜??뺤씤?⑸땲??
 * 
 * @param paymentId 寃곗젣 ID
 */
export const getPaymentStatus = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "濡쒓렇?몄씠 ?꾩슂?⑸땲??");
    }

    const { paymentId } = data;
    const snap = await db.collection("payments").doc(paymentId).get();

    if (!snap.exists) {
      throw new functions.https.HttpsError("not-found", "寃곗젣 ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎.");
    }

    const payment = snap.data()!;

    // 沅뚰븳 ?뺤씤 (援щℓ???먮뒗 ?먮ℓ?먮쭔 議고쉶 媛??
    if (
      payment.buyerId !== context.auth.uid &&
      payment.sellerId !== context.auth.uid
    ) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "沅뚰븳???놁뒿?덈떎."
      );
    }

    return {
      paymentId: snap.id,
      ...payment,
    };
  } catch (error: any) {
    console.error("??getPaymentStatus error:", error);
    throw error;
  }
});

