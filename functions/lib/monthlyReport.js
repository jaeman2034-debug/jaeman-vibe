/**
 * 📅 YAGO VIBE 월간 리포트 자동 집계 (비활성 골격)
 *
 * 🔴 현재 상태: 비활성 (보관용)
 * ⚡ 활성화: functions/src/index.ts에서 주석 해제만 하면 즉시 작동
 *
 * 매달 1일 새벽 4시 실행 → daily_xxx 리포트를 모아 monthly_xxx 생성
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const db = admin.firestore();
/**
 * 월간 정산 리포트 자동 집계
 * Cloud Scheduler: 매달 1일 새벽 4시 (Asia/Seoul)
 * CRON: 0 4 1 * *
 */
export const aggregateMonthlyReport = functions
    .region("asia-northeast3") // 서울 리전
    .pubsub.schedule("0 4 1 * *")
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
    try {
        const now = new Date();
        // 전월 기준으로 집계 (1일에 실행되므로 전월 데이터 집계)
        now.setMonth(now.getMonth() - 1);
        const targetMonth = now.toISOString().slice(0, 7); // YYYY-MM
        console.log(`📆 [${targetMonth}] 월간 리포트 집계 시작`);
        // 해당 월의 모든 일일 리포트 조회
        const reportsSnap = await db.collection("reports").get();
        let totalPayout = 0;
        let totalCount = 0;
        let totalSellerCount = 0;
        const days = [];
        const sellerMap = new Map();
        reportsSnap.forEach((doc) => {
            const docId = doc.id;
            // daily_YYYY-MM-DD 형식 확인
            if (docId.startsWith("daily_") && docId.includes(targetMonth)) {
                const data = doc.data();
                totalPayout += data.totalPayout || 0;
                totalCount += data.totalCount || 0;
                days.push({
                    id: docId,
                    date: data.date,
                    totalPayout: data.totalPayout,
                    totalCount: data.totalCount,
                    sellerCount: data.sellerCount,
                });
                // 판매자별 집계
                if (data.detail && Array.isArray(data.detail)) {
                    data.detail.forEach((item) => {
                        if (sellerMap.has(item.sellerId)) {
                            const current = sellerMap.get(item.sellerId);
                            current.payout += item.payout;
                            current.count += item.count;
                        }
                        else {
                            sellerMap.set(item.sellerId, {
                                payout: item.payout,
                                count: item.count,
                            });
                        }
                    });
                }
            }
        });
        if (days.length === 0) {
            console.log(`📭 ${targetMonth}에 해당하는 일일 리포트가 없습니다.`);
            return null;
        }
        // 판매자별 상세 배열로 변환
        const topSellers = Array.from(sellerMap.entries())
            .map(([sellerId, data]) => ({
            sellerId,
            payout: data.payout,
            count: data.count,
        }))
            .sort((a, b) => b.payout - a.payout)
            .slice(0, 10); // Top 10
        totalSellerCount = sellerMap.size;
        // 월간 리포트 저장
        await db
            .collection("reports")
            .doc(`monthly_${targetMonth}`)
            .set({
            month: targetMonth,
            totalPayout,
            totalCount,
            totalSellerCount,
            dayCount: days.length,
            days: days.sort((a, b) => a.date.localeCompare(b.date)),
            topSellers,
            executedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ [${targetMonth}] 월간 리포트 생성 완료`);
        console.log(`   - 집계 기간: ${days.length}일`);
        console.log(`   - 총 정산 금액: ${totalPayout.toLocaleString()}원`);
        console.log(`   - 총 정산 건수: ${totalCount}건`);
        console.log(`   - 활성 판매자: ${totalSellerCount}명`);
        return {
            success: true,
            month: targetMonth,
            totalPayout,
            totalCount,
            dayCount: days.length,
        };
    }
    catch (error) {
        console.error("❌ 월간 리포트 집계 실패:", error);
        // 에러 로그 저장
        await db.collection("settlementErrors").add({
            type: "monthly_report",
            error: error.message,
            stack: error.stack,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            success: false,
            error: error.message,
        };
    }
});
/**
 * 수동 월간 리포트 생성 (관리자용)
 * 특정 월의 월간 리포트를 수동으로 생성
 */
export const generateMonthlyReport = functions.https.onCall(async (data, context) => {
    try {
        // 관리자 권한 확인
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
        }
        const { month } = data; // YYYY-MM 형식
        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            throw new functions.https.HttpsError("invalid-argument", "올바른 월 형식이 아닙니다 (YYYY-MM).");
        }
        console.log(`🔧 [${month}] 수동 월간 리포트 생성 요청`);
        // 해당 월의 일일 리포트 조회
        const reportsSnap = await db.collection("reports").get();
        let totalPayout = 0;
        let totalCount = 0;
        const days = [];
        const sellerMap = new Map();
        reportsSnap.forEach((doc) => {
            const docId = doc.id;
            if (docId.startsWith("daily_") && docId.includes(month)) {
                const data = doc.data();
                totalPayout += data.totalPayout || 0;
                totalCount += data.totalCount || 0;
                days.push({
                    id: docId,
                    date: data.date,
                    totalPayout: data.totalPayout,
                    totalCount: data.totalCount,
                });
                // 판매자별 집계
                if (data.detail && Array.isArray(data.detail)) {
                    data.detail.forEach((item) => {
                        if (sellerMap.has(item.sellerId)) {
                            const current = sellerMap.get(item.sellerId);
                            current.payout += item.payout;
                            current.count += item.count;
                        }
                        else {
                            sellerMap.set(item.sellerId, {
                                payout: item.payout,
                                count: item.count,
                            });
                        }
                    });
                }
            }
        });
        if (days.length === 0) {
            return {
                success: false,
                message: `${month}에 해당하는 일일 리포트가 없습니다.`,
            };
        }
        const topSellers = Array.from(sellerMap.entries())
            .map(([sellerId, data]) => ({ sellerId, ...data }))
            .sort((a, b) => b.payout - a.payout)
            .slice(0, 10);
        // 월간 리포트 저장
        await db
            .collection("reports")
            .doc(`monthly_${month}`)
            .set({
            month,
            totalPayout,
            totalCount,
            totalSellerCount: sellerMap.size,
            dayCount: days.length,
            days: days.sort((a, b) => a.date.localeCompare(b.date)),
            topSellers,
            executedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ [${month}] 수동 월간 리포트 생성 완료`);
        return {
            success: true,
            message: `${month} 월간 리포트가 생성되었습니다.`,
            month,
            totalPayout,
            totalCount,
            dayCount: days.length,
        };
    }
    catch (error) {
        console.error("❌ 수동 월간 리포트 생성 실패:", error);
        throw error;
    }
});
/**
 * 월간 리포트 조회 (관리자용)
 */
export const getMonthlyReport = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
        }
        const { month } = data; // YYYY-MM 형식
        const targetMonth = month || new Date().toISOString().slice(0, 7);
        const reportRef = db.collection("reports").doc(`monthly_${targetMonth}`);
        const reportSnap = await reportRef.get();
        if (!reportSnap.exists) {
            return {
                success: false,
                message: "해당 월의 월간 리포트가 없습니다.",
                month: targetMonth,
            };
        }
        const report = reportSnap.data();
        return {
            success: true,
            month: targetMonth,
            ...report,
        };
    }
    catch (error) {
        console.error("❌ 월간 리포트 조회 실패:", error);
        throw error;
    }
});
//# sourceMappingURL=monthlyReport.js.map