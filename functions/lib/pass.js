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
exports.staffConsumeUserPass = exports.issueUserPass = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();
const SECRET = process.env.PASS_SECRET || 'set_in_runtime_config';
const OFFLINE_GRACE_MS = 5 * 60 * 1000; // 토큰 만료 후 5분 내 오프라인 스캔 유예
function sign(uid, eventId, exp) {
    const msg = `${uid}|${eventId}|${exp}`;
    return crypto.createHmac('sha256', SECRET).update(msg).digest('base64url');
}
function parseToken(token) {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    return JSON.parse(raw);
}
async function assertStaff(eventId, uid) {
    if (!uid)
        throw new functions.https.HttpsError('unauthenticated', 'login');
    const role = await db.doc(`events/${eventId}/roles/${uid}`).get();
    if (!role.exists)
        throw new functions.https.HttpsError('permission-denied', 'staff only');
}
exports.issueUserPass = functions.https.onCall(async (data, context) => {
    const uid = context.auth?.uid;
    if (!uid)
        throw new functions.https.HttpsError('unauthenticated', 'login');
    const { eventId, ttlMinutes = 10 } = data;
    if (!eventId)
        throw new functions.https.HttpsError('invalid-argument', 'eventId');
    const exp = Date.now() + ttlMinutes * 60 * 1000;
    const s = sign(uid, eventId, exp);
    const token = Buffer.from(JSON.stringify({ u: uid, e: eventId, x: exp, s }), 'utf8').toString('base64url');
    // (옵션) 로그
    await db.collection(`events/${eventId}/logs`).add({ action: 'pass.issue', actorId: uid, at: now(), meta: { ttlMinutes } });
    return { token, exp };
});
exports.staffConsumeUserPass = functions.https.onCall(async (data, context) => {
    const staffUid = context.auth?.uid;
    const { eventId, token, geo, scannedAt } = data;
    await assertStaff(eventId, staffUid);
    if (!token)
        throw new functions.https.HttpsError('invalid-argument', 'token');
    // 이벤트/지오펜스 확인(체크인 v1.1 규칙 재사용)
    const evSnap = await db.doc(`events/${eventId}`).get();
    if (!evSnap.exists)
        throw new functions.https.HttpsError('not-found', 'event');
    const ev = evSnap.data();
    const checkin = ev.checkin || {};
    if (checkin.requireGeo) {
        const c = checkin.center;
        const r = checkin.radiusMeters ?? 150;
        if (!geo?.lat || !geo?.lng || !c?.lat || !c?.lng)
            throw new functions.https.HttpsError('failed-precondition', '현장 위치 필요');
        const d = (a, b) => { const R = 6371000, toR = (x) => x * Math.PI / 180; const dL = toR(b.lat - a.lat), dG = toR(b.lng - a.lng); const s1 = Math.sin(dL / 2), s2 = Math.sin(dG / 2); const A = s1 * s1 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * s2 * s2; return 2 * R * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A)); };
        const dist = d(c, geo);
        if (dist > r)
            throw new functions.https.HttpsError('permission-denied', `반경 밖(${Math.round(dist)}m)`);
    }
    // 토큰 검증 (pass.ts의 parseToken/sign 재사용)
    let u, e, x, s;
    try {
        ({ u, e, x, s } = parseToken(token));
    }
    catch {
        throw new functions.https.HttpsError('invalid-argument', 'bad token');
    }
    if (e !== eventId)
        throw new functions.https.HttpsError('failed-precondition', 'event mismatch');
    const expect = sign(u, e, x);
    if (expect !== s)
        throw new functions.https.HttpsError('permission-denied', 'invalid signature');
    // 유효성: 온라인/오프라인 스캔
    const nowMs = Date.now();
    const when = typeof scannedAt === 'number' ? scannedAt : nowMs;
    if (when > nowMs + 60000)
        throw new functions.https.HttpsError('failed-precondition', 'future timestamp'); // 이상치 방지
    const hardLimit = x + (typeof scannedAt === 'number' ? OFFLINE_GRACE_MS : 0);
    if (when > hardLimit)
        throw new functions.https.HttpsError('failed-precondition', 'token expired');
    // 참석자/중복 방지 트랜잭션 (기존과 동일)
    const attRef = db.doc(`events/${eventId}/attendees/${u}`);
    const presRef = db.doc(`events/${eventId}/presence/${u}`);
    await db.runTransaction(async (tx) => {
        const att = await tx.get(attRef);
        if (!att.exists)
            throw new functions.https.HttpsError('permission-denied', '참가자만 체크인');
        const pres = await tx.get(presRef);
        if (pres.exists)
            return;
        tx.set(presRef, {
            checkedInAt: admin.firestore.Timestamp.fromMillis(when),
            method: scannedAt ? 'scan-offline' : 'scan',
            actorId: staffUid, geo: geo || null
        }, { merge: true });
        tx.set(attRef, { checkedInAt: admin.firestore.Timestamp.fromMillis(when) }, { merge: true });
        tx.create(db.collection(`events/${eventId}/logs`).doc(), {
            action: 'presence.scan', actorId: staffUid, at: now(),
            meta: { uid: u, offline: !!scannedAt }
        });
    });
    return { ok: true, uid: u, checkedInAt: when };
});
