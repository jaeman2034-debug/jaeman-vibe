import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const db = admin.firestore();
// 📊 주간 AI 리포트 자동 생성 (매주 월요일 오전 9시)
export const generateWeeklyAIReport = functions.pubsub
    .schedule("0 9 * * MON")
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    console.log("📊 주간 AI 리포트 자동 생성 시작");
    try {
        const sellersSnap = await db.collection("sellers").get();
        console.log(`🔍 판매자 수: ${sellersSnap.docs.length}명`);
        for (const sellerDoc of sellersSnap.docs) {
            const sellerId = sellerDoc.id;
            const sellerData = sellerDoc.data();
            console.log(`📈 ${sellerId} 주간 리포트 생성 중...`);
            // 최근 일주일 데이터 수집
            const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            const chatsSnap = await db
                .collection("chats")
                .where("sellerId", "==", sellerId)
                .get();
            let totalMessages = 0;
            let aiMessages = 0;
            let aiShopBotMessages = 0;
            let aiAssistantMessages = 0;
            let buyerMessages = 0;
            let sellerMessages = 0;
            const keywordMap = {};
            const conversations = [];
            // 각 채팅방의 메시지 수집
            for (const chatDoc of chatsSnap.docs) {
                const chatId = chatDoc.id;
                const messagesSnap = await db
                    .collection("chats")
                    .doc(chatId)
                    .collection("messages")
                    .get();
                for (const msgDoc of messagesSnap.docs) {
                    const msg = msgDoc.data();
                    const timestamp = ((_a = msg.createdAt) === null || _a === void 0 ? void 0 : _a.toMillis) ? msg.createdAt.toMillis() : 0;
                    // 최근 일주일 메시지만
                    if (timestamp < oneWeekAgo)
                        continue;
                    totalMessages++;
                    // 발신자별 분류
                    if (msg.senderId === "AI_ShopBot") {
                        aiMessages++;
                        aiShopBotMessages++;
                    }
                    else if (msg.senderId === "AI_Assistant") {
                        aiMessages++;
                        aiAssistantMessages++;
                    }
                    else if (msg.senderId === sellerId) {
                        sellerMessages++;
                    }
                    else {
                        buyerMessages++;
                        // 키워드 추출 (구매자 메시지만)
                        const keywords = ["배송", "사이즈", "가격", "할인", "교환", "환불", "직거래", "정품"];
                        keywords.forEach(keyword => {
                            if (msg.text && msg.text.includes(keyword)) {
                                keywordMap[keyword] = (keywordMap[keyword] || 0) + 1;
                            }
                        });
                    }
                    // 대화 샘플 저장 (최대 20개)
                    if (conversations.length < 20) {
                        conversations.push({
                            senderId: msg.senderId || "unknown",
                            text: msg.text || "",
                            timestamp: timestamp
                        });
                    }
                }
            }
            // AI 응답률 계산
            const aiResponseRate = buyerMessages > 0
                ? Math.round((aiMessages / buyerMessages) * 100)
                : 0;
            // Top 5 키워드
            const topKeywords = Object.entries(keywordMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([keyword, count]) => ({ keyword, count }));
            console.log(`📊 ${sellerId} 주간 통계:`, {
                totalMessages,
                aiMessages,
                aiResponseRate: `${aiResponseRate}%`,
                topKeywordsCount: topKeywords.length
            });
            // 🤖 AI 품질 평가 (GPT-4o-mini)
            const apiKey = ((_b = functions.config().openai) === null || _b === void 0 ? void 0 : _b.api_key) || process.env.OPENAI_API_KEY;
            let evaluation = "AI 품질 평가를 건너뛰었습니다 (API 키 없음).";
            let qualityScore = 0;
            if (apiKey && conversations.length > 0) {
                try {
                    const conversationSample = conversations
                        .slice(-10)
                        .map(c => {
                        const role = c.senderId === "AI_ShopBot" ? "AI" :
                            c.senderId === "AI_Assistant" ? "AI" :
                                c.senderId === sellerId ? "판매자" : "구매자";
                        return `${role}: ${c.text}`;
                    })
                        .join("\n");
                    const evalPrompt = `
당신은 AI 고객 응대 품질 평가 전문가입니다.

지난 일주일간의 AI 응답 데이터를 분석하고 평가해 주세요:

📊 통계:
- AI 응답률: ${aiResponseRate}%
- 총 메시지: ${totalMessages}개
- AI 응답: ${aiMessages}개 (지능형: ${aiShopBotMessages}, 기본: ${aiAssistantMessages})
- 구매자 문의: ${buyerMessages}개
- 판매자 직접 응답: ${sellerMessages}개

💬 최근 대화 샘플:
${conversationSample}

다음 형식으로 평가해 주세요:

1. **품질 점수 (0-100점)**: [점수]
2. **주요 강점 (3가지)**:
   - [강점 1]
   - [강점 2]
   - [강점 3]
3. **개선 포인트 (3가지)**:
   - [개선점 1]
   - [개선점 2]
   - [개선점 3]
4. **종합 평가**: [한 줄 요약]
`;
                    const response = await fetch("https://api.openai.com/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify({
                            model: "gpt-4o-mini",
                            messages: [
                                {
                                    role: "system",
                                    content: "당신은 AI 고객 응대 품질을 평가하는 전문가입니다. 정확하고 건설적인 피드백을 제공하세요."
                                },
                                { role: "user", content: evalPrompt },
                            ],
                            max_tokens: 600,
                            temperature: 0.5,
                        }),
                    });
                    if (response.ok) {
                        const evalData = await response.json();
                        evaluation = ((_f = (_e = (_d = (_c = evalData.choices) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.message) === null || _e === void 0 ? void 0 : _e.content) === null || _f === void 0 ? void 0 : _f.trim()) || "평가 실패";
                        // 품질 점수 추출 (정규식)
                        const scoreMatch = evaluation.match(/품질\s*점수[:\s]*(\d+)/);
                        qualityScore = scoreMatch ? parseInt(scoreMatch[1]) : 75;
                        console.log(`✅ AI 품질 평가 완료 - 점수: ${qualityScore}점`);
                    }
                    else {
                        console.error("❌ OpenAI API 오류:", response.status);
                    }
                }
                catch (evalError) {
                    console.error("❌ AI 품질 평가 오류:", evalError);
                    evaluation = "AI 품질 평가 중 오류가 발생했습니다.";
                }
            }
            // 📄 Firestore에 리포트 저장
            const reportDoc = await db.collection("reports").add({
                sellerId,
                sellerName: ((_g = sellerData.intro) === null || _g === void 0 ? void 0 : _g.substring(0, 50)) || "판매자",
                reportType: "weekly-ai-quality",
                weekStartDate: new Date(oneWeekAgo).toISOString(),
                weekEndDate: new Date().toISOString(),
                stats: {
                    totalMessages,
                    aiMessages,
                    aiShopBotMessages,
                    aiAssistantMessages,
                    buyerMessages,
                    sellerMessages,
                    aiResponseRate,
                },
                qualityScore,
                topKeywords,
                evaluation,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`✅ ${sellerId} 주간 리포트 Firestore 저장 완료:`, reportDoc.id);
            // 🔔 n8n Webhook 호출 (Slack 알림용)
            const n8nWebhookUrl = ((_h = functions.config().n8n) === null || _h === void 0 ? void 0 : _h.report_webhook_url) ||
                process.env.N8N_REPORT_WEBHOOK_URL;
            if (n8nWebhookUrl) {
                try {
                    await fetch(n8nWebhookUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-Internal-Key": ((_j = functions.config().n8n) === null || _j === void 0 ? void 0 : _j.internal_key) || ""
                        },
                        body: JSON.stringify({
                            event: "WEEKLY_AI_REPORT",
                            sellerId,
                            reportId: reportDoc.id,
                            aiResponseRate,
                            qualityScore,
                            topKeywords: topKeywords.map(k => k.keyword),
                            evaluation: evaluation.substring(0, 200) + "...",
                            reportUrl: `https://yagovibe.web.app/admin/reports/${reportDoc.id}`,
                        }),
                    });
                    console.log("✅ n8n Webhook 호출 완료 (Slack 알림)");
                }
                catch (webhookError) {
                    console.error("❌ n8n Webhook 호출 오류:", webhookError);
                }
            }
        }
        console.log("🎉 모든 판매자 주간 리포트 생성 완료!");
        return null;
    }
    catch (error) {
        console.error("❌ 주간 리포트 생성 오류:", error);
        return null;
    }
});
// 📊 수동 리포트 생성 (즉시 실행)
export const generateManualAIReport = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다");
    }
    const sellerId = context.auth.uid;
    console.log("🔄 수동 리포트 생성 요청:", sellerId);
    try {
        // 위와 동일한 로직으로 즉시 리포트 생성
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const chatsSnap = await db
            .collection("chats")
            .where("sellerId", "==", sellerId)
            .get();
        let totalMessages = 0;
        let aiMessages = 0;
        let buyerMessages = 0;
        for (const chatDoc of chatsSnap.docs) {
            const messagesSnap = await db
                .collection("chats")
                .doc(chatDoc.id)
                .collection("messages")
                .get();
            messagesSnap.forEach((m) => {
                var _a;
                const msg = m.data();
                const timestamp = ((_a = msg.createdAt) === null || _a === void 0 ? void 0 : _a.toMillis) ? msg.createdAt.toMillis() : 0;
                if (timestamp < oneWeekAgo)
                    return;
                totalMessages++;
                if (msg.senderId === "AI_ShopBot" || msg.senderId === "AI_Assistant") {
                    aiMessages++;
                }
                else if (msg.senderId !== sellerId) {
                    buyerMessages++;
                }
            });
        }
        const aiResponseRate = buyerMessages > 0
            ? Math.round((aiMessages / buyerMessages) * 100)
            : 0;
        await db.collection("reports").add({
            sellerId,
            reportType: "manual-ai-quality",
            stats: {
                totalMessages,
                aiMessages,
                buyerMessages,
                aiResponseRate,
            },
            evaluation: "수동 생성 리포트",
            qualityScore: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log("✅ 수동 리포트 생성 완료:", { sellerId, aiResponseRate: `${aiResponseRate}%` });
        return {
            success: true,
            sellerId,
            aiResponseRate,
            totalMessages
        };
    }
    catch (error) {
        console.error("❌ 수동 리포트 생성 오류:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
//# sourceMappingURL=weeklyAIReport.js.map