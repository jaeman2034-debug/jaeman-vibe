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
exports.computeSettlement = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const sentry_1 = require("./sentry");
const db = admin.firestore();
exports.computeSettlement = functions.https.onCall((0, sentry_1.wrapCall)('computeSettlement', async (data, ctx) => {
    const { eventId } = data;
    if (!eventId)
        throw new functions.https.HttpsError('invalid-argument', 'eventId');
    // 스태프만
    const role = await db.doc(`events/${eventId}/roles/${ctx.auth?.uid}`).get();
    if (!role.exists)
        throw new functions.https.HttpsError('permission-denied', 'staff only');
    const pays = await db.collection(`events/${eventId}/payments`).select().get();
    let gross = 0, discount = 0, paid = 0, canceled = 0, failed = 0;
    for (const d of pays.docs) {
        const p = d.data();
        gross += p.amount || 0;
        discount += p.discount || 0;
        if (p.status === 'paid')
            paid += (p.amount || 0) - (p.discount || 0);
        if (p.status === 'canceled')
            canceled += (p.amount || 0) - (p.discount || 0);
        if (p.status === 'failed')
            failed += (p.amount || 0) - (p.discount || 0);
    }
    const net = paid - canceled;
    return { gross, discount, paid, canceled, failed, net, count: pays.size };
}));
