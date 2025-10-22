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
exports.promoteFromWaitlist = exports.suggestWaitlistPromotion = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sentry_1 = require("./sentry");
const fcm_1 = require("./fcm");
const db = admin.firestore();
async function loadCounts(eventId) {
    const ev = (await db.doc(`events/${eventId}`).get()).data();
    const cap = Number(ev?.capacity || 0);
    const [atts, waits, hist] = await Promise.all([
        db.collection(`events/${eventId}/attendees`).select().get(),
        db.collection(`events/${eventId}/waitlist`).orderBy('joinedAt', 'asc').get(),
        db.collection(`events/${eventId}/metrics/history`).orderBy('date', 'desc').limit(7).get().catch(() => ({ docs: [] }))
    ]);
    const attendeeCount = atts.size;
    const waitCount = waits.size;
    // 최근 일자 노쇼율(없으면 0.1)
    const ns = hist.docs.map(d => {
        const h = d.data();
        const a = Number(h.attendees || 0), p = Number(h.presence || 0);
        return a > 0 ? (a - p) / a : 0;
    });
    const nsAvg = ns.length ? (ns.reduce((x, y) => x + y, 0) / ns.length) : 0.1;
    return { cap, attendeeCount, waitCount, nsAvg };
}
exports.suggestWaitlistPromotion = (0, sentry_1.wrapCall)('suggestWaitlistPromotion', async (data) => {
    const { eventId } = data;
    if (!eventId)
        throw new functions.https.HttpsError('invalid-argument', 'eventId');
    const { cap, attendeeCount, waitCount, nsAvg } = await loadCounts(eventId);
    // 보수적: 남은 좌석만
    const conservative = Math.max(0, Math.min(waitCount, cap - attendeeCount));
    // 예측기반: 예상 노쇼만큼 추가 허용(최대 좌석의 20%까지만 오버부킹)
    const over = Math.min(Math.ceil(cap * nsAvg), Math.floor(cap * 0.2));
    const predictive = Math.max(0, Math.min(waitCount, cap - attendeeCount + over));
    const context = { cap, attendeeCount, waitCount, nsAvg, over };
    return { conservative, predictive, context };
});
exports.promoteFromWaitlist = (0, sentry_1.wrapCall)('promoteFromWaitlist', async (data, ctx) => {
    const { eventId, count, mode } = data;
    if (!ctx.auth?.uid)
        throw new functions.https.HttpsError('unauthenticated', 'login');
    if (!eventId || !count || count < 1)
        throw new functions.https.HttpsError('invalid-argument', 'bad args');
    // 스태프 확인
    const role = await db.doc(`events/${eventId}/roles/${ctx.auth.uid}`).get();
    if (!role.exists)
        throw new functions.https.HttpsError('permission-denied', 'staff only');
    const { cap, attendeeCount } = await loadCounts(eventId);
    const waits = await db.collection(`events/${eventId}/waitlist`).orderBy('joinedAt', 'asc').limit(count).get();
    // 하드 세이프가드: 좌석 + 20% 이내까지만 총원 허용
    const hardMax = Math.ceil(cap * 1.2);
    const canPromote = Math.max(0, Math.min(waits.size, hardMax - attendeeCount));
    if (canPromote <= 0)
        return { ok: true, promoted: 0 };
    let promoted = 0;
    for (const w of waits.docs.slice(0, canPromote)) {
        const uid = w.id;
        await db.runTransaction(async (tx) => {
            const attRef = db.doc(`events/${eventId}/attendees/${uid}`);
            const att = await tx.get(attRef);
            if (att.exists)
                return; // 이미 승격됨
            tx.set(attRef, {
                joinedAt: admin.firestore.FieldValue.serverTimestamp(),
                source: `promote:${mode}`
            }, { merge: true });
            tx.delete(w.ref);
            tx.create(db.collection(`events/${eventId}/logs`).doc(), {
                action: 'waitlist.promote',
                actorId: ctx.auth.uid,
                at: admin.firestore.FieldValue.serverTimestamp(),
                meta: { uid, mode }
            });
        });
        promoted++;
        // 개인 푸시는 보조(주 트리거는 onAttendeeCreateNotify)
        await (0, fcm_1.sendToUser)(uid, {
            title: '대기열 승격',
            body: '참가가 확정되었어요!'
        }, {
            type: 'waitlist.promoted',
            eventId
        });
    }
    return { ok: true, promoted };
});
