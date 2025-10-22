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
exports.kickAttendee = exports.pinNotice = exports.setEventStatus = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();
async function assertHost(ctx, eventId) {
    const uid = ctx.auth?.uid;
    if (!uid)
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
    if (!eventId)
        throw new functions.https.HttpsError("invalid-argument", "eventId가 필요합니다.");
    const evRef = db.doc(`events/${eventId}`);
    const evSnap = await evRef.get();
    if (!evSnap.exists)
        throw new functions.https.HttpsError("not-found", "이벤트가 없습니다.");
    const ev = evSnap.data();
    if (ev.hostId !== uid)
        throw new functions.https.HttpsError("permission-denied", "호스트만 수행 가능합니다.");
    return { evRef, ev };
}
async function addLog(eventId, entry) {
    await db.collection(`events/${eventId}/logs`).add({ ...entry, at: now() });
}
exports.setEventStatus = functions.region("us-central1").https.onCall(async (data, ctx) => {
    try {
        const { eventId, status } = data;
        if (!["open", "closed"].includes(status))
            throw new functions.https.HttpsError("invalid-argument", "status는 open|closed");
        const { evRef } = await assertHost(ctx, eventId);
        await evRef.update({ status, updatedAt: now() });
        await addLog(eventId, { type: "status", status, uid: ctx.auth.uid });
        return { ok: true, status };
    }
    catch (err) {
        console.error("[setEventStatus] error:", err);
        if (err instanceof functions.https.HttpsError)
            throw err;
        throw new functions.https.HttpsError("internal", err?.message ?? "setEventStatus failed");
    }
});
exports.pinNotice = functions.region("us-central1").https.onCall(async (data, ctx) => {
    try {
        const { eventId, title, body } = data;
        const { evRef } = await assertHost(ctx, eventId);
        const pinnedRef = evRef.collection("notice").doc("pinned");
        await pinnedRef.set({ title: title ?? "", body: body ?? "", updatedAt: now(), updatedBy: ctx.auth.uid }, { merge: true });
        await addLog(eventId, { type: "notice_pin", uid: ctx.auth.uid });
        return { ok: true };
    }
    catch (err) {
        console.error("[pinNotice] error:", err);
        if (err instanceof functions.https.HttpsError)
            throw err;
        throw new functions.https.HttpsError("internal", err?.message ?? "pinNotice failed");
    }
});
exports.kickAttendee = functions.region("us-central1").https.onCall(async (data, ctx) => {
    try {
        const { eventId, targetUid, reason } = data;
        if (!targetUid)
            throw new functions.https.HttpsError("invalid-argument", "targetUid가 필요합니다.");
        const { evRef } = await assertHost(ctx, eventId);
        await db.runTransaction(async (tx) => {
            const atRef = evRef.collection("attendees").doc(targetUid);
            const atSnap = await tx.get(atRef);
            if (!atSnap.exists)
                return;
            const prev = atSnap.data();
            tx.set(atRef, { status: "kicked", kickedAt: admin.firestore.FieldValue.serverTimestamp(), kickedBy: ctx.auth.uid, reason: reason ?? "" }, { merge: true });
            await addLog(eventId, { type: "kick", uid: targetUid, by: ctx.auth.uid, prevStatus: prev?.status, reason: reason ?? "" });
        });
        return { ok: true };
    }
    catch (err) {
        console.error("[kickAttendee] error:", err);
        if (err instanceof functions.https.HttpsError)
            throw err;
        throw new functions.https.HttpsError("internal", err?.message ?? "kickAttendee failed");
    }
});
