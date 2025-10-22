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
exports.checkin = exports.createCheckinNonce = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();
function assertAuth(ctx) {
    const uid = ctx.auth?.uid;
    if (!uid)
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
    return uid;
}
async function assertHost(ctx, eventId) {
    const uid = assertAuth(ctx);
    if (!eventId)
        throw new functions.https.HttpsError("invalid-argument", "eventId가 필요합니다.");
    const evRef = db.doc(`events/${eventId}`);
    const evSnap = await evRef.get();
    if (!evSnap.exists)
        throw new functions.https.HttpsError("not-found", "이벤트가 없습니다.");
    const ev = evSnap.data();
    if (ev.hostId !== uid)
        throw new functions.https.HttpsError("permission-denied", "호스트만 가능합니다.");
    return { evRef, ev, uid };
}
/** 1) 체크인 QR용 nonce 생성 (여러 참가자 공용, 만료시간 내 재사용) */
exports.createCheckinNonce = functions.region("us-central1").https.onCall(async (data, ctx) => {
    try {
        const { eventId, ttlSec = 2 * 60 * 60 } = data;
        await assertHost(ctx, eventId);
        const nonce = cryptoRandom();
        const expAt = admin.firestore.Timestamp.fromMillis(Date.now() + ttlSec * 1000);
        await db.doc(`checkinNonces/${nonce}`).set({
            eventId, expAt, createdAt: now(), createdBy: ctx.auth.uid,
        });
        return { ok: true, nonce, expAt: expAt.toMillis() };
    }
    catch (err) {
        console.error("[createCheckinNonce]", err);
        if (err instanceof functions.https.HttpsError)
            throw err;
        throw new functions.https.HttpsError("internal", err?.message ?? "createCheckinNonce failed");
    }
});
/** 2) 셀프 체크인 (참가자: QR로 열림) */
exports.checkin = functions.region("us-central1").https.onCall(async (data, ctx) => {
    try {
        const uid = assertAuth(ctx);
        const { eventId, nonce } = data;
        if (!eventId || !nonce)
            throw new functions.https.HttpsError("invalid-argument", "eventId, nonce가 필요합니다.");
        const nonceRef = db.doc(`checkinNonces/${nonce}`);
        const nonceSnap = await nonceRef.get();
        if (!nonceSnap.exists)
            throw new functions.https.HttpsError("not-found", "유효하지 않은 QR입니다.");
        const n = nonceSnap.data();
        if (n.eventId !== eventId)
            throw new functions.https.HttpsError("failed-precondition", "이 이벤트의 QR이 아닙니다.");
        if (n.expAt.toMillis() < Date.now())
            throw new functions.https.HttpsError("deadline-exceeded", "QR 유효시간이 지났습니다.");
        const evRef = db.doc(`events/${eventId}`);
        const atRef = evRef.collection("attendees").doc(uid);
        await db.runTransaction(async (tx) => {
            const [evSnap, atSnap] = await Promise.all([tx.get(evRef), tx.get(atRef)]);
            if (!evSnap.exists)
                throw new functions.https.HttpsError("not-found", "이벤트가 없습니다.");
            if (!atSnap.exists || atSnap.get("status") !== "joined") {
                throw new functions.https.HttpsError("permission-denied", "참가 확정된 사용자만 체크인할 수 있습니다.");
            }
            if (atSnap.get("checkedInAt")) {
                // 이미 체크인 된 경우
                return;
            }
            tx.update(atRef, { checkedInAt: now() });
            tx.set(evRef.collection("logs").doc(), { type: "checkin", uid, at: now() });
        });
        return { ok: true };
    }
    catch (err) {
        console.error("[checkin]", err);
        if (err instanceof functions.https.HttpsError)
            throw err;
        throw new functions.https.HttpsError("internal", err?.message ?? "checkin failed");
    }
});
/** 간단한 랜덤 문자열 생성 */
function cryptoRandom(len = 24) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let s = "";
    for (let i = 0; i < len; i++)
        s += chars[Math.floor(Math.random() * chars.length)];
    return s;
}
