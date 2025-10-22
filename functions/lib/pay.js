"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refundPayment = exports.confirmPayment = exports.createPaymentIntent = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const fcm_1 = require("./fcm");
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();
const SECRET = process.env.TOSS_SECRET_KEY; // "test_sk_xxx"
const BASE = 'https://api.tosspayments.com/v1';
function basicAuth() { return 'Basic ' + Buffer.from(`${SECRET}:`).toString('base64'); }
exports.createPaymentIntent = functions.https.onCall(async (data, ctx) => {
    const { eventId, amount, orderName, couponCode, bizName, bizRegNo } = data;
    if (!ctx.auth)
        throw new functions.https.HttpsError('unauthenticated', 'login');
    if (!eventId || !amount)
        throw new functions.https.HttpsError('invalid-argument', 'bad args');
    let discount = 0, code;
    // 쿠폰 검증 및 할인액 계산
    if (couponCode) {
        const cdoc = await db.doc(`events/${eventId}/coupons/${String(couponCode).toUpperCase()}`).get();
        if (cdoc.exists) {
            const c = cdoc.data();
            let dc = c.type === 'percent' ? Math.floor(amount * (c.value / 100)) : Math.floor(c.value);
            if (c.maxDiscount)
                dc = Math.min(dc, c.maxDiscount);
            discount = Math.max(0, Math.min(dc, amount));
            code = cdoc.id;
        }
    }
    const orderId = `ev_${eventId}_${Date.now()}`;
    const paymentData = {
        uid: ctx.auth.uid,
        amount,
        status: 'pending',
        orderName,
        createdAt: now(),
        discount,
        couponCode: code || null
    };
    // 영수증 정보 추가
    if (bizName || bizRegNo) {
        paymentData.invoice = {
            bizName: bizName || null,
            bizRegNo: bizRegNo || null
        };
    }
    await db.doc(`events/${eventId}/payments/${orderId}`).set(paymentData);
    return { orderId, payable: amount - discount, discount };
});
exports.confirmPayment = functions.https.onCall(async (data, ctx) => {
    const { paymentKey, orderId, amount, eventId } = data;
    if (!paymentKey || !orderId || !amount || !eventId)
        throw new functions.https.HttpsError('invalid-argument', 'bad args');
    // 멱등 처리: 이미 paid면 조용히 반환
    const ref = db.doc(`events/${eventId}/payments/${orderId}`);
    const cur = await ref.get();
    if (cur.exists && cur.data().status === 'paid') {
        return { ok: true, idempotent: true };
    }
    // 1) Toss confirm
    const res = await (0, node_fetch_1.default)(`${BASE}/payments/confirm`, {
        method: 'POST',
        headers: { 'Authorization': basicAuth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey, orderId, amount })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'confirm failed' }));
        throw new functions.https.HttpsError('failed-precondition', err.message || 'confirm failed');
    }
    const pay = await res.json();
    // 2) 기록 및 참가 처리
    const m = orderId.split('_');
    const eventIdFromOrder = m[1];
    const paymentRef = db.doc(`events/${eventIdFromOrder}/payments/${orderId}`);
    let uid;
    await db.runTransaction(async (tx) => {
        tx.set(paymentRef, {
            paymentKey, amount, status: 'paid', method: pay.method, approvedAt: now(), raw: { mid: pay.merchantId }
        }, { merge: true });
        // 참가자 문서 보장(없으면 생성)
        uid = (await paymentRef.get()).data()?.uid || (ctx.auth?.uid ?? 'unknown');
        tx.set(db.doc(`events/${eventIdFromOrder}/attendees/${uid}`), { joinedAt: now() }, { merge: true });
        tx.create(db.collection(`events/${eventIdFromOrder}/logs`).doc(), {
            action: 'payment.confirm', actorId: uid, at: now(), meta: { orderId, amount }
        });
    });
    // 3) 쿠폰 소비 기록 (멱등)
    try {
        const { consumeCouponIfAny } = await Promise.resolve().then(() => __importStar(require('./coupon')));
        await consumeCouponIfAny(eventId, orderId, uid);
    }
    catch (e) {
        console.error('쿠폰 소비 기록 실패:', e);
    }
    // 4) 지갑 사용 처리 (멱등)
    try {
        const { markWalletUsed } = await Promise.resolve().then(() => __importStar(require('./coupon_wallet')));
        await markWalletUsed(eventId, orderId, uid);
    }
    catch (e) {
        console.error('지갑 사용 처리 실패:', e);
    }
    // 4) 결제 완료 푸시 알림
    try {
        // 개별 발송
        await (0, fcm_1.sendToUser)(uid, {
            title: '결제가 완료되었습니다',
            body: `${orderId} · ${amount.toLocaleString()}원`
        }, {
            type: 'payment.confirm',
            eventId,
            orderId
        });
        // 토픽 발송 (참가자들에게 새 결제자 알림)
        await (0, fcm_1.sendToTopic)((0, fcm_1.topic)(eventId, 'attendee'), {
            title: '참가 확정 알림',
            body: '결제 완료된 참가자가 있습니다.'
        }, {
            type: 'payment.new',
            eventId
        });
    }
    catch (error) {
        console.error('결제 완료 푸시 발송 실패:', error);
    }
    return { ok: true };
});
exports.refundPayment = functions.https.onCall(async (data, ctx) => {
    const { eventId, orderId, reason } = data;
    // 스태프만
    if (!ctx.auth)
        throw new functions.https.HttpsError('unauthenticated', 'login');
    const role = await db.doc(`events/${eventId}/roles/${ctx.auth.uid}`).get();
    if (!role.exists)
        throw new functions.https.HttpsError('permission-denied', 'staff only');
    const ref = db.doc(`events/${eventId}/payments/${orderId}`);
    const snap = await ref.get();
    if (!snap.exists)
        throw new functions.https.HttpsError('not-found', 'order');
    const paymentKey = snap.data().paymentKey;
    if (!paymentKey)
        throw new functions.https.HttpsError('failed-precondition', 'not paid');
    const res = await (0, node_fetch_1.default)(`${BASE}/payments/${paymentKey}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': basicAuth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelReason: reason || 'admin refund' })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'refund failed' }));
        throw new functions.https.HttpsError('failed-precondition', err.message || 'refund failed');
    }
    await ref.set({ status: 'canceled', canceledAt: now() }, { merge: true });
    await db.collection(`events/${eventId}/logs`).add({ action: 'payment.refund', actorId: ctx.auth.uid, at: now(), meta: { orderId } });
    return { ok: true };
});
