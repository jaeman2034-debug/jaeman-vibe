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
exports.removeAssignment = exports.completeAssignment = exports.startAssignment = exports.assignMatchToCourt = exports.upsertCourt = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();
async function assertStaff(eventId, uid) {
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'login');
    const r = await db.doc(`events/${eventId}/roles/${uid}`).get();
    if (!r.exists)
        throw new https_1.HttpsError('permission-denied', 'staff only');
}
// 코트 생성/수정
exports.upsertCourt = (0, https_1.onCall)(async (request) => {
    const { eventId, courtId, name, pin, active = true } = request.data;
    await assertStaff(eventId, request.auth?.uid);
    const ref = courtId
        ? db.doc(`events/${eventId}/courts/${courtId}`)
        : db.collection(`events/${eventId}/courts`).doc();
    await ref.set({
        name,
        pin: pin || null,
        active,
        createdAt: now()
    }, { merge: true });
    return { ok: true, courtId: ref.id };
});
// 배정(매치를 특정 코트 큐에 push)
exports.assignMatchToCourt = (0, https_1.onCall)(async (request) => {
    const { eventId, matchId, courtId } = request.data;
    await assertStaff(eventId, request.auth?.uid);
    const mref = db.doc(`events/${eventId}/matches/${matchId}`);
    const cref = db.doc(`events/${eventId}/courts/${courtId}`);
    const [m, c] = await Promise.all([mref.get(), cref.get()]);
    if (!m.exists)
        throw new https_1.HttpsError('not-found', 'match');
    if (!c.exists)
        throw new https_1.HttpsError('not-found', 'court');
    const qs = await db.collection(`events/${eventId}/court_assignments`)
        .where('courtId', '==', courtId)
        .get();
    const order = qs.size + 1;
    const aRef = db.collection(`events/${eventId}/court_assignments`).doc();
    await aRef.set({
        courtId,
        matchId,
        status: 'queued',
        order,
        createdAt: now()
    });
    await mref.set({ table: courtId }, { merge: true });
    return { ok: true, assignmentId: aRef.id, order };
});
// 시작(해당 코트에 running 하나만 허용)
exports.startAssignment = (0, https_1.onCall)(async (request) => {
    const { eventId, assignmentId, pin } = request.data;
    // 스태프 OR 심판 OR 코트 PIN — 셋 중 하나면 허용
    const aRef = db.doc(`events/${eventId}/court_assignments/${assignmentId}`);
    const a = (await aRef.get()).data();
    if (!a)
        throw new https_1.HttpsError('not-found', 'assignment');
    const court = (await db.doc(`events/${eventId}/courts/${a.courtId}`).get()).data();
    const roleDoc = request.auth?.uid ?
        await db.doc(`events/${eventId}/roles/${request.auth.uid}`).get() : null;
    const role = roleDoc?.data()?.role;
    const isAllowed = role === 'staff' || role === 'ref' || (!!court?.pin && court.pin === pin);
    if (!isAllowed) {
        throw new https_1.HttpsError('permission-denied', 'need ref/staff or pin');
    }
    // 같은 코트 running 있으면 막기
    const running = await db.collection(`events/${eventId}/court_assignments`)
        .where('courtId', '==', a.courtId)
        .where('status', '==', 'running')
        .limit(1)
        .get();
    if (!running.empty) {
        throw new https_1.HttpsError('failed-precondition', 'already running');
    }
    await db.runTransaction(async (tx) => {
        tx.set(aRef, { status: 'running', startedAt: now() }, { merge: true });
        tx.set(db.doc(`events/${eventId}/matches/${a.matchId}`), {
            status: 'running',
            startAt: now(),
            table: a.courtId
        }, { merge: true });
    });
    return { ok: true };
});
// 완료(스코어 입력은 클라에서 reportMatch 호출 후 → 완료 처리)
exports.completeAssignment = (0, https_1.onCall)(async (request) => {
    const { eventId, assignmentId, pin } = request.data;
    const aRef = db.doc(`events/${eventId}/court_assignments/${assignmentId}`);
    const a = (await aRef.get()).data();
    if (!a)
        throw new https_1.HttpsError('not-found', 'assignment');
    const court = (await db.doc(`events/${eventId}/courts/${a.courtId}`).get()).data();
    const roleDoc = request.auth?.uid ?
        await db.doc(`events/${eventId}/roles/${request.auth.uid}`).get() : null;
    const role = roleDoc?.data()?.role;
    const isAllowed = role === 'staff' || role === 'ref' || (!!court?.pin && court.pin === pin);
    if (!isAllowed) {
        throw new https_1.HttpsError('permission-denied', 'need ref/staff or pin');
    }
    await db.runTransaction(async (tx) => {
        tx.set(aRef, { status: 'done', endedAt: now() }, { merge: true });
        tx.set(db.doc(`events/${eventId}/matches/${a.matchId}`), {
            status: 'done',
            endAt: now()
        }, { merge: true });
    });
    return { ok: true };
});
// 큐 제거
exports.removeAssignment = (0, https_1.onCall)(async (request) => {
    const { eventId, assignmentId } = request.data;
    await assertStaff(eventId, request.auth?.uid);
    await db.doc(`events/${eventId}/court_assignments/${assignmentId}`).delete();
    return { ok: true };
});
