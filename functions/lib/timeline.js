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
exports.markDone = exports.startNext = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();
async function assertStaff(eventId, uid) {
    if (!uid)
        throw new functions.https.HttpsError('unauthenticated', 'login');
    const r = await db.doc(`events/${eventId}/roles/${uid}`).get();
    if (!r.exists)
        throw new functions.https.HttpsError('permission-denied', 'staff only');
}
exports.startNext = functions.https.onCall(async (data, ctx) => {
    const { eventId } = data;
    await assertStaff(eventId, ctx.auth?.uid);
    const qs = await db.collection(`events/${eventId}/timeline`).orderBy('order', 'asc').get();
    const next = qs.docs.find(d => d.data().status !== 'done');
    if (!next)
        return { ok: true, done: true };
    await next.ref.set({
        status: 'running',
        startAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return { ok: true, id: next.id };
});
exports.markDone = functions.https.onCall(async (data, ctx) => {
    const { eventId, id } = data;
    await assertStaff(eventId, ctx.auth?.uid);
    await db.doc(`events/${eventId}/timeline/${id}`).set({
        status: 'done',
        endAt: now()
    }, { merge: true });
    return { ok: true };
});
