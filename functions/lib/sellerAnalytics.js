import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const db = admin.firestore();
// 📊 판매자 통계 자동 업데이트 (매시간)
export const updateSellerAnalytics = functions.pubsub
    .schedule("every 1 hours")
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
    console.log("📊 판매자 통계 자동 업데이트 시작");
    try {
        const sellersSnap = await db.collection("sellers").get();
        console.log(`🔍 판매자 수: ${sellersSnap.docs.length}명`);
        for (const sellerDoc of sellersSnap.docs) {
            const sellerId = sellerDoc.id;
            console.log(`📈 ${sellerId} 통계 수집 중...`);
            // 해당 판매자의 모든 채팅방 조회
            const chatsSnap = await db
                .collection("chats")
                .where("sellerId", "==", sellerId)
                .get();
            let totalMessages = 0;
            let aiMessages = 0;
            let aiAssistantMessages = 0;
            let aiShopBotMessages = 0;
            let buyerMessages = 0;
            let sellerMessages = 0;
            let last24hMessages = 0;
            let last7daysMessages = 0;
            const hourlyDistribution = {};
            const keywordMap = {};
            const now = Date.now();
            const last24h = 24 * 60 * 60 * 1000;
            const last7days = 7 * 24 * 60 * 60 * 1000;
            // 각 채팅방의 메시지 수집
            for (const chatDoc of chatsSnap.docs) {
                const chatId = chatDoc.id;
                const messagesSnap = await db
                    .collection("chats")
                    .doc(chatId)
                    .collection("messages")
                    .get();
                for (const msgDoc of messagesSnap.docs) {
                    const data = msgDoc.data();
                    totalMessages++;
                    // 발신자별 분류
                    if (data.senderId === "AI_Assistant") {
                        aiMessages++;
                        aiAssistantMessages++;
                    }
                    else if (data.senderId === "AI_ShopBot") {
                        aiMessages++;
                        aiShopBotMessages++;
                    }
                    else if (data.senderId === sellerId) {
                        sellerMessages++;
                    }
                    else {
                        buyerMessages++;
                    }
                    // 시간대별 분류
                    if (data.createdAt) {
                        const timestamp = data.createdAt.toMillis ? data.createdAt.toMillis() : 0;
                        const timeDiff = now - timestamp;
                        if (timeDiff < last24h) {
                            last24hMessages++;
                        }
                        if (timeDiff < last7days) {
                            last7daysMessages++;
                        }
                        // 시간대 분포 (0-23시)
                        const hour = new Date(timestamp).getHours();
                        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
                    }
                    // 키워드 추출 (구매자 메시지만)
                    if (data.senderId !== sellerId &&
                        data.senderId !== "AI_Assistant" &&
                        data.senderId !== "AI_ShopBot") {
                        const text = data.text || "";
                        const keywords = ["배송", "사이즈", "가격", "할인", "교환", "환불", "직거래", "정품"];
                        keywords.forEach(keyword => {
                            if (text.includes(keyword)) {
                                keywordMap[keyword] = (keywordMap[keyword] || 0) + 1;
                            }
                        });
                    }
                }
            }
            // AI 응답률 계산
            const aiResponseRate = buyerMessages > 0
                ? Math.round((aiMessages / buyerMessages) * 100)
                : 0;
            // 평균 응답 시간 (예시: 5초로 고정, 실제로는 timestamp 차이 계산)
            const avgAIResponseTime = 5;
            // 시간대별 데이터 변환
            const hourlyData = Object.entries(hourlyDistribution).map(([hour, count]) => ({
                hour: `${hour}시`,
                count: count
            }));
            // 키워드 빈도 Top 5
            const topKeywords = Object.entries(keywordMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([keyword, count]) => ({ keyword, count }));
            // 📊 Firestore analytics 컬렉션에 저장
            await db.collection("analytics").doc(sellerId).set({
                sellerId,
                totalMessages,
                aiMessages,
                aiAssistantMessages,
                aiShopBotMessages,
                buyerMessages,
                sellerMessages,
                aiResponseRate,
                last24hMessages,
                last7daysMessages,
                avgAIResponseTime,
                hourlyDistribution: hourlyData,
                topKeywords,
                chatRoomCount: chatsSnap.docs.length,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            console.log(`✅ ${sellerId} 통계 업데이트 완료:`, {
                totalMessages,
                aiMessages,
                aiResponseRate: `${aiResponseRate}%`
            });
        }
        console.log("🎉 모든 판매자 통계 업데이트 완료!");
        return null;
    }
    catch (error) {
        console.error("❌ 통계 업데이트 오류:", error);
        return null;
    }
});
// 📊 수동 통계 갱신 (즉시 실행)
export const refreshSellerAnalytics = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다");
    }
    const sellerId = context.auth.uid;
    console.log("🔄 수동 통계 갱신 요청:", sellerId);
    try {
        // 위와 동일한 로직으로 즉시 갱신
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
                const data = m.data();
                totalMessages++;
                if (data.senderId === "AI_Assistant" || data.senderId === "AI_ShopBot") {
                    aiMessages++;
                }
                else if (data.senderId !== sellerId) {
                    buyerMessages++;
                }
            });
        }
        const aiResponseRate = buyerMessages > 0
            ? Math.round((aiMessages / buyerMessages) * 100)
            : 0;
        await db.collection("analytics").doc(sellerId).set({
            sellerId,
            totalMessages,
            aiMessages,
            buyerMessages,
            aiResponseRate,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log("✅ 수동 통계 갱신 완료:", { sellerId, aiResponseRate: `${aiResponseRate}%` });
        return {
            success: true,
            sellerId,
            stats: {
                totalMessages,
                aiMessages,
                buyerMessages,
                aiResponseRate
            }
        };
    }
    catch (error) {
        console.error("❌ 수동 통계 갱신 오류:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
//# sourceMappingURL=sellerAnalytics.js.map