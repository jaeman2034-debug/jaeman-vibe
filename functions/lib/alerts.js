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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.watchAnomalies = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const sentry_1 = require("./sentry");
const fcm_1 = require("./fcm");
const db = admin.firestore();
const SLACK = process.env.SLACK_WEBHOOK_URL || ''; // 설정 시 Slack 알림
const NO_SHOW_THRESH = 0.5; // 노쇼율 50%↑
const PAY_FAIL_THRESH = 0.15; // 결제 실패율 15%↑
async function postSlack(text) {
    if (!SLACK)
        return;
    await (0, node_fetch_1.default)(SLACK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
}
exports.watchAnomalies = functions.pubsub
    .schedule('every 1 hours').timeZone('Asia/Seoul')
    .onRun((0, sentry_1.wrapRun)('watchAnomalies', async () => {
    const evs = await db.collection('events').where('status', 'in', ['open', 'closed']).limit(50).get();
    for (const e of evs.docs) {
        const eventId = e.id;
        const title = e.data().title || eventId;
        try {
            // 1) 최근 히스토리 집계에서 노쇼율
            const hist = await db.collection(`events/${eventId}/metrics/history`).orderBy('date', 'desc').limit(3).get();
            const ns = hist.docs.map(d => d.data()).map(h => {
                const a = h.attendees || 0, p = h.presence || 0;
                return a ? (a - p) / a : 0;
            });
            const nsAvg = ns.length ? ns.reduce((x, y) => x + y, 0) / ns.length : 0;
            // 2) 결제 실패율 (최근 24h)
            const since = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
            const paid = await db.collection(`events/${eventId}/payments`).where('approvedAt', '>=', since).get().catch(() => ({ size: 0 }));
            const failed = await db.collection(`events/${eventId}/payments`).where('status', '==', 'failed').where('createdAt', '>=', since).get().catch(() => ({ size: 0 }));
            const failRate = (paid.size + failed.size) ? (failed.size / (paid.size + failed.size)) : 0;
            const notes = [];
            if (nsAvg >= NO_SHOW_THRESH)
                notes.push(`노쇼율 ${Math.round(nsAvg * 100)}%`);
            if (failRate >= PAY_FAIL_THRESH)
                notes.push(`결제실패율 ${Math.round(failRate * 100)}%`);
            if (notes.length) {
                const msg = `⚠️ [${title}] 이상치 감지: ${notes.join(', ')}`;
                await postSlack(msg);
                // 스태프 공지 토픽으로도 푸시(선택)
                try {
                    await (0, fcm_1.sendToTopic)((0, fcm_1.topic)(eventId, 'announce'), {
                        title: '이상치 감지',
                        body: notes.join(', ')
                    }, {
                        type: 'alert',
                        eventId
                    });
                }
                catch (error) {
                    console.error('푸시 알림 발송 실패:', error);
                }
            }
        }
        catch (error) {
            console.error(`이벤트 ${eventId} 이상치 감지 실패:`, error);
        }
    }
    return null;
}));
