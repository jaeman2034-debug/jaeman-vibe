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
exports.scheduleMetrics = exports.recomputeEventMetrics = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const sentry_1 = require("./sentry");
const db = admin.firestore();
async function computeFor(eventId) {
    const [atts, pres, pays, waits] = await Promise.all([
        db.collection(`events/${eventId}/attendees`).select().get(),
        db.collection(`events/${eventId}/presence`).select().get(),
        db.collection(`events/${eventId}/payments`).where('status', '==', 'paid').select().get(),
        db.collection(`events/${eventId}/waitlist`).select().get()
    ]);
    const attendeeCount = atts.size;
    const presentCount = pres.size;
    const paidCount = pays.size;
    const waitCount = waits.size;
    const noShowRate = attendeeCount ? ((attendeeCount - presentCount) / attendeeCount) : 0;
    const payConv = attendeeCount ? (paidCount / attendeeCount) : 0;
    await db.doc(`events/${eventId}/metrics/summary`).set({
        attendeeCount,
        presentCount,
        paidCount,
        waitCount,
        noShowRate,
        payConv,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return { attendeeCount, presentCount, paidCount, waitCount, noShowRate, payConv };
}
exports.recomputeEventMetrics = (0, sentry_1.wrapCall)('recomputeEventMetrics', async (data, ctx) => {
    const { eventId } = data;
    if (!eventId)
        throw new functions.https.HttpsError('invalid-argument', 'eventId');
    return await computeFor(eventId);
});
exports.scheduleMetrics = functions.pubsub
    .schedule('every 2 hours').timeZone('Asia/Seoul')
    .onRun((0, sentry_1.wrapRun)('scheduleMetrics', async () => {
    const qs = await db.collection('events').select().limit(50).get();
    await Promise.all(qs.docs.map(d => computeFor(d.id)));
    return null;
}));
