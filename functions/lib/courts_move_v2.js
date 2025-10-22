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
exports.reorderAssignment = exports.moveAssignment = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const db = admin.firestore();
async function assertStaff(eventId, uid) {
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'login');
    const r = await db.doc(`events/${eventId}/roles/${uid}`).get();
    if (!r.exists)
        throw new https_1.HttpsError('permission-denied', 'staff only');
}
exports.moveAssignment = (0, https_1.onCall)(async (request) => {
    const { eventId, assignmentId, toCourtId, toOrder } = request.data;
    await assertStaff(eventId, request.auth?.uid);
    const aRef = db.doc(`events/${eventId}/court_assignments/${assignmentId}`);
    const a = (await aRef.get()).data();
    if (!a)
        throw new https_1.HttpsError('not-found', 'assignment');
    if (a.status === 'running')
        throw new https_1.HttpsError('failed-precondition', 'running cannot move');
    // 대상 코트의 마지막 order+1 또는 지정 toOrder
    const qs = await db.collection(`events/${eventId}/court_assignments`)
        .where('courtId', '==', toCourtId)
        .orderBy('order')
        .get();
    const max = qs.size ? Math.max(...qs.docs.map(d => d.data().order || 0)) : 0;
    const newOrder = Math.max(1, Math.min(toOrder || max + 1, max + 1));
    await aRef.set({ courtId: toCourtId, order: newOrder }, { merge: true });
    return { ok: true };
});
exports.reorderAssignment = (0, https_1.onCall)(async (request) => {
    const { eventId, courtId, orderMap } = request.data;
    await assertStaff(eventId, request.auth?.uid);
    const b = db.batch();
    Object.entries(orderMap).forEach(([id, ord]) => {
        b.set(db.doc(`events/${eventId}/court_assignments/${id}`), { order: ord }, { merge: true });
    });
    await b.commit();
    return { ok: true };
});
