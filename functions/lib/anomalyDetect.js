import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import fetch from "node-fetch";
/**
 * 🚨 AI 이벤트 탐지 시스템
 * 실시간 활동량 급증/급감 감지 및 자동 알림
 */
// Firebase Admin 초기화
admin.initializeApp();
const db = admin.firestore();
/**
 * 30분마다 실행되는 이상 탐지
 */
export const detectAnomalies = functions
    .region("asia-northeast3")
    .pubsub.schedule("*/30 * * * *") // 30분마다 실행
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
    console.log("🚨 이상 탐지 시작:", new Date().toISOString());
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        // 1️⃣ 최근 1시간 데이터 수집
        const [recentVoiceSnap, recentMarketSnap, recentTeamSnap] = await Promise.all([
            db.collection("voiceSessions")
                .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(oneHourAgo))
                .get(),
            db.collection("marketItems")
                .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(oneHourAgo))
                .get(),
            db.collection("teamRecruitments")
                .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(oneHourAgo))
                .get()
        ]);
        // 2️⃣ 지난 7일 평균 데이터 수집
        const [weekVoiceSnap, weekMarketSnap, weekTeamSnap] = await Promise.all([
            db.collection("voiceSessions")
                .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
                .get(),
            db.collection("marketItems")
                .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
                .get(),
            db.collection("teamRecruitments")
                .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
                .get()
        ]);
        // 3️⃣ 데이터 변환
        const recentData = {
            voice: recentVoiceSnap.docs.map(d => d.data()),
            market: recentMarketSnap.docs.map(d => d.data()),
            team: recentTeamSnap.docs.map(d => d.data())
        };
        const weekData = {
            voice: weekVoiceSnap.docs.map(d => d.data()),
            market: weekMarketSnap.docs.map(d => d.data()),
            team: weekTeamSnap.docs.map(d => d.data())
        };
        // 4️⃣ 이상 탐지 실행
        const anomalies = await detectAnomaliesInData(recentData, weekData);
        if (anomalies.length === 0) {
            console.log("✅ 이상 탐지 완료: 이상 없음");
            return;
        }
        // 5️⃣ AI 분석
        const analysis = await generateAIAnalysis(anomalies);
        // 6️⃣ 알림 전송
        await sendAnomalyAlerts(anomalies, analysis);
        // 7️⃣ 로그 저장
        await saveAnomalyLog(anomalies, analysis);
        console.log(`✅ 이상 탐지 완료: ${anomalies.length}개 이상 감지`);
    }
    catch (error) {
        console.error("❌ 이상 탐지 오류:", error);
        await logError("detectAnomalies", error, { context: "main_execution" });
    }
});
/**
 * 데이터에서 이상 탐지
 */
async function detectAnomaliesInData(recentData, weekData) {
    const anomalies = [];
    // 데이터 타입별 처리
    const dataTypes = [
        { key: 'voice', label: '음성 세션' },
        { key: 'market', label: '상품 등록' },
        { key: 'team', label: '팀 모집' }
    ];
    for (const dataType of dataTypes) {
        const recent = recentData[dataType.key];
        const week = weekData[dataType.key];
        // 지역별 집계
        const recentAgg = aggregateByLocation(recent);
        const weekAgg = aggregateByLocation(week);
        // 이상 탐지
        Object.entries(recentAgg).forEach(([location, recentCount]) => {
            const weekAverage = weekAgg[location] ? weekAgg[location] / 7 : 0;
            if (weekAverage > 0) {
                const ratio = recentCount / weekAverage;
                // 급증 감지 (>150%)
                if (ratio > 1.5) {
                    const [lat, lng] = location.split(',').map(Number);
                    const severity = getSeverity(ratio);
                    anomalies.push({
                        location,
                        type: dataType.label,
                        recentCount: recentCount,
                        weekAverage,
                        ratio,
                        severity,
                        lat,
                        lng
                    });
                }
                // 급감 감지 (<50%) - 특별한 경우만
                if (ratio < 0.5 && weekAverage > 5) {
                    const [lat, lng] = location.split(',').map(Number);
                    anomalies.push({
                        location,
                        type: dataType.label,
                        recentCount: recentCount,
                        weekAverage,
                        ratio,
                        severity: 'medium',
                        lat,
                        lng
                    });
                }
            }
        });
    }
    // 심각도별 정렬
    return anomalies.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
    });
}
/**
 * 위치별 데이터 집계
 */
