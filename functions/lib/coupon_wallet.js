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
exports.claimCoupon = void 0;
exports.markWalletUsed = markWalletUsed;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();
exports.claimCoupon = functions.https.onCall(async (data, ctx) => {
    const { eventId, code } = data;
    const uid = ctx.auth?.uid;
    if (!uid)
        throw new functions.https.HttpsError('unauthenticated', 'login');
    const ref = db.doc(`events/${eventId}/coupons/${String(code).toUpperCase()}`);
    await db.runTransaction(async (tx) => {
        const c = await tx.get(ref);
        if (!c.exists)
            throw new functions.https.HttpsError('not-found', '쿠폰 없음');
        const cu = c.data();
        if (!cu.active)
            throw new functions.https.HttpsError('failed-precondition', '비활성');
        // per-user 선점 중복 방지
        const wRef = db.doc(`users/${uid}/wallet_coupons/${c.id}`);
        const w = await tx.get(wRef);
        if (w.exists)
            return; // 이미 지갑에 있음(멱등)
        tx.set(wRef, { eventId, claimedAt: now(), status: 'claimed' });
    });
    return { ok: true };
});
// 결제 확정(confirmPayment) 이후 호출해 사용 처리(멱등)
async function markWalletUsed(eventId, orderId, uid) {
    const pay = (await db.doc(`events/${eventId}/payments/${orderId}`).get()).data();
    const code = pay?.couponCode;
    if (!code)
        return;
    const wRef = db.doc(`users/${uid}/wallet_coupons/${code}`);
    await wRef.set({ usedAt: now(), status: 'used' }, { merge: true });
}
