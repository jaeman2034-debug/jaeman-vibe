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
exports.advanceTopToBracket = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const db = admin.firestore();
async function assertStaff(eventId, uid) {
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'login');
    const r = await db.doc(`events/${eventId}/roles/${uid}`).get();
    if (!r.exists || r.data()?.role !== 'staff') {
        throw new https_1.HttpsError('permission-denied', 'staff only');
    }
}
function seedPairs(ids) {
    // 1vs최후, 2vs차최후 … (짝수 맞추기 위해 BYE 추가)
    const arr = [...ids];
    const pow = 1 << Math.ceil(Math.log2(Math.max(2, arr.length)));
    while (arr.length < pow)
        arr.push('__BYE__');
    const out = [];
    for (let i = 0; i < pow / 2; i++) {
        out.push([arr[i], arr[pow - 1 - i]]);
    }
    return out;
}
exports.advanceTopToBracket = (0, https_1.onCall)(async (request) => {
    const { eventId, topN } = request.data;
    await assertStaff(eventId, request.auth?.uid);
    if (!topN || topN < 2)
        throw new https_1.HttpsError('invalid-argument', 'topN>=2');
    // standings 정렬: 승률(pct) → 득실(diff) → 득점(ptsFor)
    const st = await db.collection(`events/${eventId}/standings`).get();
    if (!st.size)
        throw new https_1.HttpsError('failed-precondition', 'standings empty');
    const rows = st.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.pct || 0) - (a.pct || 0) || (b.diff || 0) - (a.diff || 0) || (b.ptsFor || 0) - (a.ptsFor || 0));
    const seeds = rows.slice(0, topN).map(r => r.id);
    if (seeds.length < 2)
        throw new https_1.HttpsError('failed-precondition', 'need >=2 teams');
    // 기존 bracket 초기화
    const old = await db.collection(`events/${eventId}/matches`).where('phase', '==', 'bracket').get();
    if (old.size) {
        const b = db.batch();
        old.docs.forEach(d => b.delete(d.ref));
        await b.commit();
    }
    const pairs = seedPairs(seeds);
    const batch = db.batch();
    pairs.forEach(([A, B], i) => {
        const ref = db.doc(`events/${eventId}/matches/R1_${i + 1}`);
        batch.set(ref, {
            phase: 'bracket',
            round: 1,
            order: i + 1,
            teamA: A,
            teamB: B,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });
    await batch.commit();
    return { ok: true, seeded: seeds.length, r1: pairs.length };
});
