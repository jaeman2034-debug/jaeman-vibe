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
exports.createCouponPool = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sentry_1 = require("./sentry");
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();
async function assertStaff(eventId, uid) {
    if (!uid)
        throw new functions.https.HttpsError('unauthenticated', 'login');
    const role = await db.doc(`events/${eventId}/roles/${uid}`).get();
    if (!role.exists)
        throw new functions.https.HttpsError('permission-denied', 'staff only');
}
function randCode(prefix) {
    const n = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(2, 8);
    return [prefix.toUpperCase(), n].join('-');
}
exports.createCouponPool = functions.https.onCall((0, sentry_1.wrapCall)('createCouponPool', async (data, ctx) => {
    const { eventId, prefix, count = 100, payload } = data;
    await assertStaff(eventId, ctx.auth?.uid);
    if (!prefix || count < 1 || count > 5000) {
        throw new functions.https.HttpsError('invalid-argument', 'bad args');
    }
    const poolRef = await db.collection(`events/${eventId}/coupon_pools`).add({
        prefix: prefix.toUpperCase(),
        count,
        payload,
        createdAt: now(),
        createdBy: ctx.auth.uid,
        stats: { issued: 0, active: 0 }
    });
    let issued = 0;
    const batchLimit = 400;
    let batch = db.batch();
    for (let i = 0; i < count; i++) {
        const code = randCode(prefix);
        const codeRef = db.doc(`events/${eventId}/coupons/${code}`);
        batch.set(codeRef, {
            ...payload,
            poolId: poolRef.id,
            active: true,
            usedCount: 0,
            totalLimit: 1,
            createdAt: now(),
            createdBy: ctx.auth.uid
        }, { merge: true });
        issued++;
        if (issued % batchLimit === 0) {
            await batch.commit();
            batch = db.batch();
        }
    }
    await batch.commit();
    await poolRef.set({ stats: { issued, active: issued } }, { merge: true });
    return { ok: true, poolId: poolRef.id, issued };
}));
