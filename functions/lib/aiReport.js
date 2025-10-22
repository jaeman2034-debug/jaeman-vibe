/**
 * 🧠 YAGO VIBE AI 자동 리포트 생성 시스템
 *
 * 매주 월요일 새벽 4시 거래 데이터를 분석하여
 * AI가 자동으로 자연어 요약 리포트를 생성합니다.
 */
var _a;
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";
const db = admin.firestore();
// OpenAI 클라이언트 초기화
const openai = new OpenAI({
    apiKey: ((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.api_key) || process.env.OPENAI_API_KEY,
});
/**
 * 주간 AI 거래 리포트 자동 생성
 * Cloud Scheduler: 매주 월요일 새벽 4시 (Asia/Seoul)
 * CRON: 0 4 * * 1
 */
export const generateWeeklyReport = functions
    .region("asia-northeast3")
    .pubsub.schedule("0 4 * * 1")
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
    var _a;
    try {
        const now = new Date();
        const weekNumber = getWeekNumber(now);
        const reportId = `weekly_${now.getFullYear()}-W${weekNumber}`;
        console.log(`🧠 [${reportId}] AI 주간 리포트 생성 시작`);
        // 사용자 데이터 수집
        const usersSnap = await db.collection("users").get();
        let totalSales = 0;
        let trustSum = 0;
        let sellerCount = 0;
        const categoryCount = {};
        usersSnap.forEach((doc) => {
            const data = doc.data();
            if (data.totalSales && data.totalSales > 0) {
                totalSales += data.totalSales;
                trustSum += data.trustScore || 50;
                sellerCount++;
            }
            // 카테고리 집계 (tags 기반)
            if (data.tags && Array.isArray(data.tags)) {
                data.tags.forEach((tag) => {
                    categoryCount[tag] = (categoryCount[tag] || 0) + 1;
                });
            }
        });
        const avgTrust = sellerCount > 0 ? Math.round(trustSum / sellerCount) : 50;
        // 상위 카테고리 Top 3
        const topCategories = Object.entries(categoryCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([cat]) => cat);
        // 상품 데이터 수집
        const productsSnap = await db
            .collection("marketItems")
            .where("status", "==", "completed")
            .get();
        const completedCount = productsSnap.size;
        // 🧠 OpenAI로 AI 요약 생성
        let aiSummary = "";
        try {
            const prompt = `
다음은 YAGO VIBE 스포츠 마켓의 이번 주 거래 데이터입니다:

- 총 거래 건수: ${totalSales}건
- 완료된 거래: ${completedCount}건
- 활성 판매자: ${sellerCount}명
- 평균 신뢰도: ${avgTrust}점
- 인기 카테고리: ${topCategories.join(", ")}

이 데이터를 바탕으로 **한 줄로 간결하게** 거래 현황을 요약해주세요.
예시: "이번 주 ${totalSales}건 거래 완료, 평균 신뢰도 ${avgTrust}점으로 안정적 운영 중. ${topCategories[0]} 카테고리가 가장 활발합니다."
        `.trim();
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "당신은 거래 플랫폼의 데이터 분석가입니다. 간결하고 명확한 한국어로 비즈니스 리포트를 작성합니다."
                    },
                    {
                        role: "user",
                        content: prompt
                    },
                ],
                temperature: 0.7,
                max_tokens: 150,
            });
            aiSummary = ((_a = response.choices[0].message.content) === null || _a === void 0 ? void 0 : _a.trim()) || "";
            console.log("✅ AI 요약 생성:", aiSummary);
        }
        catch (aiError) {
            console.warn("⚠️ AI 요약 생성 실패, 기본 요약 사용:", aiError);
            aiSummary = `이번 주 총 ${totalSales}건 거래, 평균 신뢰도 ${avgTrust}점. ${topCategories[0] || "다양한"} 카테고리가 활발합니다.`;
        }
        // 리포트 저장
        await db.collection("reports").doc(reportId).set({
            week: reportId,
            totalSales,
            completedCount,
            sellerCount,
            avgTrust,
            topCategories,
            aiSummary,
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ [${reportId}] AI 주간 리포트 생성 완료`);
        console.log(`   - 총 거래: ${totalSales}건`);
        console.log(`   - 평균 신뢰도: ${avgTrust}점`);
        console.log(`   - AI 요약: ${aiSummary}`);
        return {
            success: true,
            reportId,
            aiSummary,
        };
    }
    catch (error) {
        console.error("❌ AI 주간 리포트 생성 실패:", error);
        return {
            success: false,
            error: error.message,
        };
    }
});
/**
 * 주간 번호 계산 헬퍼
 */
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}
/**
 * 수동 AI 리포트 생성 (관리자용)
 */
export const generateManualReport = functions.https.onCall(async (data, context) => {
    var _a;
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
        }
        console.log("🔧 수동 AI 리포트 생성 요청");
        // 현재 데이터 수집
        const usersSnap = await db.collection("users").get();
        const productsSnap = await db.collection("marketItems").get();
        let totalSales = 0;
        let trustSum = 0;
        let sellerCount = 0;
        usersSnap.forEach((doc) => {
            const data = doc.data();
            if (data.totalSales) {
                totalSales += data.totalSales;
                trustSum += data.trustScore || 50;
                sellerCount++;
            }
        });
        const avgTrust = sellerCount > 0 ? Math.round(trustSum / sellerCount) : 50;
        const totalProducts = productsSnap.size;
        // AI 요약 생성
        const prompt = `
YAGO VIBE 스포츠 마켓 현황:
- 전체 상품: ${totalProducts}개
- 총 거래: ${totalSales}건
- 활성 판매자: ${sellerCount}명
- 평균 신뢰도: ${avgTrust}점

이 데이터를 한 문장으로 요약해주세요.
    `.trim();
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "간결한 한국어 비즈니스 리포트 작성자" },
                { role: "user", content: prompt },
            ],
        });
        const aiSummary = ((_a = response.choices[0].message.content) === null || _a === void 0 ? void 0 : _a.trim()) || "";
        return {
            success: true,
            totalSales,
            avgTrust,
            sellerCount,
            totalProducts,
            aiSummary,
        };
    }
    catch (error) {
        console.error("❌ 수동 AI 리포트 생성 실패:", error);
        throw error;
    }
});
//# sourceMappingURL=aiReport.js.map