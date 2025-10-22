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
exports.leaveEvent = exports.joinEvent = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
// Admin SDK 초기화 (이미 초기화되어 있으면 무시)
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
// 공용 유틸
function now() { return admin.firestore.FieldValue.serverTimestamp(); }
exports.joinEvent = functions
    .region("us-central1")
    .https.onCall(async (data, ctx) => {
    try {
        const uid = ctx.auth?.uid;
        if (!uid)
            throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
        const { eventId } = data;
        if (!eventId)
            throw new functions.https.HttpsError("invalid-argument", "eventId가 필요합니다.");
        console.log("[joinEvent-mini] 시작:", { uid, eventId });
        const evRef = db.doc(`events/${eventId}`);
        const atRef = evRef.collection("attendees").doc(uid);
        await db.runTransaction(async (tx) => {
            const evSnap = await tx.get(evRef);
            if (!evSnap.exists)
                throw new functions.https.HttpsError("not-found", "이벤트 없음");
            // 이미 참가면 패스
            const atSnap = await tx.get(atRef);
            if (atSnap.exists && atSnap.get("status") === "joined") {
                console.log("[joinEvent-mini] 이미 참가 중");
                return;
            }
            // 최소 성공 경로: 참가 + 카운트 + 타임스탬프
            tx.set(atRef, {
                status: "joined",
                joinedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            tx.update(evRef, {
                attendeeCount: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log("[joinEvent-mini] 참가 완료");
        });
        return { ok: true, joined: true };
    }
    catch (err) {
        console.error("[joinEvent-mini] error:", err);
        if (err instanceof functions.https.HttpsError)
            throw err;
        throw new functions.https.HttpsError("internal", err?.message ?? "join failed");
    }
});
exports.leaveEvent = functions
    .region("us-central1")
    .https.onCall(async (data, ctx) => {
    try {
        const uid = ctx.auth?.uid;
        if (!uid)
            throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
        const { eventId } = data;
        if (!eventId)
            throw new functions.https.HttpsError("invalid-argument", "eventId가 필요합니다.");
        const evRef = db.doc(`events/${eventId}`);
        const atRef = evRef.collection("attendees").doc(uid);
        return await db.runTransaction(async (tx) => {
            const [evSnap, atSnap] = await Promise.all([tx.get(evRef), tx.get(atRef)]);
            if (!evSnap.exists)
                throw new functions.https.HttpsError("not-found", "이벤트가 없습니다.");
            if (!atSnap.exists || atSnap.get("status") !== "joined") {
                return { ok: true, noop: true };
            }
            const ev = evSnap.data();
            const count = Number(ev.attendeeCount ?? 0);
            tx.set(atRef, { status: "canceled", canceledAt: now() }, { merge: true });
            tx.update(evRef, { attendeeCount: Math.max(0, count - 1), updatedAt: now() });
            tx.set(evRef.collection("logs").doc(), { type: "leave", uid, at: now() });
            return { ok: true, left: true };
        });
    }
    catch (err) {
        console.error("[leaveEvent] error:", err);
        if (err instanceof functions.https.HttpsError)
            throw err;
        throw new functions.https.HttpsError("internal", err?.message ?? "leave failed");
    }
});
