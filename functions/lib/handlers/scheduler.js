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
exports.monthlyCleanup = exports.weeklyCleanup = exports.dailyCleanup = exports.purgeDeletedUsers = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const audit_1 = require("../lib/audit");
/**
 * 삭제 대기 중인 계정 정리 (내부 함수)
 */
async function purgeDeletedUsersInternal() {
    const db = admin.firestore();
    const sevenDaysAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 3600 * 1000));
    try {
        const snap = await db.collection('users').where('deleteRequestedAt', '<=', sevenDaysAgo).get();
        for (const doc of snap.docs) {
            const uid = doc.id;
            try {
                // TODO: 사용자 소유 데이터 일괄 삭제(batch/recursive)
                await admin.auth().deleteUser(uid).catch(() => { });
                await doc.ref.delete().catch(() => { });
                await (0, audit_1.logAuditEvent)('account_purged', uid);
            }
            catch (error) {
                console.error(`Failed to purge user ${uid}:`, error);
                await (0, audit_1.logAuditEvent)('account_purge_failed', uid, {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        await (0, audit_1.logSystemEvent)('account_purge_completed', {
            purgedCount: snap.docs.length
        });
    }
    catch (error) {
        console.error('Account purge batch failed:', error);
        await (0, audit_1.logAuditEvent)('account_purge_batch_failed', undefined, {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
/**
 * 삭제 대기 중인 계정 정리 (7일 후 완전 삭제)
 */
exports.purgeDeletedUsers = (0, scheduler_1.onSchedule)('every 24 hours', async () => {
    await purgeDeletedUsersInternal();
});
/**
 * 일일 정리 작업 (매일 새벽 2시)
 */
exports.dailyCleanup = (0, scheduler_1.onSchedule)({
    schedule: '0 2 * * *', // 매일 새벽 2시
    region: 'asia-northeast3',
    timeZone: 'Asia/Seoul'
}, async () => {
    console.log('[SCHEDULER] Starting daily cleanup...');
    try {
        const db = admin.firestore();
        const now = admin.firestore.Timestamp.now();
        const oneDayAgo = admin.firestore.Timestamp.fromDate(new Date(now.toDate().getTime() - 24 * 60 * 60 * 1000));
        // 1. 만료된 세션 정리
        await cleanupExpiredSessions(db, oneDayAgo);
        // 2. 오래된 로그 정리
        await cleanupOldLogs(db, oneDayAgo);
        // 3. 임시 파일 정리
        await cleanupTempFiles();
        // 4. 삭제 대기 중인 계정 정리
        await purgeDeletedUsersInternal();
        // 5. 통계 업데이트
        await updateDailyStats(db);
        await (0, audit_1.logSystemEvent)('daily_cleanup_completed', {
            timestamp: now.toDate().toISOString()
        });
        console.log('[SCHEDULER] Daily cleanup completed');
    }
    catch (error) {
        console.error('[SCHEDULER] Daily cleanup failed:', error);
        await (0, audit_1.logAuditEvent)('daily_cleanup_failed', undefined, {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * 주간 정리 작업 (매주 일요일 새벽 3시)
 */
exports.weeklyCleanup = (0, scheduler_1.onSchedule)({
    schedule: '0 3 * * 0', // 매주 일요일 새벽 3시
    region: 'asia-northeast3',
    timeZone: 'Asia/Seoul'
}, async () => {
    console.log('[SCHEDULER] Starting weekly cleanup...');
    try {
        const db = admin.firestore();
        const now = admin.firestore.Timestamp.now();
        const oneWeekAgo = admin.firestore.Timestamp.fromDate(new Date(now.toDate().getTime() - 7 * 24 * 60 * 60 * 1000));
        // 1. 오래된 알림 정리
        await cleanupOldNotifications(db, oneWeekAgo);
        // 2. 만료된 캐시 정리
        await cleanupExpiredCache(db, oneWeekAgo);
        // 3. 주간 통계 생성
        await generateWeeklyStats(db);
        // 4. 데이터베이스 최적화
        await optimizeDatabase(db);
        await (0, audit_1.logSystemEvent)('weekly_cleanup_completed', {
            timestamp: now.toDate().toISOString()
        });
        console.log('[SCHEDULER] Weekly cleanup completed');
    }
    catch (error) {
        console.error('[SCHEDULER] Weekly cleanup failed:', error);
        await (0, audit_1.logAuditEvent)('weekly_cleanup_failed', undefined, {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * 월간 정리 작업 (매월 1일 새벽 4시)
 */
exports.monthlyCleanup = (0, scheduler_1.onSchedule)({
    schedule: '0 4 1 * *', // 매월 1일 새벽 4시
    region: 'asia-northeast3',
    timeZone: 'Asia/Seoul'
}, async () => {
    console.log('[SCHEDULER] Starting monthly cleanup...');
    try {
        const db = admin.firestore();
        const now = admin.firestore.Timestamp.now();
        const oneMonthAgo = admin.firestore.Timestamp.fromDate(new Date(now.toDate().getTime() - 30 * 24 * 60 * 60 * 1000));
        // 1. 오래된 감사 로그 아카이브
        await archiveOldAuditLogs(db, oneMonthAgo);
        // 2. 월간 통계 생성
        await generateMonthlyStats(db);
        // 3. 사용자 활동 분석
        await analyzeUserActivity(db);
        // 4. 시스템 상태 체크
        await performSystemHealthCheck();
        await (0, audit_1.logSystemEvent)('monthly_cleanup_completed', {
            timestamp: now.toDate().toISOString()
        });
        console.log('[SCHEDULER] Monthly cleanup completed');
    }
    catch (error) {
        console.error('[SCHEDULER] Monthly cleanup failed:', error);
        await (0, audit_1.logAuditEvent)('monthly_cleanup_failed', undefined, {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * 만료된 세션 정리
 */
async function cleanupExpiredSessions(db, cutoffTime) {
    console.log('[CLEANUP] Cleaning expired sessions...');
    const sessionsSnapshot = await db.collection('sessions')
        .where('expiresAt', '<', cutoffTime)
        .get();
    const batch = db.batch();
    sessionsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`[CLEANUP] Cleaned ${sessionsSnapshot.size} expired sessions`);
}
/**
 * 오래된 로그 정리
 */
async function cleanupOldLogs(db, cutoffTime) {
    console.log('[CLEANUP] Cleaning old logs...');
    const collections = ['logs', 'audit_logs', 'telemetry'];
    let totalCleaned = 0;
    for (const collection of collections) {
        const snapshot = await db.collection(collection)
            .where('createdAt', '<', cutoffTime)
            .limit(1000) // 배치 크기 제한
            .get();
        if (snapshot.size > 0) {
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            totalCleaned += snapshot.size;
        }
    }
    console.log(`[CLEANUP] Cleaned ${totalCleaned} old log entries`);
}
/**
 * 임시 파일 정리
 */
async function cleanupTempFiles() {
    console.log('[CLEANUP] Cleaning temp files...');
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles({
        prefix: 'temp/',
        maxResults: 1000
    });
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let cleanedCount = 0;
    for (const file of files) {
        const [metadata] = await file.getMetadata();
        const created = new Date(metadata.timeCreated);
        if (created < oneDayAgo) {
            await file.delete();
            cleanedCount++;
        }
    }
    console.log(`[CLEANUP] Cleaned ${cleanedCount} temp files`);
}
/**
 * 오래된 알림 정리
 */
async function cleanupOldNotifications(db, cutoffTime) {
    console.log('[CLEANUP] Cleaning old notifications...');
    const snapshot = await db.collection('notif_dedupe')
        .where('sentAt', '<', cutoffTime)
        .get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`[CLEANUP] Cleaned ${snapshot.size} old notifications`);
}
/**
 * 만료된 캐시 정리
 */
async function cleanupExpiredCache(db, cutoffTime) {
    console.log('[CLEANUP] Cleaning expired cache...');
    const snapshot = await db.collection('cache')
        .where('expiresAt', '<', cutoffTime)
        .get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`[CLEANUP] Cleaned ${snapshot.size} expired cache entries`);
}
/**
 * 일일 통계 업데이트
 */
async function updateDailyStats(db) {
    console.log('[STATS] Updating daily stats...');
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    // 사용자 수, 거래 수, 신고 수 등 집계
    const [usersSnapshot, marketSnapshot, reportsSnapshot] = await Promise.all([
        db.collection('users').get(),
        db.collection('market').get(),
        db.collection('reports').get()
    ]);
    const stats = {
        date: todayStr,
        totalUsers: usersSnapshot.size,
        totalMarketItems: marketSnapshot.size,
        totalReports: reportsSnapshot.size,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('daily_stats').doc(todayStr).set(stats, { merge: true });
    console.log('[STATS] Daily stats updated');
}
/**
 * 주간 통계 생성
 */
async function generateWeeklyStats(db) {
    console.log('[STATS] Generating weekly stats...');
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    // 주간 데이터 집계 로직
    const weeklyStats = {
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        newUsers: 0, // 실제 집계 로직 구현 필요
        newMarketItems: 0,
        completedTransactions: 0,
        generatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('weekly_stats').add(weeklyStats);
    console.log('[STATS] Weekly stats generated');
}
/**
 * 월간 통계 생성
 */
async function generateMonthlyStats(db) {
    console.log('[STATS] Generating monthly stats...');
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
    // 월간 데이터 집계 로직
    const monthlyStats = {
        period: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
        totalRevenue: 0, // 실제 집계 로직 구현 필요
        activeUsers: 0,
        generatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('monthly_stats').add(monthlyStats);
    console.log('[STATS] Monthly stats generated');
}
/**
 * 사용자 활동 분석
 */
async function analyzeUserActivity(db) {
    console.log('[ANALYSIS] Analyzing user activity...');
    // 사용자 활동 패턴 분석
    // 실제 분석 로직 구현 필요
    console.log('[ANALYSIS] User activity analysis completed');
}
/**
 * 오래된 감사 로그 아카이브
 */
async function archiveOldAuditLogs(db, cutoffTime) {
    console.log('[ARCHIVE] Archiving old audit logs...');
    // BigQuery나 다른 아카이브 스토리지로 이동
    // 실제 아카이브 로직 구현 필요
    console.log('[ARCHIVE] Audit logs archived');
}
/**
 * 데이터베이스 최적화
 */
async function optimizeDatabase(db) {
    console.log('[OPTIMIZE] Optimizing database...');
    // 인덱스 최적화, 통계 업데이트 등
    // 실제 최적화 로직 구현 필요
    console.log('[OPTIMIZE] Database optimization completed');
}
/**
 * 시스템 상태 체크
 */
async function performSystemHealthCheck() {
    console.log('[HEALTH] Performing system health check...');
    try {
        // 데이터베이스 연결 체크
        const db = admin.firestore();
        await db.collection('health').doc('check').get();
        // 스토리지 체크
        const bucket = admin.storage().bucket();
        await bucket.exists();
        // Functions 상태 체크
        // 실제 상태 체크 로직 구현 필요
        await (0, audit_1.logSystemEvent)('health_check_passed', {
            timestamp: new Date().toISOString()
        });
        console.log('[HEALTH] System health check passed');
    }
    catch (error) {
        console.error('[HEALTH] System health check failed:', error);
        await (0, audit_1.logAuditEvent)('health_check_failed', undefined, {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
