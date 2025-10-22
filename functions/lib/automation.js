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
exports.setAutomation = exports.onAttendeeWriteAutoNotify = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const fcm_1 = require("./fcm");
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();
async function occupancy(eventId) {
    const ev = (await db.doc(`events/${eventId}`).get()).data();
    const cap = Number(ev?.capacity || 0);
    if (!cap)
        return { cap: 0, pre: 0, pct: 0, ev };
    const atts = await db.collection(`events/${eventId}/attendees`).select().get();
    const pres = await db.collection(`events/${eventId}/presence`).select().get();
    const pct = Math.round((pres.size / cap) * 100);
    return { cap, pre: pres.size, pct, ev };
}
async function announce(eventId, title, body, kind) {
    // 공지 문서 생성
    await db.collection(`events/${eventId}/announcements`).add({
        title,
        text: body,
        pinned: true,
        system: true,
        createdAt: now()
    });
    // 푸시
    await (0, fcm_1.sendToTopic)((0, fcm_1.topic)(eventId, 'announce'), { title, body }, {
        type: 'auto.occupancy',
        eventId,
        level: kind
    });
    // 로그
    await db.collection(`events/${eventId}/logs`).add({
        action: 'announce.auto',
        actorId: 'system',
        at: now(),
        meta: { level: kind, body }
    });
}
exports.onAttendeeWriteAutoNotify = functions.firestore
    .document('events/{eventId}/attendees/{uid}')
    .onWrite(async (_, ctx) => {
    const { eventId } = ctx.params;
    const { cap, pct, ev } = await occupancy(eventId);
    if (!cap)
        return;
    const auto = ev?.autoNotify?.occupancy !== false; // 기본 true
    if (!auto)
        return;
    const n80 = !!ev?.autoNotify?.notified80;
    const n100 = !!ev?.autoNotify?.notified100;
    if (pct >= 100 && !n100) {
        await announce(eventId, '정원 100% 달성', '현장 혼잡을 대비해 입장 대기열을 확인해 주세요.', '100');
        await db.doc(`events/${eventId}`).set({
            autoNotify: { occupancy: true, notified80: true, notified100: true }
        }, { merge: true });
    }
    else if (pct >= 80 && !n80) {
        await announce(eventId, '참가 80% 임박', '곧 정원이 가득 찹니다. 체크인 속도를 높여 주세요.', '80');
        await db.doc(`events/${eventId}`).set({
            autoNotify: { occupancy: true, notified80: true }
        }, { merge: true });
    }
});
exports.setAutomation = functions.https.onCall(async (data, ctx) => {
    const { eventId, occupancy } = data;
    if (!ctx.auth?.uid)
        throw new functions.https.HttpsError('unauthenticated', 'login');
    const role = await db.doc(`events/${eventId}/roles/${ctx.auth.uid}`).get();
    if (!role.exists)
        throw new functions.https.HttpsError('permission-denied', 'staff only');
    await db.doc(`events/${eventId}`).set({
        autoNotify: { occupancy, notified80: false, notified100: false }
    }, { merge: true });
    return { ok: true };
});
