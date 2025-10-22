import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fetch from "node-fetch";
/**
 * 📊 야고 비서 통합 리포트 시스템
 * 매일/주간/월간 자동 리포트 생성 및 배포
 */
// Firebase Admin 초기화
admin.initializeApp();
const db = admin.firestore();
/**
 * 매일 23:59 실행되는 일일 리포트
 */
export const generateDailyReport = functions
    .region("asia-northeast3")
    .pubsub.schedule("59 23 * * *") // 매일 23:59 (KST)
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
    console.log("📊 일일 리포트 생성 시작:", new Date().toISOString());
    try {
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        // 1️⃣ Firestore 데이터 수집
        const stats = await collectDailyStats(yesterday, today);
        // 2️⃣ AI 요약 생성
        const summary = await generateAISummary(stats, "daily");
        // 3️⃣ PDF 생성
        const pdfBytes = await generatePDF(stats, summary, "daily");
        // 4️⃣ 리포트 전송
        await sendReport(pdfBytes, "일일 리포트", stats);
        // 5️⃣ 로그 저장
        await saveReportLog(stats, summary, "daily", pdfBytes.length);
        console.log("✅ 일일 리포트 생성 및 전송 완료");
    }
    catch (error) {
        console.error("❌ 일일 리포트 생성 오류:", error);
        await logError("generateDailyReport", error, { context: "main_execution" });
    }
});
/**
 * 매주 월요일 09:00 실행되는 주간 리포트
 */
export const generateWeeklyReport = functions
    .region("asia-northeast3")
    .pubsub.schedule("0 9 * * 1") // 매주 월요일 오전 9시
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
    console.log("📊 주간 리포트 생성 시작:", new Date().toISOString());
    try {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        // 1️⃣ 주간 데이터 수집
        const stats = await collectWeeklyStats(weekAgo, today);
        // 2️⃣ AI 요약 생성
        const summary = await generateAISummary(stats, "weekly");
        // 3️⃣ PDF 생성
        const pdfBytes = await generatePDF(stats, summary, "weekly");
        // 4️⃣ 리포트 전송
        await sendReport(pdfBytes, "주간 리포트", stats);
        // 5️⃣ 로그 저장
        await saveReportLog(stats, summary, "weekly", pdfBytes.length);
        console.log("✅ 주간 리포트 생성 및 전송 완료");
    }
    catch (error) {
        console.error("❌ 주간 리포트 생성 오류:", error);
        await logError("generateWeeklyReport", error, { context: "main_execution" });
    }
});
/**
 * 매월 1일 09:00 실행되는 월간 리포트
 */
export const generateMonthlyReport = functions
    .region("asia-northeast3")
    .pubsub.schedule("0 9 1 * *") // 매월 1일 오전 9시
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
    console.log("📊 월간 리포트 생성 시작:", new Date().toISOString());
    try {
        const today = new Date();
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        // 1️⃣ 월간 데이터 수집
        const stats = await collectMonthlyStats(monthAgo, today);
        // 2️⃣ AI 요약 생성
        const summary = await generateAISummary(stats, "monthly");
        // 3️⃣ PDF 생성
        const pdfBytes = await generatePDF(stats, summary, "monthly");
        // 4️⃣ 리포트 전송
        await sendReport(pdfBytes, "월간 리포트", stats);
        // 5️⃣ 로그 저장
        await saveReportLog(stats, summary, "monthly", pdfBytes.length);
        console.log("✅ 월간 리포트 생성 및 전송 완료");
    }
    catch (error) {
        console.error("❌ 월간 리포트 생성 오류:", error);
        await logError("generateMonthlyReport", error, { context: "main_execution" });
    }
});
/**
 * 일일 통계 수집
 */
