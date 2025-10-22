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
exports.unbanUser = exports.banUser = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const sentry_1 = require("./sentry");
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();
async function assertStaff(eventId, uid) {
    if (!uid)
        throw new functions.https.HttpsError('unauthenticated', 'login');
    const role = await db.doc(`events/${eventId}/roles/${uid}`).get();
    if (!role.exists)
        throw new functions.https.HttpsError('permission-denied', 'staff only');
}
exports.banUser = functions.https.onCall((0, sentry_1.wrapCall)('banUser', async (data, ctx) => {
    const { eventId, targetUid, days = 7, reason = '' } = data;
    await assertStaff(eventId, ctx.auth?.uid);
    const until = admin.firestore.Timestamp.fromDate(new Date(Date.now() + days * 86400000));
    await db.runTransaction(async (tx) => {
        const banRef = db.doc(`events/${eventId}/bans/${targetUid}`);
        tx.set(banRef, { until, reason, by: ctx.auth.uid, createdAt: now() }, { merge: true });
        // 참석/대기/프레즌스에서 제거
        tx.delete(db.doc(`events/${eventId}/attendees/${targetUid}`));
        tx.delete(db.doc(`events/${eventId}/waitlist/${targetUid}`));
        tx.delete(db.doc(`events/${eventId}/presence/${targetUid}`));
        tx.create(db.collection(`events/${eventId}/logs`).doc(), {
            action: 'ban.add',
            actorId: ctx.auth.uid,
            at: now(),
            meta: { targetUid, days, reason }
        });
    });
    return { ok: true };
}));
exports.unbanUser = functions.https.onCall((0, sentry_1.wrapCall)('unbanUser', async (data, ctx) => {
    const { eventId, targetUid } = data;
    await assertStaff(eventId, ctx.auth?.uid);
    await db.doc(`events/${eventId}/bans/${targetUid}`).delete();
    await db.collection(`events/${eventId}/logs`).add({
        action: 'ban.remove',
        actorId: ctx.auth.uid,
        at: now(),
        meta: { targetUid }
    });
    return { ok: true };
}));
