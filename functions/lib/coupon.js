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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCoupon = exports.upsertCoupon = void 0;
exports.consumeCouponIfAny = consumeCouponIfAny;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();
async function assertStaff(eventId, uid) {
    if (!uid)
        throw new functions.https.HttpsError('unauthenticated', 'login');
    const role = await db.doc(`events/${eventId}/roles/${uid}`).get();
    if (!role.exists)
        throw new functions.https.HttpsError('permission-denied', 'staff only');
}
exports.upsertCoupon = functions.https.onCall(async (data, ctx) => {
    const { eventId, code, payload } = data;
    await assertStaff(eventId, ctx.auth?.uid);
    const CODE = String(code || '').trim().toUpperCase();
    if (!/^[A-Z0-9\-]{3,32}$/.test(CODE)) {
        throw new functions.https.HttpsError('invalid-argument', 'bad code');
    }
    const doc = {
        ...payload,
        usedCount: admin.firestore.FieldValue.increment(0),
        updatedAt: now(),
        createdAt: now(),
        createdBy: ctx.auth.uid
    };
    await db.doc(`events/${eventId}/coupons/${CODE}`).set(doc, { merge: true });
    return { ok: true };
});
exports.validateCoupon = functions.https.onCall(async (data, ctx) => {
    const { eventId, code, amount } = data;
    const uid = ctx.auth?.uid;
    if (!uid)
        throw new functions.https.HttpsError('unauthenticated', 'login');
    const snap = await db.doc(`events/${eventId}/coupons/${String(code || '').toUpperCase()}`).get();
    if (!snap.exists)
        throw new functions.https.HttpsError('not-found', '쿠폰 없음');
    const c = snap.data();
    if (!c.active)
        throw new functions.https.HttpsError('failed-precondition', '비활성 쿠폰');
    const nowMs = Date.now();
    if (c.startAt && c.startAt.toMillis() > nowMs) {
        throw new functions.https.HttpsError('failed-precondition', '아직 사용 불가');
    }
    if (c.endAt && c.endAt.toMillis() < nowMs) {
        throw new functions.https.HttpsError('failed-precondition', '만료됨');
    }
    if (c.minSpend && amount < c.minSpend) {
        throw new functions.https.HttpsError('failed-precondition', '최소 결제 금액 미달');
    }
    if (c.totalLimit && (c.usedCount || 0) >= c.totalLimit) {
        throw new functions.https.HttpsError('resource-exhausted', '조기 소진');
    }
    // per-user 사용 이력
    const used = await db.collection(`users/${uid}/coupon_uses`)
        .where('eventId', '==', eventId)
        .where('code', '==', snap.id)
        .get();
    if (c.perUserLimit && used.size >= c.perUserLimit) {
        throw new functions.https.HttpsError('resource-exhausted', '이미 사용함');
    }
    // 할인액 계산
    let discount = c.type === 'percent' ? Math.floor(amount * (c.value / 100)) : Math.floor(c.value);
    if (c.maxDiscount)
        discount = Math.min(discount, c.maxDiscount);
    discount = Math.max(0, Math.min(discount, amount));
    return {
        ok: true,
        code: snap.id,
        discount,
        payable: amount - discount,
        coupon: c
    };
});
// 결제 확정(confirmPayment) 시 사용량 반영(멱등)
async function consumeCouponIfAny(evId, orderId, uid) {
    const payRef = db.doc(`events/${evId}/payments/${orderId}`);
    const pay = (await payRef.get()).data();
    const code = pay?.couponCode;
    const discount = pay?.discount || 0;
    if (!code || !discount)
        return;
    const usedRef = db.collection(`users/${uid}/coupon_uses`).doc(`${evId}_${orderId}`);
    const exists = await usedRef.get();
    if (exists.exists)
        return; // 멱등
    await db.runTransaction(async (tx) => {
        tx.set(usedRef, { eventId: evId, orderId, code, discount, at: now() });
        tx.update(db.doc(`events/${evId}/coupons/${code}`), {
            usedCount: admin.firestore.FieldValue.increment(1)
        });
    });
}