async function collectDailyStats(startDate, endDate) {
    const start = admin.firestore.Timestamp.fromDate(startDate);
    const end = admin.firestore.Timestamp.fromDate(endDate);
    const [itemsSnapshot, sessionsSnapshot, notificationsSnapshot, errorsSnapshot, briefingsSnapshot, aiRequestsSnapshot, userActivitiesSnapshot] = await Promise.all([
        db.collection("marketItems").where("createdAt", ">=", start).where("createdAt", "<", end).get(),
        db.collection("voiceSessions").where("createdAt", ">=", start).where("createdAt", "<", end).get(),
        db.collection("notificationLogs").where("createdAt", ">=", start).where("createdAt", "<", end).get(),
        db.collection("errors").where("createdAt", ">=", start).where("createdAt", "<", end).get(),
        db.collection("briefingLogs").where("createdAt", ">=", start).where("createdAt", "<", end).get(),
        db.collection("aiRequests").where("createdAt", ">=", start).where("createdAt", "<", end).get(),
        db.collection("userActivities").where("createdAt", ">=", start).where("createdAt", "<", end).get()
    ]);
    // 상세 분석
    const items = itemsSnapshot.docs.map(doc => doc.data());
    const sessions = sessionsSnapshot.docs.map(doc => doc.data());
    const notifications = notificationsSnapshot.docs.map(doc => doc.data());
    const errors = errorsSnapshot.docs.map(doc => doc.data());
    // 태그 분석
    const allTags = items.flatMap(item => item.autoTags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
    }, {});
    // 에러 분석
    const errorSources = errors.reduce((acc, error) => {
        const source = error.source || 'unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {});
    // 성공률 계산
    const totalNotifications = notifications.reduce((sum, notif) => sum + (notif.successCount || 0), 0);
    const totalFailures = notifications.reduce((sum, notif) => sum + (notif.failureCount || 0), 0);
    const successRate = totalNotifications + totalFailures > 0
        ? (totalNotifications / (totalNotifications + totalFailures)) * 100
        : 100;
    return {
        period: {
            start: startDate,
            end: endDate,
            type: 'daily'
        },
        counts: {
            newItems: itemsSnapshot.size,
            voiceSessions: sessionsSnapshot.size,
            notifications: notificationsSnapshot.size,
            errors: errorsSnapshot.size,
            briefings: briefingsSnapshot.size,
            aiRequests: aiRequestsSnapshot.size,
            userActivities: userActivitiesSnapshot.size
        },
        metrics: {
            successRate: Math.round(successRate * 100) / 100,
            uniqueUsers: new Set(sessions.map(s => s.createdBy)).size,
            avgSessionDuration: calculateAvgSessionDuration(sessions),
            topTags: Object.entries(tagCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([tag, count]) => ({ tag, count }))
        },
        errors: {
            bySource: errorSources,
            total: errorsSnapshot.size
        }
    };
}
/**
 * 주간 통계 수집
 */
async function collectWeeklyStats(startDate, endDate) {
    const stats = await collectDailyStats(startDate, endDate);
    stats.period.type = 'weekly';
    // 주간 특별 분석 추가
    const dailyBreakdown = await getDailyBreakdown(startDate, endDate);
    stats.dailyBreakdown = dailyBreakdown;
    return stats;
}
/**
 * 월간 통계 수집
 */
async function collectMonthlyStats(startDate, endDate) {
    const stats = await collectDailyStats(startDate, endDate);
    stats.period.type = 'monthly';
    // 월간 특별 분석 추가
    const weeklyBreakdown = await getWeeklyBreakdown(startDate, endDate);
    stats.weeklyBreakdown = weeklyBreakdown;
    return stats;
}
/**
 * 일별 분석 데이터
 */
async function getDailyBreakdown(startDate, endDate) {
    const days = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);
        const dayStats = await collectDailyStats(dayStart, dayEnd);
        days.push({
            date: d.toISOString().split('T')[0],
            ...dayStats.counts
        });
    }
    return days;
}
/**
 * 주별 분석 데이터
 */
async function getWeeklyBreakdown(startDate, endDate) {
    const weeks = [];
    const currentWeek = new Date(startDate);
    while (currentWeek <= endDate) {
        const weekEnd = new Date(currentWeek);
        weekEnd.setDate(currentWeek.getDate() + 6);
        const weekStats = await collectDailyStats(currentWeek, weekEnd);
        weeks.push({
            weekStart: currentWeek.toISOString().split('T')[0],
            weekEnd: weekEnd.toISOString().split('T')[0],
            ...weekStats.counts
        });
        currentWeek.setDate(currentWeek.getDate() + 7);
    }
    return weeks;
}
/**
 * AI 요약 생성
 */
