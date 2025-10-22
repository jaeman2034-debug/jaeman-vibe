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
exports.deleteAnnouncement = exports.updateAnnouncement = exports.createAnnouncement = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const fcm_1 = require("./fcm");
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();
async function assertStaff(eventId, uid) {
    if (!uid)
        throw new functions.https.HttpsError('unauthenticated', 'login');
    const role = await db.doc(`events/${eventId}/roles/${uid}`).get();
    if (!role.exists)
        throw new functions.https.HttpsError('permission-denied', 'staff only');
    return uid;
}
// 간단 욕설 필터(운영용 리스트 + 기본 리스트)
const DEFAULT_BAD = ['씨발', '개새', '병신', 'fuck', 'shit']; // 예시(실서비스는 외부 리스트로 교체)
async function moderate(text) {
    const s = (text || '').toLowerCase();
    const adminSettings = await db.doc('admin/settings/moderation').get().catch(() => null);
    const custom = adminSettings?.exists ? (adminSettings.data()?.banned || []) : [];
    const banned = new Set([...DEFAULT_BAD, ...custom.map((x) => String(x).toLowerCase())]);
    for (const w of banned)
        if (w && s.includes(w)) {
            throw new functions.https.HttpsError('failed-precondition', `금칙어 포함: ${w}`);
        }
}
// 레이트리밋: 유저별 이벤트당 5분 1회
async function rateLimit(eventId, uid, windowMs = 5 * 60 * 1000) {
    const ref = db.doc(`events/${eventId}/ratelimits/${uid}`);
    const snap = await ref.get();
    const nowMs = Date.now();
    const last = snap.exists ? snap.data().last : 0;
    if (nowMs - last < windowMs) {
        throw new functions.https.HttpsError('resource-exhausted', '잠시 후 다시 시도하세요(5분 제한)');
    }
    await ref.set({ last: nowMs }, { merge: true });
}
exports.createAnnouncement = functions.https.onCall(async (data, ctx) => {
    const { eventId, title, text } = data;
    const uid = await assertStaff(eventId, ctx.auth?.uid);
    if (!text || String(text).trim().length < 2)
        throw new functions.https.HttpsError('invalid-argument', '내용을 입력하세요');
    await moderate(`${title || ''}\n${text}`);
    await rateLimit(eventId, uid);
    const docRef = await db.collection(`events/${eventId}/announcements`).add({
        title: title?.slice(0, 80) || null,
        text: text.slice(0, 5000),
        pinned: false,
        createdAt: now(),
        authorId: uid
    });
    await db.collection(`events/${eventId}/logs`).add({
        action: 'announce.create', actorId: uid, at: now(), meta: { id: docRef.id }
    });
    // 공지 생성 푸시 알림
    try {
        // 개별 발송 (토큰 없는 유저 커버)
        await (0, fcm_1.sendToEventAttendees)(eventId, {
            title: '새 공지',
            body: title || text.slice(0, 40) + (text.length > 40 ? '...' : '')
        }, {
            type: 'announce.create',
            announcementId: docRef.id
        });
        // 토픽 발송
        await (0, fcm_1.sendToTopic)((0, fcm_1.topic)(eventId, 'announce'), {
            title: '새 공지',
            body: title || text.slice(0, 40) + (text.length > 40 ? '...' : '')
        }, {
            type: 'announce.create',
            eventId,
            announcementId: docRef.id
        });
    }
    catch (error) {
        console.error('공지 생성 푸시 발송 실패:', error);
    }
    return { ok: true, id: docRef.id };
});
exports.updateAnnouncement = functions.https.onCall(async (data, ctx) => {
    const { eventId, annId, title, text } = data;
    const uid = await assertStaff(eventId, ctx.auth?.uid);
    if (text)
        await moderate(`${title || ''}\n${text}`);
    await db.doc(`events/${eventId}/announcements/${annId}`).set({
        ...(title !== undefined ? { title: title?.slice(0, 80) || null } : {}),
        ...(text !== undefined ? { text: text.slice(0, 5000) } : {}),
        updatedAt: now(),
        editorId: uid
    }, { merge: true });
    await db.collection(`events/${eventId}/logs`).add({
        action: 'announce.update', actorId: uid, at: now(), meta: { id: annId }
    });
    return { ok: true };
});
exports.deleteAnnouncement = functions.https.onCall(async (data, ctx) => {
    const { eventId, annId } = data;
    const uid = await assertStaff(eventId, ctx.auth?.uid);
    await db.doc(`events/${eventId}/announcements/${annId}`).delete();
    await db.collection(`events/${eventId}/logs`).add({
        action: 'announce.delete', actorId: uid, at: now(), meta: { id: annId }
    });
    return { ok: true };
});
