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
exports.AnalyticsManager = void 0;
exports.createRedirectUrl = createRedirectUrl;
exports.wrapWithTracking = wrapWithTracking;
// CTR 측정 및 실험 로그 모듈
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
class AnalyticsManager {
    // 클릭 이벤트 기록
    static async recordClick(docId, teamId, userId, userAgent, ip, variant, experimentId) {
        const clickEvent = {
            docId,
            teamId,
            userId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userAgent,
            ip,
            variant,
            experimentId
        };
        await db.collection('click_events').add(clickEvent);
    }
    // 실험 로그 기록
    static async recordExperiment(experimentLog) {
        const log = {
            ...experimentLog,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('experiment_logs').add(log);
    }
    // CTR 계산
    static async calculateCTR(teamId, startDate, endDate) {
        const start = admin.firestore.Timestamp.fromDate(startDate);
        const end = admin.firestore.Timestamp.fromDate(endDate);
        // 게시된 승인 요청 수
        const postedSnap = await db.collection('approvals')
            .where('teamId', '==', teamId)
            .where('createdAt', '>=', start)
            .where('createdAt', '<=', end)
            .get();
        const totalPosted = postedSnap.size;
        // 클릭 이벤트 수
        const clicksSnap = await db.collection('click_events')
            .where('teamId', '==', teamId)
            .where('timestamp', '>=', start)
            .where('timestamp', '<=', end)
            .get();
        const totalClicks = clicksSnap.size;
        // 변형별 통계
        const byVariant = {};
        // 게시된 요청의 변형별 집계
        const variantStats = new Map();
        postedSnap.docs.forEach(doc => {
            const data = doc.data();
            const variant = data.variant || 'default';
            variantStats.set(variant, (variantStats.get(variant) || 0) + 1);
        });
        // 클릭 이벤트의 변형별 집계
        const clickStats = new Map();
        clicksSnap.docs.forEach(doc => {
            const data = doc.data();
            const variant = data.variant || 'default';
            clickStats.set(variant, (clickStats.get(variant) || 0) + 1);
        });
        // 변형별 CTR 계산
        variantStats.forEach((posted, variant) => {
            const clicks = clickStats.get(variant) || 0;
            byVariant[variant] = {
                posted,
                clicks,
                ctr: posted > 0 ? clicks / posted : 0
            };
        });
        return {
            totalPosted,
            totalClicks,
            ctr: totalPosted > 0 ? totalClicks / totalPosted : 0,
            byVariant
        };
    }
    // 실험 통계 조회
    static async getExperimentStats(experimentId, startDate, endDate) {
        const start = admin.firestore.Timestamp.fromDate(startDate);
        const end = admin.firestore.Timestamp.fromDate(endDate);
        const logsSnap = await db.collection('experiment_logs')
            .where('experimentId', '==', experimentId)
            .where('timestamp', '>=', start)
            .where('timestamp', '<=', end)
            .get();
        const byVariant = {};
        logsSnap.docs.forEach(doc => {
            const data = doc.data();
            const variant = data.variant;
            if (!byVariant[variant]) {
                byVariant[variant] = {
                    posted: 0,
                    clicked: 0,
                    approved: 0,
                    rejected: 0,
                    ctr: 0,
                    approvalRate: 0
                };
            }
            byVariant[variant][data.event]++;
        });
        // CTR 및 승인율 계산
        Object.keys(byVariant).forEach(variant => {
            const stats = byVariant[variant];
            stats.ctr = stats.posted > 0 ? stats.clicked / stats.posted : 0;
            stats.approvalRate = (stats.approved + stats.rejected) > 0 ? stats.approved / (stats.approved + stats.rejected) : 0;
        });
        return {
            experimentId,
            totalEvents: logsSnap.size,
            byVariant
        };
    }
}
exports.AnalyticsManager = AnalyticsManager;
// 리다이렉트 URL 생성
function createRedirectUrl(docId, teamId, variant, experimentId) {
    const baseUrl = process.env.PUBLIC_BASE_URL || 'https://your-domain.com';
    const params = new URLSearchParams({
        docId,
        teamId,
        ...(variant && { variant }),
        ...(experimentId && { experimentId })
    });
    return `${baseUrl}/slack/r?${params.toString()}`;
}
// 클릭 추적을 위한 URL 래핑
function wrapWithTracking(originalUrl, docId, teamId, variant, experimentId) {
    const redirectUrl = createRedirectUrl(docId, teamId, variant, experimentId);
    return redirectUrl;
}
exports.default = {
    AnalyticsManager,
    createRedirectUrl,
    wrapWithTracking
};