function aggregateByLocation(data) {
    const map = {};
    data.forEach(item => {
        var _a, _b, _c, _d;
        let lat, lng;
        // 위치 데이터 추출 (다양한 필드명 지원)
        if (((_a = item.geo) === null || _a === void 0 ? void 0 : _a.lat) && ((_b = item.geo) === null || _b === void 0 ? void 0 : _b.lng)) {
            lat = item.geo.lat;
            lng = item.geo.lng;
        }
        else if (((_c = item.location) === null || _c === void 0 ? void 0 : _c.latitude) && ((_d = item.location) === null || _d === void 0 ? void 0 : _d.longitude)) {
            lat = item.location.latitude;
            lng = item.location.longitude;
        }
        if (lat && lng) {
            // 0.01도 단위로 그리드화 (약 1km)
            const gridLat = Math.round(lat * 100) / 100;
            const gridLng = Math.round(lng * 100) / 100;
            const key = `${gridLat},${gridLng}`;
            map[key] = (map[key] || 0) + 1;
        }
    });
    return map;
}
/**
 * 심각도 계산
 */
function getSeverity(ratio) {
    if (ratio >= 5.0)
        return 'critical'; // 5배 이상
    if (ratio >= 3.0)
        return 'high'; // 3배 이상
    if (ratio >= 2.0)
        return 'medium'; // 2배 이상
    return 'low'; // 1.5배 이상
}
/**
 * AI 분석 생성
 */
async function generateAIAnalysis(anomalies) {
    var _a, _b, _c, _d;
    try {
        const openai = new OpenAI({
            apiKey: ((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key) || process.env.OPENAI_API_KEY
        });
        const prompt = `
다음은 야고 비서의 실시간 이상 탐지 결과입니다:

🚨 탐지된 이상 현상:
${anomalies.map((a, i) => `
${i + 1}. ${a.type} - 위치: ${a.location}
   - 최근 1시간: ${a.recentCount}건
   - 주간 평균: ${a.weekAverage.toFixed(1)}건
   - 증가율: ${(a.ratio * 100).toFixed(0)}%
   - 심각도: ${a.severity}
`).join('')}

위 데이터를 바탕으로 다음을 분석해주세요:

1. 각 지역별로 어떤 이벤트가 발생했을 가능성이 있는지 추론
2. 시간대와 활동 패턴을 고려한 맥락적 해석
3. 관리자에게 제공할 실행 가능한 인사이트
4. 비즈니스 관점에서의 의미

요구사항:
- 한국어로 작성
- 200자 이내로 간결하게
- 구체적이고 실행 가능한 내용
- 전문적이면서도 이해하기 쉽게

분석 결과:`;
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "당신은 야고 비서의 데이터 분석 전문가입니다. 이상 탐지 결과를 바탕으로 명확하고 실행 가능한 인사이트를 제공합니다."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 300
        });
        return ((_d = (_c = (_b = completion.choices[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim()) || "AI 분석 생성 실패";
    }
    catch (error) {
        console.error("AI 분석 생성 오류:", error);
        return "AI 분석 생성 중 오류가 발생했습니다.";
    }
}
/**
 * 이상 탐지 알림 전송
 */
async function sendAnomalyAlerts(anomalies, analysis) {
    var _a, _b;
    try {
        // n8n 웹훅 전송
        const n8nWebhook = (_a = functions.config().n8n) === null || _a === void 0 ? void 0 : _a.webhook_alert;
        if (n8nWebhook) {
            await fetch(n8nWebhook, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "anomaly_detection",
                    title: "🚨 야고 비서 이상 탐지 알림",
                    message: analysis,
                    anomalies: anomalies.map(a => ({
                        location: a.location,
                        type: a.type,
                        ratio: a.ratio,
                        severity: a.severity,
                        count: a.recentCount
                    })),
                    timestamp: new Date().toISOString(),
                    criticalCount: anomalies.filter(a => a.severity === 'critical').length,
                    totalCount: anomalies.length
                })
            });
        }
        // Firebase FCM으로 관리자 알림
        await sendFCMAlert(anomalies, analysis);
        // Slack 알림 (선택사항)
        const slackWebhook = (_b = functions.config().slack) === null || _b === void 0 ? void 0 : _b.webhook;
        if (slackWebhook) {
            await sendSlackAlert(anomalies, analysis, slackWebhook);
        }
        console.log("📤 이상 탐지 알림 전송 완료");
    }
    catch (error) {
        console.error("알림 전송 오류:", error);
        throw error;
    }
}
/**
 * FCM 관리자 알림
 */
