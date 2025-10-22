import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import { logError, logAIRequest } from "./loggingUtils";
/**
 * 🌅 일일 AI 브리핑 시스템
 * 매일 아침 9시에 오늘의 스포츠 소식을 AI가 요약해서 푸시로 전송
 */
// Firebase Admin 초기화
admin.initializeApp();
const db = admin.firestore();
/**
 * 매일 아침 9시 실행되는 일일 브리핑
 */
export const dailyBriefing = functions
    .region("asia-northeast3")
    .pubsub.schedule("0 9 * * *") // 매일 오전 9시 (KST)
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
    var _a;
    console.log("🌅 일일 브리핑 시작:", new Date().toISOString());
    try {
        // OpenAI 클라이언트 초기화
        const openai = new OpenAI({
            apiKey: ((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key) || process.env.OPENAI_API_KEY
        });
        // 지난 24시간 데이터 수집
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        // 새 상품 데이터 조회
        const itemsSnapshot = await db
            .collection("marketItems")
            .where("createdAt", ">=", since)
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();
        // 팀 모집 데이터 조회 (추후 구현 예정)
        const teamsSnapshot = await db
            .collection("teamRecruitments")
            .where("createdAt", ">=", since)
            .orderBy("createdAt", "desc")
            .limit(10)
            .get();
        // 내일 예측 데이터 수집
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowKey = tomorrow.toISOString().slice(0, 10);
        const forecastSnapshot = await db.collection("forecasts")
            .doc(tomorrowKey)
            .collection("cells")
            .orderBy("yhat", "desc")
            .limit(5)
            .get();
        const items = itemsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'item'
        }));
        const teams = teamsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'team'
        }));
        const forecasts = forecastSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'forecast'
        }));
        const allData = [...items, ...teams, ...forecasts];
        console.log(`📊 수집된 데이터: 상품 ${items.length}개, 팀 모집 ${teams.length}개, 예측 ${forecasts.length}개`);
        // 데이터가 없으면 기본 메시지
        if (allData.length === 0) {
            await sendDefaultBriefing();
            return;
        }
        // AI 요약 생성
        const startTime = Date.now();
        const summary = await generateAISummary(allData, openai);
        const processingTime = Date.now() - startTime;
        if (!summary) {
            console.error("❌ AI 요약 생성 실패");
            await logError("dailyBriefing", new Error("AI 요약 생성 실패"), { dataCount: allData.length });
            return;
        }
        console.log("🧠 생성된 요약:", summary);
        // AI 요청 로그 저장
        await logAIRequest({
            type: 'briefing',
            input: JSON.stringify(allData.slice(0, 5)), // 처음 5개만
            output: summary,
            model: 'gpt-4o-mini',
            processingTime
        });
        // 모든 구독자에게 브리핑 전송
        await sendBriefingToSubscribers(summary, allData);
        // 브리핑 로그 저장
        await saveBriefingLog(summary, allData);
        console.log("✅ 일일 브리핑 완료");
    }
    catch (error) {
        console.error("❌ 일일 브리핑 오류:", error);
        await logError("dailyBriefing", error, { context: "main_execution" });
    }
});
/**
 * AI 요약 생성
 */
async function generateAISummary(data, openai) {
    var _a, _b, _c;
    try {
        // 데이터를 AI가 이해하기 쉬운 형태로 변환
        const formattedData = data.map(item => {
            var _a, _b, _c;
            return ({
                type: item.type === 'item' ? '상품' : '팀 모집',
                title: item.title,
                description: item.autoDescription || item.description,
                tags: item.autoTags || item.tags || [],
                location: item.location ? `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}` : '위치 미상',
                createdAt: ((_c = (_b = (_a = item.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toLocaleString()) || '시간 미상'
            });
        });
        const prompt = `다음은 지난 24시간 동안 등록된 스포츠 관련 항목들과 내일 예측 정보입니다.

데이터:
${JSON.stringify(formattedData, null, 2)}

이 데이터를 바탕으로 "야고 비서" 캐릭터로 오늘의 브리핑을 작성해주세요.

요구사항:
1. 친근하고 활발한 톤으로 작성
2. "형님"이라고 부르며 대화체로 작성
3. 오늘의 주요 활동과 새로운 소식을 강조
4. 내일 예측 정보도 포함 (활동량이 높은 지역, 예상 트렌드 등)
5. 주요 키워드와 숫자를 포함
6. 한 문단으로 간결하게 작성 (150자 이내)
7. 끝에 "오늘도 좋은 하루 되세요!" 같은 격려 멘트 포함

예시:
"형님! 오늘은 소흘FC 신입 팀원 모집과 축구화 2건이 새로 등록되었어요. 내일은 강남구 일대에서 활동량이 30% 증가할 예정이니 미리 준비하세요! 오늘도 좋은 하루 되세요!"

브리핑:`;
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "당신은 '야고 비서'라는 친근하고 활발한 스포츠 AI 어시스턴트입니다. 사용자를 '형님'이라고 부르며 대화체로 소통합니다."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 150
        });
        return ((_c = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim()) || null;
    }
    catch (error) {
        console.error("OpenAI 요약 생성 오류:", error);
        return null;
    }
}
/**
 * 구독자들에게 브리핑 전송
 */
async function sendBriefingToSubscribers(summary, data) {
    try {
        // 활성 구독자 조회
        const subscriptionsSnapshot = await db
            .collection("subscriptions")
            .where("fcmToken", "!=", null)
            .get();
        if (subscriptionsSnapshot.empty) {
            console.log("📭 활성 구독자가 없습니다.");
            return;
        }
        const subscriptions = subscriptionsSnapshot.docs.map(doc => doc.data());
        const tokens = subscriptions
            .map(sub => sub.fcmToken)
            .filter(token => token && token.startsWith('ExponentPushToken'));
        console.log(`📱 브리핑 전송 대상: ${tokens.length}명`);
        if (tokens.length === 0) {
            console.log("📭 유효한 FCM 토큰이 없습니다.");
            return;
        }
        // FCM 토큰을 500개씩 나누어 전송 (FCM 제한)
        const chunks = [];
        while (tokens.length) {
            chunks.push(tokens.splice(0, 500));
        }
        const sendPromises = chunks.map(async (chunk, index) => {
            try {
                const response = await admin.messaging().sendMulticast({
                    tokens: chunk,
                    notification: {
                        title: "🌅 야고 비서 아침 브리핑",
                        body: summary,
                        sound: "default",
                        badge: "1"
                    },
                    data: {
                        type: "daily_briefing",
                        summary: summary,
                        dataCount: data.length.toString(),
                        timestamp: new Date().toISOString()
                    },
                    android: {
                        priority: "high",
                        notification: {
                            sound: "default",
                            channelId: "daily_briefing"
                        }
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: "default",
                                badge: 1
                            }
                        }
                    }
                });
                console.log(`📤 청크 ${index + 1} 전송 결과: 성공 ${response.successCount}건, 실패 ${response.failureCount}건`);
                // 실패한 토큰 처리
                if (response.failureCount > 0) {
                    response.responses.forEach((resp, i) => {
                        if (!resp.success && resp.error) {
                            console.error(`토큰 ${i} 전송 실패:`, resp.error.message);
                            // 만료된 토큰 정리 (선택사항)
                            if (resp.error.code === 'messaging/registration-token-not-registered') {
                                // 해당 토큰을 가진 구독 삭제
                                const failedToken = chunk[i];
                                cleanupExpiredToken(failedToken);
                            }
                        }
                    });
                }
            }
            catch (error) {
                console.error(`청크 ${index + 1} 전송 오류:`, error);
            }
        });
        await Promise.allSettled(sendPromises);
        console.log("✅ 모든 브리핑 전송 완료");
    }
    catch (error) {
        console.error("브리핑 전송 오류:", error);
    }
}
/**
 * 기본 브리핑 전송 (데이터가 없을 때)
 */
