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
exports.saveTeams = exports.suggestTeams = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const db = admin.firestore();
const LV = { Beginner: 1, Intermediate: 2, Advanced: 3 };
function scoreLevel(l) {
    return LV[l] || 2; // 기본 Intermediate
}
exports.suggestTeams = (0, https_1.onCall)(async (request) => {
    var _a;
    const { eventId, teamCount = 2 } = request.data;
    if (!eventId || teamCount < 2 || teamCount > 12) {
        throw new https_1.HttpsError('invalid-argument', 'bad args');
    }
    const atts = await db.collection(`events/${eventId}/attendees`).select().get();
    const members = atts.docs.map(d => ({ uid: d.id, ...d.data() }));
    // 포지션 기준 버킷 → 각 팀에 라운드로빈, 이후 레벨 균형 미세조정
    const buckets = {};
    for (const a of members) {
        (buckets[_a = a.position || 'ANY'] || (buckets[_a] = [])).push(a);
    }
    Object.values(buckets).forEach(arr => arr.sort((x, y) => scoreLevel(y.level) - scoreLevel(x.level)));
    const teams = Array.from({ length: teamCount }, () => ({ uids: [], sum: 0 }));
    // 1) 포지션 라운드로빈
    for (const key of Object.keys(buckets)) {
        let i = 0;
        for (const a of buckets[key]) {
            teams[i % teamCount].uids.push(a.uid);
            teams[i % teamCount].sum += scoreLevel(a.level);
            i++;
        }
    }
    // 2) 레벨 균형: 높은 레벨이 많은 팀에서 낮은 팀으로 일부 스왑(가벼운 그리디)
    teams.sort((a, b) => a.sum - b.sum);
    // (간단히 정렬만으로 균형 가정 — v1)
    return { teams: teams.map((t, i) => ({ name: `팀 ${i + 1}`, uids: t.uids })) };
});
exports.saveTeams = (0, https_1.onCall)(async (request) => {
    const { eventId, teams } = request.data;
    if (!request.auth?.uid)
        throw new https_1.HttpsError('unauthenticated', 'login');
    const role = await db.doc(`events/${eventId}/roles/${request.auth.uid}`).get();
    if (!role.exists)
        throw new https_1.HttpsError('permission-denied', 'staff only');
    // 삭제 후 재작성(단순화)
    const cur = await db.collection(`events/${eventId}/teams`).get();
    const batch = db.batch();
    cur.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    for (const t of teams) {
        const tRef = await db.collection(`events/${eventId}/teams`).add({
            name: t.name,
            color: t.color || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const b = db.batch();
        for (const uid of (t.uids || [])) {
            b.set(db.doc(`events/${eventId}/teams/${tRef.id}/members/${uid}`), {
                at: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        await b.commit();
    }
    return { ok: true };
});
