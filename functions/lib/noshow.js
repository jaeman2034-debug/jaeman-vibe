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
exports.manualSweepNoShows = exports.waivePenalty = exports.sweepNoShows = void 0;
exports.addStrike = addStrike;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sentry_1 = require("./sentry");
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();
// 설정 상수
const STRIKE_LIMIT = 3; // 기준(변경 가능)
const GRACE_MIN = 120; // 이벤트 종료 후 그레이스(분)
const BAN_DAYS = 7; // 기준 초과 시 제한 기간(일)
// 종료된 이벤트 중 그레이스 기간이 지난 것들을 조회
async function listExpiredEvents() {
    const end = admin.firestore.Timestamp.fromDate(new Date(Date.now() - GRACE_MIN * 60 * 1000));
    // status=open|closed 중 endAt <= (now - grace)
    return await db.collection('events')
        .where('endAt', '<=', end)
        .where('status', 'in', ['open', 'closed'])
        .limit(50) // 배치 처리(필요시 페이지네이션)
        .get();
}
// 노쇼 스윕 스케줄러 (매일 새벽 1시 10분 KST)
exports.sweepNoShows = functions.pubsub
    .schedule('every day 01:10') // KST 새벽(프로젝트 TZ에 맞춰 조정)
    .timeZone('Asia/Seoul')
    .onRun((0, sentry_1.wrapRun)('sweepNoShows', async () => {
    console.log('Starting no-show sweep...');
    try {
        const evs = await listExpiredEvents();
        console.log(`Found ${evs.docs.length} expired events to process`);
        for (const e of evs.docs) {
            const eid = e.id;
            console.log(`Processing event: ${eid}`);
            // presence 컬렉션에서 체크인한 사용자들 조회
            const pres = await db.collection(`events/${eid}/presence`).select().get();
            const present = new Set(pres.docs.map(d => d.id)); // uid set
            // attendees 컬렉션에서 참석자들 조회
            const atts = await db.collection(`events/${eid}/attendees`).select().get();
            console.log(`Event ${eid}: ${atts.docs.length} attendees, ${present.size} present`);
            // 각 참석자 검사
            for (const a of atts.docs) {
                const uid = a.id;
                if (present.has(uid)) {
                    console.log(`User ${uid} was present, skipping`);
                    continue; // 체크인 있음 → 패스
                }
                console.log(`User ${uid} was absent, adding strike`);
                await addStrike(uid, eid, 'system:sweep');
                await db.collection(`events/${eid}/logs`).add({
                    action: 'penalty.no_show',
                    actorId: 'system',
                    at: now(),
                    meta: { uid }
                });
            }
            // 이벤트를 closed로 마킹(선택)
            await e.ref.set({ status: 'closed' }, { merge: true });
            console.log(`Event ${eid} marked as closed`);
        }
        console.log('No-show sweep completed successfully');
        return null;
    }
    catch (error) {
        console.error('Error in no-show sweep:', error);
        throw error;
    }
}));
// 스트라이크 추가 함수
async function addStrike(uid, eventId, actorId) {
    const userRef = db.doc(`users/${uid}`);
    const penRef = db.collection(`users/${uid}/penalties`).doc();
    await db.runTransaction(async (tx) => {
        const userSnap = await tx.get(userRef);
        const prev = (userSnap.exists ? (userSnap.data().discipline?.strikeCount || 0) : 0);
        const next = prev + 1;
        // 페널티 기록 추가
        tx.set(penRef, {
            type: 'no_show',
            eventId,
            points: 1,
            at: now(),
            actorId
        }, { merge: false });
        // 기준 초과 시 strikeUntil 설정
        let patch = { discipline: { strikeCount: next } };
        if (next >= STRIKE_LIMIT) {
            const until = admin.firestore.Timestamp.fromDate(new Date(Date.now() + BAN_DAYS * 24 * 60 * 60 * 1000));
            patch.discipline.strikeUntil = until;
        }
        tx.set(userRef, patch, { merge: true });
    });
    // FCM 알림(선택)
    try {
        const tokenSnap = await db.collection(`users/${uid}/devices`).get();
        if (tokenSnap.docs.length > 0) {
            const tokens = tokenSnap.docs.map(d => d.id);
            await admin.messaging().sendEachForMulticast({
                tokens,
                notification: {
                    title: '노쇼 페널티가 부과되었습니다',
                    body: `이벤트(${eventId}) 미체크인으로 strike 1회. 누적 ${STRIKE_LIMIT}회 시 참가 제한.`,
                },
                data: { type: 'penalty', eventId }
            });
        }
    }
    catch (error) {
        console.error('FCM notification failed:', error);
    }
}
// 스태프: 페널티 감면/무효화
exports.waivePenalty = (0, sentry_1.wrapCall)('waivePenalty', async (data, ctx) => {
    const { uid, penaltyId, eventId } = data;
    if (!ctx.auth?.uid)
        throw new functions.https.HttpsError('unauthenticated', 'login');
    // 스태프 확인
    const role = await db.doc(`events/${eventId}/roles/${ctx.auth.uid}`).get();
    if (!role.exists)
        throw new functions.https.HttpsError('permission-denied', 'staff only');
    const userRef = db.doc(`users/${uid}`);
    const penRef = db.doc(`users/${uid}/penalties/${penaltyId}`);
    await db.runTransaction(async (tx) => {
        const pen = await tx.get(penRef);
        if (!pen.exists)
            throw new functions.https.HttpsError('not-found', 'penalty');
        tx.delete(penRef);
        const u = await tx.get(userRef);
        const curr = (u.exists ? (u.data().discipline?.strikeCount || 0) : 0);
        const next = Math.max(0, curr - 1);
        const patch = { discipline: { strikeCount: next } };
        // strikeUntil 해제(조건부)
        if (next < STRIKE_LIMIT)
            patch.discipline.strikeUntil = admin.firestore.FieldValue.delete();
        tx.set(userRef, patch, { merge: true });
    });
    await db.collection(`events/${eventId}/logs`).add({
        action: 'penalty.waive',
        actorId: ctx.auth.uid,
        at: now(),
        meta: { uid, penaltyId }
    });
    return { ok: true };
});
// 수동 스윕 실행 (테스트용)
exports.manualSweepNoShows = (0, sentry_1.wrapCall)('manualSweepNoShows', async (data, ctx) => {
    if (!ctx.auth?.uid)
        throw new functions.https.HttpsError('unauthenticated', 'login');
    // 관리자 권한 확인
    const adminDoc = await db.doc(`admins/${ctx.auth.uid}`).get();
    if (!adminDoc.exists)
        throw new functions.https.HttpsError('permission-denied', 'admin only');
    try {
        const evs = await listExpiredEvents();
        console.log(`Manual sweep: Found ${evs.docs.length} expired events to process`);
        for (const e of evs.docs) {
            const eid = e.id;
            const pres = await db.collection(`events/${eid}/presence`).select().get();
            const present = new Set(pres.docs.map(d => d.id));
            const atts = await db.collection(`events/${eid}/attendees`).select().get();
            for (const a of atts.docs) {
                const uid = a.id;
                if (present.has(uid))
                    continue;
                await addStrike(uid, eid, ctx.auth.uid);
                await db.collection(`events/${eid}/logs`).add({
                    action: 'penalty.no_show',
                    actorId: ctx.auth.uid,
                    at: now(),
                    meta: { uid }
                });
            }
            await e.ref.set({ status: 'closed' }, { merge: true });
        }
        return { ok: true, processed: evs.docs.length };
    }
    catch (error) {
        console.error('Manual sweep error:', error);
        throw new functions.https.HttpsError('internal', 'Sweep failed');
    }
});