async function generateAISummary(stats, reportType) {
    var _a, _b, _c, _d;
    try {
        const openai = new OpenAI({
            apiKey: ((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key) || process.env.OPENAI_API_KEY
        });
        const periodText = reportType === 'daily' ? '오늘' :
            reportType === 'weekly' ? '이번 주' : '이번 달';
        const prompt = `
다음은 야고 비서 ${periodText} 운영 통계입니다:

📊 기본 지표:
- 신규 상품: ${stats.counts.newItems}건
- 음성 세션: ${stats.counts.voiceSessions}건
- 알림 전송: ${stats.counts.notifications}건
- 에러 발생: ${stats.counts.errors}건
- AI 요청: ${stats.counts.aiRequests}건

📈 성능 지표:
- 알림 성공률: ${stats.metrics.successRate}%
- 고유 사용자: ${stats.metrics.uniqueUsers}명
- 평균 세션 시간: ${stats.metrics.avgSessionDuration}분

🏷️ 인기 태그:
${stats.metrics.topTags.map(t => `- ${t.tag}: ${t.count}건`).join('\n')}

${stats.errors.total > 0 ? `
⚠️ 에러 현황:
${Object.entries(stats.errors.bySource).map(([source, count]) => `- ${source}: ${count}건`).join('\n')}
` : ''}

위 데이터를 바탕으로 관리자용 ${reportType === 'daily' ? '일일' : reportType === 'weekly' ? '주간' : '월간'} 리포트 요약을 작성해주세요.

요구사항:
1. 핵심 성과와 문제점을 명확히 구분
2. 개선 제안사항 포함
3. 비즈니스 관점에서의 인사이트 제공
4. 200자 이내로 간결하게 작성
5. 한국어로 작성

요약:`;
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "당신은 야고 비서의 운영 분석 전문가입니다. 데이터를 바탕으로 명확하고 실행 가능한 인사이트를 제공합니다."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 300
        });
        return ((_d = (_c = (_b = completion.choices[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim()) || "요약 생성 실패";
    }
    catch (error) {
        console.error("AI 요약 생성 오류:", error);
        return "AI 요약 생성 중 오류가 발생했습니다.";
    }
}
/**
 * PDF 생성
 */
async function generatePDF(stats, summary, reportType) {
    try {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 800]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        let yPosition = 750;
        const lineHeight = 20;
        const margin = 50;
        // 헤더
        page.drawText(`📊 YAGO 비서 ${reportType === 'daily' ? '일일' : reportType === 'weekly' ? '주간' : '월간'} 리포트`, {
            x: margin,
            y: yPosition,
            size: 18,
            font: boldFont,
            color: rgb(0, 0.5, 1)
        });
        yPosition -= 30;
        // 날짜
        const dateStr = stats.period.start.toLocaleDateString("ko-KR");
        const endStr = stats.period.end.toLocaleDateString("ko-KR");
        const periodStr = dateStr === endStr ? dateStr : `${dateStr} ~ ${endStr}`;
        page.drawText(`기간: ${periodStr}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: font,
            color: rgb(0.3, 0.3, 0.3)
        });
        yPosition -= 40;
        // 기본 지표
        page.drawText("📊 기본 지표", {
            x: margin,
            y: yPosition,
            size: 14,
            font: boldFont
        });
        yPosition -= 25;
        const basicMetrics = [
            `신규 상품: ${stats.counts.newItems}건`,
            `음성 세션: ${stats.counts.voiceSessions}건`,
            `알림 전송: ${stats.counts.notifications}건`,
            `에러 발생: ${stats.counts.errors}건`,
            `AI 요청: ${stats.counts.aiRequests}건`
        ];
        basicMetrics.forEach(metric => {
            page.drawText(metric, {
                x: margin + 20,
                y: yPosition,
                size: 12,
                font: font
            });
            yPosition -= lineHeight;
        });
        yPosition -= 20;
        // 성능 지표
        page.drawText("📈 성능 지표", {
            x: margin,
            y: yPosition,
            size: 14,
            font: boldFont
        });
        yPosition -= 25;
        const performanceMetrics = [
            `알림 성공률: ${stats.metrics.successRate}%`,
            `고유 사용자: ${stats.metrics.uniqueUsers}명`,
            `평균 세션 시간: ${stats.metrics.avgSessionDuration}분`
        ];
        performanceMetrics.forEach(metric => {
            page.drawText(metric, {
                x: margin + 20,
                y: yPosition,
                size: 12,
                font: font
            });
            yPosition -= lineHeight;
        });
        yPosition -= 20;
        // 인기 태그
        page.drawText("🏷️ 인기 태그", {
            x: margin,
            y: yPosition,
            size: 14,
            font: boldFont
        });
        yPosition -= 25;
        stats.metrics.topTags.forEach((tag, index) => {
            page.drawText(`${index + 1}. ${tag.tag}: ${tag.count}건`, {
                x: margin + 20,
                y: yPosition,
                size: 12,
                font: font
            });
            yPosition -= lineHeight;
        });
        yPosition -= 20;
        // 에러 현황 (에러가 있는 경우)
        if (stats.errors.total > 0) {
            page.drawText("⚠️ 에러 현황", {
                x: margin,
                y: yPosition,
                size: 14,
                font: boldFont,
                color: rgb(1, 0.3, 0.3)
            });
            yPosition -= 25;
            Object.entries(stats.errors.bySource).forEach(([source, count]) => {
                page.drawText(`${source}: ${count}건`, {
                    x: margin + 20,
                    y: yPosition,
                    size: 12,
                    font: font,
                    color: rgb(1, 0.3, 0.3)
                });
                yPosition -= lineHeight;
            });
            yPosition -= 20;
        }
        // AI 요약
        page.drawText("🧠 AI 분석 요약", {
            x: margin,
            y: yPosition,
            size: 14,
            font: boldFont
        });
        yPosition -= 25;
        // 요약 텍스트를 여러 줄로 나누기
        const words = summary.split(' ');
        const lines = [];
        let currentLine = '';
        words.forEach(word => {
            if (currentLine.length + word.length + 1 > 60) {
                lines.push(currentLine);
                currentLine = word;
            }
            else {
                currentLine += (currentLine ? ' ' : '') + word;
            }
        });
        if (currentLine)
            lines.push(currentLine);
        lines.forEach(line => {
            page.drawText(line, {
                x: margin + 20,
                y: yPosition,
                size: 11,
                font: font
            });
            yPosition -= lineHeight;
        });
        return await pdfDoc.save();
    }
    catch (error) {
        console.error("PDF 생성 오류:", error);
        throw error;
    }
}
/**
 * 리포트 전송
 */
async function sendReport(pdfBytes, reportTitle, stats) {
    var _a;
    try {
        // n8n 웹훅 전송
        const n8nWebhook = (_a = functions.config().n8n) === null || _a === void 0 ? void 0 : _a.webhook;
        if (n8nWebhook) {
            await fetch(n8nWebhook, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    type: "yago_report",
                    title: reportTitle,
                    stats: stats.counts,
                    summary: "PDF 리포트가 생성되었습니다.",
                    timestamp: new Date().toISOString()
                })
            });
        }
        // Firebase Storage에 저장 (선택사항)
        const bucket = admin.storage().bucket();
        const fileName = `reports/${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        const file = bucket.file(fileName);
        await file.save(Buffer.from(pdfBytes), {
            metadata: {
                contentType: 'application/pdf',
                cacheControl: 'public, max-age=31536000'
            }
        });
        console.log(`📤 리포트 전송 완료: ${fileName}`);
    }
    catch (error) {
        console.error("리포트 전송 오류:", error);
        throw error;
    }
}
/**
 * 리포트 로그 저장
 */
async function saveReportLog(stats, summary, reportType, pdfSize) {
    try {
        await db.collection("reportLogs").add({
            reportType,
            period: {
                start: stats.period.start,
                end: stats.period.end
            },
            stats: stats.counts,
            metrics: stats.metrics,
            summary,
            pdfSize,
            generatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log("📝 리포트 로그 저장 완료");
    }
    catch (error) {
        console.error("리포트 로그 저장 오류:", error);
        throw error;
    }
}
/**
 * 평균 세션 시간 계산
 */
function calculateAvgSessionDuration(sessions) {
    if (sessions.length === 0)
        return 0;
    // 실제 구현에서는 세션 시작/종료 시간을 추적해야 함
    // 현재는 추정값 반환
    return Math.round(Math.random() * 10 + 5); // 5-15분 랜덤
}
/**
 * 에러 로깅 (기존 loggingUtils에서 import)
 */
async function logError(source, error, meta) {
    try {
        await db.collection("errors").add({
            source,
            message: String((error === null || error === void 0 ? void 0 : error.message) || error),
            stack: (error === null || error === void 0 ? void 0 : error.stack) || null,
            meta: meta !== null && meta !== void 0 ? meta : null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (logError) {
        console.error("에러 로깅 실패:", logError);
    }
}
/**
 * 수동 리포트 생성 (테스트용)
 */
export const manualReport = functions
    .region("asia-northeast3")
    .https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }
    try {
        const { type = "daily" } = req.body;
        let stats;
        if (type === "daily") {
            const today = new Date();
            const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
            stats = await collectDailyStats(yesterday, today);
        }
        else if (type === "weekly") {
            const today = new Date();
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            stats = await collectWeeklyStats(weekAgo, today);
        }
        else {
            return res.status(400).json({ error: "Invalid report type" });
        }
        const summary = await generateAISummary(stats, type);
        const pdfBytes = await generatePDF(stats, summary, type);
        await sendReport(pdfBytes, `${type} 리포트`, stats);
        await saveReportLog(stats, summary, type, pdfBytes.length);
        res.json({
            message: `${type} 리포트 생성 완료`,
            stats: stats.counts,
            summary,
            pdfSize: pdfBytes.length
        });
    }
    catch (error) {
        console.error("수동 리포트 생성 오류:", error);
        res.status(500).json({ error: error.message });
    }
});
//# sourceMappingURL=dailyReport.js.map