async function sendFCMAlert(anomalies, analysis) {
    try {
        // 관리자 토큰 목록 조회
        const adminTokensSnap = await db.collection("adminTokens").get();
        const adminTokens = adminTokensSnap.docs.map(doc => doc.data().fcmToken).filter(Boolean);
        if (adminTokens.length === 0) {
            console.log("관리자 FCM 토큰이 없습니다.");
            return;
        }
        const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
        const title = criticalCount > 0
            ? `🚨 긴급: ${criticalCount}개 지역 이상 탐지`
            : `⚠️ ${anomalies.length}개 지역 이상 탐지`;
        const message = {
            notification: {
                title,
                body: analysis.length > 100 ? analysis.substring(0, 100) + "..." : analysis,
            },
            data: {
                type: "anomaly_detection",
                anomalyCount: anomalies.length.toString(),
                criticalCount: criticalCount.toString(),
                analysis: analysis
            },
            tokens: adminTokens
        };
        const response = await admin.messaging().sendMulticast(message);
        console.log(`📱 FCM 알림 전송: ${response.successCount}/${adminTokens.length}`);
    }
    catch (error) {
        console.error("FCM 알림 전송 오류:", error);
    }
}
/**
 * Slack 알림 전송
 */
async function sendSlackAlert(anomalies, analysis, webhookUrl) {
    try {
        const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
        const color = criticalAnomalies.length > 0 ? 'danger' : 'warning';
        const blocks = [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: "🚨 야고 비서 이상 탐지"
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*탐지 시간:* ${new Date().toLocaleString('ko-KR')}\n*분석 결과:* ${analysis}`
                }
            }
        ];
        if (anomalies.length <= 5) {
            // 적은 수의 이상은 상세 표시
            anomalies.forEach((anomaly, index) => {
                blocks.push({
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*${index + 1}. ${anomaly.type}* (${anomaly.location})\n• 최근 1시간: ${anomaly.recentCount}건\n• 증가율: ${(anomaly.ratio * 100).toFixed(0)}%\n• 심각도: ${anomaly.severity}`
                    }
                });
            });
        }
        else {
            // 많은 수의 이상은 요약 표시
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*탐지된 이상 현상:* ${anomalies.length}개\n• Critical: ${criticalAnomalies.length}개\n• High: ${anomalies.filter(a => a.severity === 'high').length}개\n• Medium: ${anomalies.filter(a => a.severity === 'medium').length}개`
                }
            });
        }
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                attachments: [{
                        color,
                        blocks
                    }]
            })
        });
        console.log("💬 Slack 알림 전송 완료");
    }
    catch (error) {
        console.error("Slack 알림 전송 오류:", error);
    }
}
/**
 * 이상 탐지 로그 저장
 */
async function saveAnomalyLog(anomalies, analysis) {
    try {
        await db.collection("anomalyLogs").add({
            detectedAt: admin.firestore.FieldValue.serverTimestamp(),
            anomalies: anomalies.map(a => ({
                location: a.location,
                type: a.type,
                recentCount: a.recentCount,
                weekAverage: a.weekAverage,
                ratio: a.ratio,
                severity: a.severity,
                lat: a.lat,
                lng: a.lng
            })),
            analysis,
            summary: {
                totalAnomalies: anomalies.length,
                criticalCount: anomalies.filter(a => a.severity === 'critical').length,
                highCount: anomalies.filter(a => a.severity === 'high').length,
                mediumCount: anomalies.filter(a => a.severity === 'medium').length,
                lowCount: anomalies.filter(a => a.severity === 'low').length
            }
        });
        console.log("📝 이상 탐지 로그 저장 완료");
    }
    catch (error) {
        console.error("로그 저장 오류:", error);
        throw error;
    }
}
/**
 * 수동 이상 탐지 (테스트용)
 */
export const manualAnomalyDetection = functions
    .region("asia-northeast3")
    .https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }
    try {
        console.log("🔍 수동 이상 탐지 시작");
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        // 데이터 수집 (위와 동일한 로직)
        const [recentVoiceSnap, recentMarketSnap, recentTeamSnap] = await Promise.all([
            db.collection("voiceSessions")
                .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(oneHourAgo))
                .get(),
            db.collection("marketItems")
                .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(oneHourAgo))
                .get(),
            db.collection("teamRecruitments")
                .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(oneHourAgo))
                .get()
        ]);
        const recentData = {
            voice: recentVoiceSnap.docs.map(d => d.data()),
            market: recentMarketSnap.docs.map(d => d.data()),
            team: recentTeamSnap.docs.map(d => d.data())
        };
        // 지난 7일 데이터도 수집...
        const anomalies = await detectAnomaliesInData(recentData, {}); // 간소화
        const analysis = await generateAIAnalysis(anomalies);
        res.json({
            success: true,
            detectedAt: new Date().toISOString(),
            anomalies,
            analysis,
            summary: {
                totalAnomalies: anomalies.length,
                criticalCount: anomalies.filter(a => a.severity === 'critical').length
            }
        });
    }
    catch (error) {
        console.error("수동 이상 탐지 오류:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
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
//# sourceMappingURL=anomalyDetect.js.map