async function sendDefaultBriefing() {
    try {
        const subscriptionsSnapshot = await db
            .collection("subscriptions")
            .where("fcmToken", "!=", null)
            .get();
        if (subscriptionsSnapshot.empty)
            return;
        const tokens = subscriptionsSnapshot.docs
            .map(doc => doc.data().fcmToken)
            .filter(token => token && token.startsWith('ExponentPushToken'));
        const defaultMessage = "형님! 오늘은 새로운 등록이 없어요. 좋은 하루 보내세요! 🌅";
        await admin.messaging().sendMulticast({
            tokens: tokens.slice(0, 500), // 제한
            notification: {
                title: "🌅 야고 비서 아침 브리핑",
                body: defaultMessage,
                sound: "default"
            },
            data: {
                type: "daily_briefing",
                summary: defaultMessage,
                dataCount: "0"
            }
        });
        console.log("📤 기본 브리핑 전송 완료");
    }
    catch (error) {
        console.error("기본 브리핑 전송 오류:", error);
    }
}
/**
 * 브리핑 로그 저장
 */
async function saveBriefingLog(summary, data) {
    try {
        const today = new Date().toISOString().split('T')[0];
        await db.collection("briefingLogs").doc(today).set({
            date: today,
            summary,
            itemCount: data.filter(d => d.type === 'item').length,
            teamCount: data.filter(d => d.type === 'team').length,
            totalCount: data.length,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            data: data.slice(0, 10) // 최근 10개만 저장
        });
        console.log("📝 브리핑 로그 저장 완료");
    }
    catch (error) {
        console.error("브리핑 로그 저장 오류:", error);
    }
}
/**
 * 만료된 토큰 정리
 */
async function cleanupExpiredToken(token) {
    try {
        const expiredSubscriptions = await db
            .collection("subscriptions")
            .where("fcmToken", "==", token)
            .get();
        const deletePromises = expiredSubscriptions.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
        console.log(`🗑️ 만료된 토큰 정리 완료: ${expiredSubscriptions.size}개`);
    }
    catch (error) {
        console.error("토큰 정리 오류:", error);
    }
}
/**
 * 수동 브리핑 실행 (테스트용)
 */
export const manualBriefing = functions
    .region("asia-northeast3")
    .https.onRequest(async (req, res) => {
    var _a;
    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }
    try {
        // 일일 브리핑 로직 재사용
        const openai = new OpenAI({
            apiKey: ((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.key) || process.env.OPENAI_API_KEY
        });
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const itemsSnapshot = await db
            .collection("marketItems")
            .where("createdAt", ">=", since)
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();
        const items = itemsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'item'
        }));
        if (items.length === 0) {
            return res.json({ message: "신규 항목 없음", summary: null });
        }
        const summary = await generateAISummary(items, openai);
        if (summary) {
            await sendBriefingToSubscribers(summary, items);
            await saveBriefingLog(summary, items);
        }
        res.json({
            message: "수동 브리핑 완료",
            summary,
            itemCount: items.length
        });
    }
    catch (error) {
        console.error("수동 브리핑 오류:", error);
        res.status(500).json({ error: error.message });
    }
});
//# sourceMappingURL=dailyBriefing.js.map