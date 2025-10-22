/**
 * 💳 YAGO VIBE 결제 시스템 (비활성 골격)
 *
 * 🔴 현재 상태: 테스트 모드
 * ⚡ 활성화: TOSS_SECRET을 실키로 교체만 하면 즉시 실거래 전환
 */
var _a, _b, _c;
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const db = admin.firestore();
// 환경 변수 (firebase functions:config:set으로 설정)
const TOSS_SECRET = ((_a = functions.config().toss) === null || _a === void 0 ? void 0 : _a.secret) || "sk_test_...";
const TOSS_CLIENT = ((_b = functions.config().toss) === null || _b === void 0 ? void 0 : _b.client) || "test_ck_...";
const BASE_URL = ((_c = functions.config().app) === null || _c === void 0 ? void 0 : _c.base_url) || "http://localhost:5173";
/**
 * 수수료 계산 헬퍼
 * @param amount 총 결제 금액
 * @param feeRate 수수료율 (기본 3%)
 */
function calcFee(amount, feeRate = 0.03) {
    const feeAmount = Math.round(amount * feeRate);
    const sellerPayout = amount - feeAmount;
    return { feeAmount, sellerPayout, feeRate };
}
/**
 * 1️⃣ 결제 생성
 * 클라이언트에서 호출하여 결제를 초기화합니다.
 *
 * @param productId 상품 ID
 * @param buyerId 구매자 UID
 * @returns paymentId, checkoutUrl
 */
