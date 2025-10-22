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
exports.onAttendeeWrite = exports.leaveEvent = exports.joinEvent = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
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
        const evRef = db.doc(`events/${eventId}`);
        const atRef = evRef.collection("attendees").doc(uid);
        const wlRef = evRef.collection("waitlist").doc(uid);
        return await db.runTransaction(async (tx) => {
            const [evSnap, atSnap, wlSnap] = await Promise.all([tx.get(evRef), tx.get(atRef), tx.get(wlRef)]);
            if (!evSnap.exists)
                throw new functions.https.HttpsError("not-found", "이벤트가 없습니다.");
            const ev = evSnap.data();
            // 이미 참가
            if (atSnap.exists && atSnap.get("status") === "joined") {
                return { ok: true, already: true };
            }
            // 이벤트 상태/시각 가드
            if (ev.status !== "open") {
                throw new functions.https.HttpsError("failed-precondition", "모집 중이 아닙니다.");
            }
            const capacity = Number(ev.capacity ?? 0);
            const count = Number(ev.attendeeCount ?? 0);
            if (count < capacity) {
                // 참가 확정
                tx.set(atRef, {
                    status: "joined",
                    feePaid: Number(ev.fee ?? 0),
                    joinedAt: now(),
                }, { merge: true });
                tx.update(evRef, { attendeeCount: count + 1, updatedAt: now() });
                tx.set(evRef.collection("logs").doc(), {
                    type: "join", uid, at: now()
                });
                // 대기열에 있었다면 정리
                if (wlSnap.exists)
                    tx.delete(wlRef);
                return { ok: true, joined: true };
            }
            else {
                // 대기열 등록(중복 등록 방지)
                if (!wlSnap.exists) {
                    tx.set(wlRef, { status: "waiting", createdAt: now() }, { merge: true });
                    tx.set(evRef.collection("logs").doc(), { type: "wait", uid, at: now() });
                }
                return { ok: true, waitlisted: true };
            }
        });
    }
    catch (err) {
        console.error("[joinEvent] error:", err);
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
/**
 * 참가자 감소(leave) 직후 빈자리가 생기면, 가장 오래 기다린 대기열 1명을 자동 승격
 */
exports.onAttendeeWrite = functions
    .region("us-central1")
    .firestore.document("events/{eventId}/attendees/{uid}")
    .onWrite(async (chg, ctx) => {
    const { eventId } = ctx.params;
    const beforeJoined = chg.before.exists && chg.before.get("status") === "joined";
    const afterJoined = chg.after.exists && chg.after.get("status") === "joined";
    const leftNow = beforeJoined && !afterJoined; // joined → (canceled|삭제)
    if (!leftNow)
        return;
    await db.runTransaction(async (tx) => {
        const evRef = db.doc(`events/${eventId}`);
        const evSnap = await tx.get(evRef);
        if (!evSnap.exists)
            return;
        const ev = evSnap.data();
        const capacity = Number(ev.capacity ?? 0);
        const count = Number(ev.attendeeCount ?? 0);
        if (ev.status !== "open" || count >= capacity)
            return;
        // 가장 오래 기다린 1명
        const wlQuery = evRef.collection("waitlist").orderBy("createdAt", "asc").limit(1);
        const wlSnap = await tx.get(wlQuery);
        if (wlSnap.empty)
            return;
        const c = wlSnap.docs[0];
        const waitUid = c.id;
        const atRef = evRef.collection("attendees").doc(waitUid);
        tx.delete(c.ref);
        tx.set(atRef, { status: "joined", joinedAt: now(), feePaid: Number(ev.fee ?? 0) }, { merge: true });
        tx.update(evRef, { attendeeCount: count + 1, updatedAt: now() });
        tx.set(evRef.collection("logs").doc(), { type: "promote", uid: waitUid, at: now() });
    });
});
