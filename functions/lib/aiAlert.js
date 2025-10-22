import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import fetch from "node-fetch";
// ✅ Firebase Admin 초기화 (중복 방지)
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * AI 실시간 이상 탐지 시스템
 * - Firestore metrics 컬렉션 변경 감지
 * - 전/후 데이터 비교 및 변화율 계산
 * - AI 분석 및 Slack 경보 발송
 */
export const aiAnomalyWatcher = functions
    .region("asia-northeast3")
    .firestore.document("metrics/{docId}")
    .onWrite(async (change, context) => {
    var _a, _b, _c, _d, _e;
    console.log("🔍 [AI ALERT] Anomaly detection triggered");
    const after = change.after.data();
    const before = change.before.data();
    // 새 데이터가 없거나 이전 데이터 없으면 종료
    if (!after) {
        console.log("⏭️  [AI ALERT] No new data, skipping");
        return null;
    }
    if (!before) {
        console.log("⏭️  [AI ALERT] No previous data, skipping (first write)");
        return null;
    }
    // 감시 대상 필드
    const fields = ["sales", "signups", "activities"];
    const diffs = [];
    // 변화율 계산
    for (const field of fields) {
        if (typeof after[field] === "number" && typeof before[field] === "number") {
            const diff = before[field] !== 0
                ? ((after[field] - before[field]) / before[field]) * 100
                : 0;
            diffs.push({
                field,
                diff: Math.round(diff * 10) / 10, // 소수점 1자리
                value: after[field],
                prevValue: before[field],
            });
        }
    }
    console.log("📊 [AI ALERT] Calculated diffs:", diffs);
    // 10% 이상 변동만 분석 대상으로 필터링
    const anomalies = diffs.filter((d) => Math.abs(d.diff) >= 10);
    if (anomalies.length === 0) {
        console.log("✅ [AI ALERT] No significant anomalies detected");
        return null;
    }
    console.log("⚠️  [AI ALERT] Anomalies detected:", anomalies);
    // AI 분석
    const openaiKey = ((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key) || process.env.VITE_OPENAI_API_KEY;
    const slackWebhook = ((_b = functions.config().slack) === null || _b === void 0 ? void 0 : _b.webhook) || process.env.VITE_SLACK_WEBHOOK_URL;
    if (!openaiKey) {
        console.error("❌ [AI ALERT] OpenAI API Key not configured");
        return null;
    }
    const prompt = `
당신은 YAGO VIBE 플랫폼의 실시간 모니터링 AI입니다.
다음 수치 변화를 분석하고 경고 메시지를 만들어주세요.

데이터 변화:
${anomalies.map((a) => `- ${a.field}: ${a.prevValue} → ${a.value} (${a.diff > 0 ? '+' : ''}${a.diff}%)`).join('\n')}

요구사항:
1️⃣ 각 항목의 급등/급락 원인을 추정
2️⃣ 비즈니스 영향도 분석
3️⃣ 1~2줄 요약 경고 문장 생성
4️⃣ Slack 공지용으로 간결하게 포맷팅

출력 형식:
[요약] 한 줄 요약
[분석] 상세 분석 (간결하게)
[조치] 권장 조치사항 (선택적)
`;
    try {
        const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${openaiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.4,
                max_tokens: 500,
            }),
        });
        const aiData = await aiResp.json();
        const summary = ((_e = (_d = (_c = aiData.choices) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.message) === null || _e === void 0 ? void 0 : _e.content) || "AI 분석 실패";
        console.log("🧠 [AI ALERT] AI analysis completed");
        // Slack 알림 메시지
        if (slackWebhook) {
            const slackMessage = {
                text: `⚠️ *YAGO VIBE 실시간 경보*`,
                blocks: [
                    {
                        type: "header",
                        text: {
                            type: "plain_text",
                            text: "⚠️ YAGO VIBE 실시간 경보",
                        },
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `*시간:* ${new Date().toLocaleString("ko-KR")}\n*문서 ID:* ${context.params.docId}`,
                        },
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `*📊 감지된 이상 징후:*\n${anomalies
                                .map((a) => `• *${a.field}*: ${a.prevValue} → ${a.value} (${a.diff > 0 ? "+" : ""}${a.diff}%)`)
                                .join("\n")}`,
                        },
                    },
                    {
                        type: "divider",
                    },
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `*🧠 AI 분석:*\n${summary}`,
                        },
                    },
                ],
            };
            await fetch(slackWebhook, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(slackMessage),
            });
            console.log("💬 [AI ALERT] Slack notification sent");
        }
        else {
            console.warn("⚠️  [AI ALERT] Slack webhook not configured");
        }
        // Firestore에 경보 기록
        await db.collection("alerts").add({
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            docId: context.params.docId,
            summary,
            anomalies,
            severity: anomalies.some((a) => Math.abs(a.diff) >= 30) ? "high" : "medium",
        });
        console.log("✅ [AI ALERT] Alert saved to Firestore");
        return { success: true, anomalies: anomalies.length };
    }
    catch (error) {
        console.error("❌ [AI ALERT] Error:", error);
        return null;
    }
});
//# sourceMappingURL=aiAlert.js.map