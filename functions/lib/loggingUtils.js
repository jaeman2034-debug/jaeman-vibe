import * as admin from "firebase-admin";
/**
 * 📊 관리자 대시보드용 로깅 유틸리티
 * 모든 Functions에서 사용할 수 있는 공통 로깅 함수들
 */
// Firebase Admin 초기화 (이미 초기화되어 있다면 무시)
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * 푸시 알림 전송 로그 기록
 */
export async function logPush(payload) {
    try {
        await db.collection("notificationLogs").add({
            type: "push",
            title: payload.title,
            body: payload.body,
            tokenCount: payload.tokens.length,
            successCount: payload.successCount || 0,
            failureCount: payload.failureCount || 0,
            data: payload.data || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log("📊 푸시 알림 로그 저장 완료");
    }
    catch (error) {
        console.error("❌ 푸시 알림 로그 저장 실패:", error);
    }
}
/**
 * 브리핑 전송 로그 기록
 */
export async function logBriefing(payload) {
    try {
        await db.collection("briefingLogs").add({
            summary: payload.summary,
            audience: payload.audience,
            sentCount: payload.sentCount,
            itemCount: payload.itemCount,
            teamCount: payload.teamCount,
            totalCount: payload.totalCount,
            data: payload.data || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log("📊 브리핑 로그 저장 완료");
    }
    catch (error) {
        console.error("❌ 브리핑 로그 저장 실패:", error);
    }
}
/**
 * 에러 로그 기록
 */
export async function logError(source, err, meta, severity = 'medium') {
    try {
        await db.collection("errors").add({
            source,
            message: String((err === null || err === void 0 ? void 0 : err.message) || err),
            stack: (err === null || err === void 0 ? void 0 : err.stack) || null,
            severity,
            meta: meta !== null && meta !== void 0 ? meta : null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`📊 에러 로그 저장 완료: ${source}`);
    }
    catch (error) {
        console.error("❌ 에러 로그 저장 실패:", error);
    }
}
/**
 * 사용자 활동 로그 기록
 */
export async function logUserActivity(payload) {
    try {
        await db.collection("userActivities").add({
            userId: payload.userId,
            activity: payload.activity,
            details: payload.details || null,
            location: payload.location || null,
            sessionId: payload.sessionId || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`📊 사용자 활동 로그 저장 완료: ${payload.activity}`);
    }
    catch (error) {
        console.error("❌ 사용자 활동 로그 저장 실패:", error);
    }
}
/**
 * AI 요청 로그 기록
 */
export async function logAIRequest(payload) {
    try {
        await db.collection("aiRequests").add({
            type: payload.type,
            input: payload.input,
            output: payload.output,
            model: payload.model,
            tokensUsed: payload.tokensUsed || 0,
            processingTime: payload.processingTime || 0,
            userId: payload.userId || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`📊 AI 요청 로그 저장 완료: ${payload.type}`);
    }
    catch (error) {
        console.error("❌ AI 요청 로그 저장 실패:", error);
    }
}
/**
 * 시스템 성능 로그 기록
 */
export async function logPerformance(payload) {
    try {
        await db.collection("performanceLogs").add({
            functionName: payload.functionName,
            executionTime: payload.executionTime,
            memoryUsed: payload.memoryUsed || 0,
            success: payload.success,
            errorMessage: payload.errorMessage || null,
            metadata: payload.metadata || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`📊 성능 로그 저장 완료: ${payload.functionName}`);
    }
    catch (error) {
        console.error("❌ 성능 로그 저장 실패:", error);
    }
}
/**
 * 일일 통계 업데이트
 */
export async function updateDailyStats(date, stats) {
    try {
        const docRef = db.collection("dailyStats").doc(date);
        await docRef.set({
            date,
            ...stats,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log(`📊 일일 통계 업데이트 완료: ${date}`);
    }
    catch (error) {
        console.error("❌ 일일 통계 업데이트 실패:", error);
    }
}
/**
 * 실시간 메트릭 업데이트
 */
export async function updateRealtimeMetrics(metrics) {
    try {
        await db.collection("realtimeMetrics").doc("current").set({
            ...metrics,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log("📊 실시간 메트릭 업데이트 완료");
    }
    catch (error) {
        console.error("❌ 실시간 메트릭 업데이트 실패:", error);
    }
}
/**
 * 로그 정리 함수 (30일 이상 된 로그 삭제)
 */
export async function cleanupOldLogs() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const collections = [
            "notificationLogs",
            "aiRequests",
            "performanceLogs",
            "userActivities"
        ];
        for (const collectionName of collections) {
            const oldLogs = await db
                .collection(collectionName)
                .where("createdAt", "<", admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
                .get();
            if (!oldLogs.empty) {
                const batch = db.batch();
                oldLogs.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                console.log(`🗑️ ${collectionName}: ${oldLogs.size}개 로그 정리 완료`);
            }
        }
        console.log("✅ 오래된 로그 정리 완료");
    }
    catch (error) {
        console.error("❌ 로그 정리 실패:", error);
    }
}
/**
 * 대시보드용 집계 데이터 생성
 */
export async function generateDashboardMetrics() {
    try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        // 오늘 통계 계산
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        const [itemsSnapshot, sessionsSnapshot, notificationsSnapshot, errorsSnapshot, aiRequestsSnapshot] = await Promise.all([
            db.collection("marketItems")
                .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(todayStart))
                .get(),
            db.collection("voiceSessions")
                .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(todayStart))
                .get(),
            db.collection("notificationLogs")
                .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(todayStart))
                .where("type", "==", "push")
                .get(),
            db.collection("errors")
                .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(todayStart))
                .get(),
            db.collection("aiRequests")
                .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(todayStart))
                .get()
        ]);
        const stats = {
            newItems: itemsSnapshot.size,
            newSessions: sessionsSnapshot.size,
            pushSent: notificationsSnapshot.size,
            errors: errorsSnapshot.size,
            aiRequests: aiRequestsSnapshot.size,
            uniqueUsers: new Set(sessionsSnapshot.docs.map(d => d.data().createdBy)).size
        };
        await updateDailyStats(todayStr, stats);
        console.log("📊 대시보드 메트릭 생성 완료:", stats);
        return stats;
    }
    catch (error) {
        console.error("❌ 대시보드 메트릭 생성 실패:", error);
        return null;
    }
}
//# sourceMappingURL=loggingUtils.js.map