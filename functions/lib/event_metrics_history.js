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
exports.scheduleEventHistory = exports.recomputeEventHistory = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const sentry_1 = require("./sentry");
const db = admin.firestore();
function dkey(d) {
    const y = d.getFullYear(), m = (d.getMonth() + 1 + '').padStart(2, '0'), day = (d.getDate() + '').padStart(2, '0');
    return `${y}-${m}-${day}`;
}
async function computeDay(eventId, day) {
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0);
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
    const ts = admin.firestore.Timestamp;
    const [atts, pres, pays, waits] = await Promise.all([
        db.collection(`events/${eventId}/attendees`).where('joinedAt', '>=', ts.fromDate(start)).where('joinedAt', '<=', ts.fromDate(end)).get().catch(() => ({ size: 0 })),
        db.collection(`events/${eventId}/presence`).where('checkedInAt', '>=', ts.fromDate(start)).where('checkedInAt', '<=', ts.fromDate(end)).get().catch(() => ({ size: 0 })),
        db.collection(`events/${eventId}/payments`).where('status', '==', 'paid').where('approvedAt', '>=', ts.fromDate(start)).where('approvedAt', '<=', ts.fromDate(end)).get().catch(() => ({ size: 0 })),
        db.collection(`events/${eventId}/waitlist`).where('joinedAt', '>=', ts.fromDate(start)).where('joinedAt', '<=', ts.fromDate(end)).get().catch(() => ({ size: 0 })),
    ]);
    const docRef = db.doc(`events/${eventId}/metrics/history/${dkey(day)}`);
    await docRef.set({
        date: dkey(day),
        attendees: atts.size,
        presence: pres.size,
        paid: pays.size,
        wait: waits.size,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}
async function computeRange(eventId, days = 30) {
    const today = new Date();
    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        await computeDay(eventId, d);
    }
}
exports.recomputeEventHistory = (0, sentry_1.wrapCall)('recomputeEventHistory', async (data) => {
    const { eventId, days = 30 } = data;
    if (!eventId)
        throw new functions.https.HttpsError('invalid-argument', 'eventId');
    await computeRange(eventId, Math.min(days, 90));
    return { ok: true };
});
exports.scheduleEventHistory = functions.pubsub
    .schedule('every 1 hours').timeZone('Asia/Seoul')
    .onRun((0, sentry_1.wrapRun)('scheduleEventHistory', async () => {
    const qs = await db.collection('events').select().limit(50).get();
    await Promise.all(qs.docs.map(d => computeRange(d.id, 3))); // 최근 3일 롤링 갱신
    return null;
}));