export const createPayment = functions.https.onCall(async (data, context) => {
    try {
        // 인증 확인
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
        }
        const { productId, buyerId } = data;
        // 파라미터 검증
        if (!productId || !buyerId) {
            throw new functions.https.HttpsError("invalid-argument", "productId와 buyerId가 필요합니다.");
        }
        // 상품 조회
        const prodRef = db.collection("products").doc(productId);
        const prodSnap = await prodRef.get();
        if (!prodSnap.exists) {
            throw new functions.https.HttpsError("not-found", "상품을 찾을 수 없습니다.");
        }
        const product = prodSnap.data();
        const amount = Number(product.price);
        const sellerId = product.sellerId;
        // 자기 자신의 상품은 구매 불가
        if (sellerId === buyerId) {
            throw new functions.https.HttpsError("failed-precondition", "본인의 상품은 구매할 수 없습니다.");
        }
        // 이미 결제된 상품인지 확인
        if (product.status === "paid" || product.status === "completed") {
            throw new functions.https.HttpsError("failed-precondition", "이미 거래가 완료된 상품입니다.");
        }
        // 수수료 계산
        const { feeAmount, sellerPayout, feeRate } = calcFee(amount);
        // payments 문서 생성
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
        console.log(`✅ Payment created: ${paymentRef.id} for product: ${productId}`);
        // Toss 결제 링크 생성 (의사 코드 - 실제 API 엔드포인트는 Toss 문서 참조)
        const successUrl = `${BASE_URL}/payments/success?paymentId=${paymentRef.id}`;
        const failUrl = `${BASE_URL}/payments/fail?paymentId=${paymentRef.id}`;
        // 🔴 실제 Toss API 호출 (현재는 골격만)
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
        //     orderName: product.title || "상품 결제",
        //     successUrl,
        //     failUrl,
        //   }),
        // });
        // const json = await response.json();
        // 상태 pending 전환
        await paymentRef.update({
            status: "pending",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // 🟢 테스트 모드: 가상 URL 반환
        const mockCheckoutUrl = `${BASE_URL}/mock-checkout?paymentId=${paymentRef.id}`;
        return {
            paymentId: paymentRef.id,
            checkoutUrl: mockCheckoutUrl, // 실제: json.checkoutUrl
            message: "🔴 테스트 모드 - 실제 Toss API 연동 필요",
        };
    }
    catch (error) {
        console.error("❌ createPayment error:", error);
        throw error;
    }
});
/**
 * 2️⃣ Toss Webhook
 * Toss에서 결제 상태 변경 시 호출하는 엔드포인트
 *
 * POST https://<region>-<project>.cloudfunctions.net/tossWebhook
 */
export const tossWebhook = functions.https.onRequest(async (req, res) => {
    try {
        console.log("📨 Webhook received:", req.method, req.body);
        // POST 요청만 처리
        if (req.method !== "POST") {
            res.status(405).send({ ok: false, error: "Method not allowed" });
            return;
        }
        // 🔐 서명 검증 (실제 구현 필요)
        // const signature = req.headers["x-toss-signature"];
        // if (!verifySignature(req.body, signature)) {
        //   throw new Error("Invalid signature");
        // }
        const event = req.body;
        const { orderId, paymentKey, status, totalAmount } = event.data || {};
        if (!orderId) {
            throw new Error("orderId가 없습니다.");
        }
        // Idempotency 방지 (선택)
        const eventId = event.eventId || `${Date.now()}_${Math.random()}`;
        const logRef = db.collection("webhookEvents").doc(eventId);
        const logSnap = await logRef.get();
        if (logSnap.exists) {
            console.log("⚠️ Duplicate webhook event:", eventId);
            res.status(200).send({ ok: true, message: "Already processed" });
            return;
        }
        await logRef.set({
            type: event.eventType || "unknown",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            processed: true,
        });
        // payments 문서 조회
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
        // 결제 완료
        if (status === "DONE" || status === "paid" || event.eventType === "PAYMENT_STATUS_CHANGED") {
            console.log(`✅ Payment completed: ${paymentRef.id}`);
            await paymentRef.update({
                status: "paid",
                tossPaymentKey: paymentKey || null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // 정산 레코드 생성
            await db.collection("settlements").add({
                paymentId: paymentRef.id,
                sellerId: payment.sellerId,
                sellerPayout: payment.sellerPayout,
                status: "ready",
                scheduledAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // 상품 상태 업데이트
            await db.collection("products").doc(payment.productId).update({
                status: "paid",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // 🔔 판매자에게 푸시 알림 (선택)
            // sendPaymentNotification(payment.sellerId, "결제가 완료되었습니다!");
        }
        // 결제 실패/취소
        if (status === "CANCELED" || status === "FAILED") {
            console.log(`❌ Payment ${status}: ${paymentRef.id}`);
            await paymentRef.update({
                status: status === "CANCELED" ? "canceled" : "failed",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        res.status(200).send({ ok: true });
    }
    catch (error) {
        console.error("❌ Webhook error:", error);
        res.status(400).send({ ok: false, error: error.message });
    }
});
/**
 * 3️⃣ 환불 처리
 * 관리자가 호출하여 결제를 환불합니다.
 *
 * @param paymentId 결제 ID
 * @param amount 환불 금액 (선택, 기본값은 전액)
 * @param reason 환불 사유
 */
export const refundPayment = functions.https.onCall(async (data, context) => {
    try {
        // 관리자 권한 확인 (실제 구현 필요)
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
        }
        // 🔴 관리자 권한 체크 로직 추가 권장
        // if (!context.auth.token.admin) {
        //   throw new functions.https.HttpsError("permission-denied", "관리자만 환불할 수 있습니다.");
        // }
        const { paymentId, amount, reason } = data;
        // payments 문서 조회
        const snap = await db.collection("payments").doc(paymentId).get();
        if (!snap.exists) {
            throw new functions.https.HttpsError("not-found", "결제 정보를 찾을 수 없습니다.");
        }
        const payment = snap.data();
        if (payment.status !== "paid") {
            throw new functions.https.HttpsError("failed-precondition", "결제 완료 상태가 아닙니다.");
        }
        const refundAmount = amount || payment.amount;
        // 🔴 실제 Toss 환불 API 호출 (골격만)
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
        //       cancelReason: reason || "관리자 환불",
        //       cancelAmount: refundAmount,
        //     }),
        //   }
        // );
        // const json = await response.json();
        console.log(`🔄 Refund initiated: ${paymentId}, amount: ${refundAmount}`);
        // payments 문서 업데이트
        await snap.ref.update({
            status: "refunded",
            cancelReason: reason || "관리자 환불",
            refundedAmount: refundAmount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // settlements 취소
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
        // 상품 상태 복원
        await db.collection("products").doc(payment.productId).update({
            status: "active",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // 🔔 구매자에게 환불 완료 알림 (선택)
        // sendPaymentNotification(payment.buyerId, "환불이 완료되었습니다.");
        return {
            ok: true,
            message: "환불이 완료되었습니다.",
            refundAmount,
        };
    }
    catch (error) {
        console.error("❌ refundPayment error:", error);
        throw error;
    }
});
/**
 * 4️⃣ 결제 상태 조회
 * 클라이언트에서 결제 상태를 확인합니다.
 *
 * @param paymentId 결제 ID
 */
export const getPaymentStatus = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
        }
        const { paymentId } = data;
        const snap = await db.collection("payments").doc(paymentId).get();
        if (!snap.exists) {
            throw new functions.https.HttpsError("not-found", "결제 정보를 찾을 수 없습니다.");
        }
        const payment = snap.data();
        // 권한 확인 (구매자 또는 판매자만 조회 가능)
        if (payment.buyerId !== context.auth.uid &&
            payment.sellerId !== context.auth.uid) {
            throw new functions.https.HttpsError("permission-denied", "권한이 없습니다.");
        }
        return {
            paymentId: snap.id,
            ...payment,
        };
    }
    catch (error) {
        console.error("❌ getPaymentStatus error:", error);
        throw error;
    }
});
//# sourceMappingURL=payments.js.map