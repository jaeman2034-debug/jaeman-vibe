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
exports.computeMonthlySettlement = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const sentry_1 = require("./sentry");
const db = admin.firestore();
function monthRange(ym) {
    const [y, m] = ym.split('-').map(Number);
    const start = new Date(y, m - 1, 1, 0, 0, 0);
    const end = new Date(y, m, 0, 23, 59, 59);
    return {
        start: admin.firestore.Timestamp.fromDate(start),
        end: admin.firestore.Timestamp.fromDate(end)
    };
}
exports.computeMonthlySettlement = functions.https.onCall((0, sentry_1.wrapCall)('computeMonthlySettlement', async (data, ctx) => {
    const { month, projectWide = false } = data;
    if (!month)
        throw new functions.https.HttpsError('invalid-argument', 'month');
    // 운영자 전용(프로젝트 전체 집계일 때)
    if (projectWide && !ctx.auth?.token?.admin) {
        throw new functions.https.HttpsError('permission-denied', 'admin only');
    }
    const { start, end } = monthRange(month);
    let evIds = [];
    if (projectWide) {
        const evs = await db.collection('events').select().get();
        evIds = evs.docs.map(d => d.id);
    }
    else {
        // 사용자가 스태프로 등록된 이벤트만
        const roles = await db.collectionGroup('roles')
            .where('__name__', '>=', '')
            .get(); // 간단화: 실제론 필터 추가 권장
        evIds = Array.from(new Set(roles.docs
            .filter(d => d.id === ctx.auth?.uid)
            .map(d => d.ref.parent.parent.id)));
    }
    let gross = 0, discount = 0, paid = 0, canceled = 0, failed = 0, count = 0;
    const lines = [];
    for (const evId of evIds) {
        const pays = await db.collection(`events/${evId}/payments`)
            .where('createdAt', '>=', start)
            .where('createdAt', '<=', end)
            .get()
            .catch(() => ({ docs: [] }));
        for (const d of pays.docs) {
            const p = d.data();
            count++;
            gross += p.amount || 0;
            discount += p.discount || 0;
            const paidAmt = (p.amount || 0) - (p.discount || 0);
            if (p.status === 'paid')
                paid += paidAmt;
            if (p.status === 'canceled')
                canceled += paidAmt;
            if (p.status === 'failed')
                failed += paidAmt;
            lines.push([
                evId, d.id, p.status || '', p.amount || 0, p.discount || 0, paidAmt,
                p.invoice?.bizName || '', p.invoice?.bizRegNo || '',
                p.createdAt?.toDate ? p.createdAt.toDate().toISOString() : ''
            ].map(v => `"${String(v).replaceAll('"', '""')}"`).join(','));
        }
    }
    const net = paid - canceled;
    const csv = [
        'eventId,orderId,status,amount,discount,paid,bizName,bizRegNo,createdAt',
        ...lines
    ].join('\n');
    return { month, count, gross, discount, paid, canceled, failed, net, csv };
}));
