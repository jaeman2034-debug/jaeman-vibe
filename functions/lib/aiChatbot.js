import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const db = admin.firestore();
// 🤖 AI 자동응답 챗봇
export const onAutoReplyChat = functions.firestore
    .document("chats/{chatId}/messages/{messageId}")
    .onCreate(async (snap, context) => {
    var _a, _b, _c, _d, _e;
    const message = snap.data();
    const chatId = context.params.chatId;
    const messageId = context.params.messageId;
    console.log("🤖 AI 자동응답 체크 시작:", {
        chatId,
        messageId,
        senderId: message.senderId,
        text: message.text
    });
    try {
        // 채팅방 정보 로드
        const chatDoc = await db.collection("chats").doc(chatId).get();
        if (!chatDoc.exists) {
            console.warn("⚠️ 채팅방을 찾을 수 없습니다:", chatId);
            return null;
        }
        const chat = chatDoc.data();
        if (!chat)
            return null;
        const sellerId = chat.sellerId;
        const buyerId = chat.buyerId;
        const senderId = message.senderId;
        // 1️⃣ 구매자 메시지만 처리 (판매자/AI가 보낸 건 제외)
        if (senderId !== buyerId) {
            console.log("ℹ️ 판매자 또는 AI 메시지 → 자동응답 건너뜀");
            return null;
        }
        // AI 메시지는 건너뜀
        if (senderId === "AI_Assistant") {
            console.log("ℹ️ AI 메시지 → 건너뜀");
            return null;
        }
        console.log("📋 채팅방 정보:", { sellerId, buyerId, senderId });
        // 2️⃣ 판매자 상태 확인
        const sellerDoc = await db.collection("users").doc(sellerId).get();
        if (!sellerDoc.exists) {
            console.warn("⚠️ 판매자 정보 없음:", sellerId);
            return null;
        }
        const seller = sellerDoc.data();
        const isOnline = (seller === null || seller === void 0 ? void 0 : seller.isOnline) || false;
        console.log("🔍 판매자 상태:", { sellerId, isOnline });
        // 판매자가 온라인이면 자동응답 건너뜀
        if (isOnline) {
            console.log("✅ 판매자 온라인 → AI 자동응답 건너뜀");
            return null;
        }
        console.log("🤖 판매자 오프라인 → AI 자동응답 시작");
        // 3️⃣ 상품 정보 가져오기
        const productId = chat.productId;
        const productDoc = await db.collection("market-uploads").doc(productId).get();
        const product = productDoc.data();
        if (!product) {
            console.warn("⚠️ 상품 정보 없음:", productId);
        }
        // 상품 정보 컨텍스트 구성
        const contextText = `
상품명: ${chat.productTitle || (product === null || product === void 0 ? void 0 : product.title) || "미등록 상품"}
가격: ${chat.productPrice || (product === null || product === void 0 ? void 0 : product.price) || "가격 정보 없음"}원
상품 설명: ${(product === null || product === void 0 ? void 0 : product.description) || "설명 없음"}
AI 분석 (한국어): ${(product === null || product === void 0 ? void 0 : product.caption_ko) || ""}
AI 분석 (영어): ${(product === null || product === void 0 ? void 0 : product.caption_en) || ""}
카테고리: ${(product === null || product === void 0 ? void 0 : product.aiCategory) || ""}
브랜드: ${(product === null || product === void 0 ? void 0 : product.aiBrand) || ""}
상태: ${(product === null || product === void 0 ? void 0 : product.aiCondition) || ""}
`;
        console.log("📝 AI 컨텍스트:", contextText);
        // 4️⃣ OpenAI API 호출
        const apiKey = ((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.api_key) || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn("⚠️ OPENAI_API_KEY 없음 → AI 자동응답 건너뜀");
            return null;
        }
        const prompt = `당신은 YAGO VIBE 스포츠 마켓의 친절한 판매 보조 AI입니다.

고객이 다음과 같이 문의했습니다:
"${message.text}"

아래 상품 정보를 참고하여 자연스럽고 친절한 한국어로 답변해 주세요:
${contextText}

답변 규칙:
1. 간결하고 친절하게 (2-3문장 이내)
2. 상품 정보에 있는 내용만 답변
3. 모르는 내용은 "판매자에게 확인해 보겠습니다"라고 답변
4. 이모지 사용 가능 (😊, 👍 등)
5. "판매자님께서 곧 답변하실 예정입니다" 문구 포함
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
                        content: "당신은 친절한 스포츠 용품 판매 보조 AI입니다. 고객에게 정확하고 친절하게 답변하세요."
                    },
                    {
                        role: "user",
                        content: prompt
                    },
                ],
                max_tokens: 200,
                temperature: 0.7,
            }),
        });
        if (!response.ok) {
            throw new Error(`OpenAI API 오류: ${response.status}`);
        }
        const data = await response.json();
        const replyText = ((_e = (_d = (_c = (_b = data.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) === null || _e === void 0 ? void 0 : _e.trim()) || "";
        console.log("🤖 AI 생성 답변:", replyText);
        // 5️⃣ Firestore에 AI 메시지 추가
        if (replyText) {
            await db.collection("chats").doc(chatId).collection("messages").add({
                senderId: "AI_Assistant",
                senderEmail: "AI 챗봇",
                text: replyText,
                type: "auto-reply",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // 채팅방 lastMessage 업데이트
            await db.collection("chats").doc(chatId).update({
                lastMessage: `🤖 ${replyText.substring(0, 50)}...`,
                lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log("✅ AI 자동응답 전송 완료:", replyText);
        }
        else {
            console.warn("⚠️ AI 응답이 비어있습니다.");
        }
        return null;
    }
    catch (error) {
        console.error("❌ AI 자동응답 오류:", error);
        // 오류 발생 시 기본 메시지 전송
        try {
            await db.collection("chats").doc(chatId).collection("messages").add({
                senderId: "AI_Assistant",
                senderEmail: "AI 챗봇",
                text: "판매자님께서 곧 답변하실 예정입니다. 잠시만 기다려 주세요! 😊",
                type: "auto-reply",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log("✅ 기본 AI 응답 전송 완료");
        }
        catch (fallbackError) {
            console.error("❌ 기본 응답 전송도 실패:", fallbackError);
        }
        return null;
    }
});
// 🟢 사용자 온라인 상태 업데이트 헬퍼 함수 (선택사항)
export const updateUserOnlineStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다");
    }
    const userId = context.auth.uid;
    const isOnline = data.isOnline || false;
    await db.collection("users").doc(userId).update({
        isOnline: isOnline,
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`🟢 사용자 상태 업데이트: ${userId} → ${isOnline ? "온라인" : "오프라인"}`);
    return { success: true, userId, isOnline };
});
//# sourceMappingURL=aiChatbot.js.map