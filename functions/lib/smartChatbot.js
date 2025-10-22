import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const db = admin.firestore();
// 🧠 지능형 학습 AI 판매 비서
export const onSmartAutoReply = functions.firestore
    .document("chats/{chatId}/messages/{messageId}")
    .onCreate(async (snap, context) => {
    var _a, _b, _c, _d, _e, _f;
    const message = snap.data();
    const chatId = context.params.chatId;
    const messageId = context.params.messageId;
    console.log("🧠 지능형 AI 챗봇 시작:", {
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
        // 1️⃣ 구매자 메시지만 처리
        if (senderId !== buyerId) {
            console.log("ℹ️ 판매자 메시지 → 건너뜀");
            return null;
        }
        // AI 메시지는 건너뜀
        if (senderId === "AI_Assistant" || senderId === "AI_ShopBot") {
            console.log("ℹ️ AI 메시지 → 건너뜀");
            return null;
        }
        // 2️⃣ 판매자 온라인 상태 확인
        const sellerUserDoc = await db.collection("users").doc(sellerId).get();
        const isOnline = ((_a = sellerUserDoc.data()) === null || _a === void 0 ? void 0 : _a.isOnline) || false;
        if (isOnline) {
            console.log("✅ 판매자 온라인 → AI 자동응답 건너뜀");
            return null;
        }
        console.log("🤖 판매자 오프라인 → 지능형 AI 응답 시작");
        // 🧩 3️⃣ 판매자 학습 데이터 로드 (sellers 컬렉션)
        const sellerDoc = await db.collection("sellers").doc(sellerId).get();
        const sellerData = sellerDoc.data() || {};
        console.log("📚 판매자 학습 데이터:", {
            intro: sellerData.intro || "없음",
            faqCount: (sellerData.faq || []).length,
            memoryCount: (sellerData.memory || []).length
        });
        // 🧩 4️⃣ 상품 정보 로드
        const productId = chat.productId;
        const productDoc = await db.collection("market-uploads").doc(productId).get();
        const productData = productDoc.data() || {};
        console.log("📦 상품 정보:", {
            title: productData.title || "없음",
            price: productData.price || "없음"
        });
        // 🧩 5️⃣ 최근 대화 맥락 로드 (최대 10개)
        const messagesSnap = await db
            .collection("chats")
            .doc(chatId)
            .collection("messages")
            .orderBy("createdAt", "desc")
            .limit(10)
            .get();
        const recentMessages = messagesSnap.docs
            .map((d) => {
            const data = d.data();
            const role = data.senderId === buyerId ? "구매자" :
                data.senderId === sellerId ? "판매자" :
                    "AI";
            return `${role}: ${data.text}`;
        })
            .reverse();
        console.log("💬 최근 대화:", recentMessages.length, "개");
        // 🧠 6️⃣ AI 컨텍스트 구성 (판매자별 학습 데이터)
        const contextText = `
[판매자 소개]
${sellerData.intro || "소개 정보가 없습니다."}

[자주 묻는 질문 (FAQ)]
${(sellerData.faq || []).map((f, i) => `Q${i + 1}. ${f}`).join("\n") || "FAQ가 없습니다."}

[판매자 상품 태그]
${(sellerData.productTags || []).join(", ") || "태그 없음"}

[판매자 과거 학습 메모리]
${(sellerData.memory || []).slice(-5).map((m) => `Q: ${m.query}\nA: ${m.reply}`).join("\n\n") || "학습 기록 없음"}

[현재 상품 정보]
상품명: ${chat.productTitle || productData.title || "제목 없음"}
가격: ${chat.productPrice || productData.price || "가격 미정"}원
상품 설명: ${productData.description || ""}
AI 분석 (한국어): ${productData.caption_ko || ""}
AI 분석 (영어): ${productData.caption_en || ""}
카테고리: ${productData.aiCategory || ""}
브랜드: ${productData.aiBrand || ""}
상태: ${productData.aiCondition || ""}
추천 가격: ${productData.aiSuggestedPrice || ""}원

[최근 대화 기록 (컨텍스트 유지)]
${recentMessages.join("\n")}
`;
        console.log("🧠 AI 컨텍스트 크기:", contextText.length, "자");
        // 🤖 7️⃣ OpenAI GPT-4o-mini 호출 (컨텍스트 기반)
        const apiKey = ((_b = functions.config().openai) === null || _b === void 0 ? void 0 : _b.api_key) || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn("⚠️ OPENAI_API_KEY 없음");
            return null;
        }
        const systemPrompt = `당신은 YAGO VIBE 스포츠 마켓의 판매자를 대신하는 친절한 AI 판매 비서입니다.

답변 규칙:
1. 판매자의 스타일과 톤을 유지하세요
2. 상품 정보와 FAQ를 우선 참고하세요
3. 최근 대화 기록을 고려하여 맥락에 맞는 답변을 하세요
4. 모르는 내용은 "판매자님께 확인 후 답변드리겠습니다"라고 솔직하게 말하세요
5. 간결하고 친절하게 (2-3문장)
6. 이모지 적절히 사용 (😊, 👍, ⚽ 등)
7. 판매자 과거 학습 메모리를 참고하여 일관성 있는 답변을 하세요

위 정보를 바탕으로 고객에게 자연스럽고 도움이 되는 답변을 제공하세요.`;
        const userPrompt = `
[판매자 및 상품 컨텍스트]
${contextText}

[고객 문의]
${message.text}

위 정보를 참고하여 답변해 주세요.`;
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                max_tokens: 300,
                temperature: 0.7,
            }),
        });
        if (!response.ok) {
            throw new Error(`OpenAI API 오류: ${response.status}`);
        }
        const data = await response.json();
        const replyText = ((_f = (_e = (_d = (_c = data.choices) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.message) === null || _e === void 0 ? void 0 : _e.content) === null || _f === void 0 ? void 0 : _f.trim()) || "";
        console.log("🤖 AI 생성 답변:", replyText);
        // 🧩 8️⃣ Firestore에 AI 메시지 추가
        if (replyText) {
            await db.collection("chats").doc(chatId).collection("messages").add({
                senderId: "AI_ShopBot",
                senderEmail: "🤖 지능형 AI 판매 비서",
                text: replyText,
                type: "smart-auto-reply",
                context: {
                    sellerIntro: sellerData.intro || "",
                    faqCount: (sellerData.faq || []).length,
                    memoryCount: (sellerData.memory || []).length,
                    recentMsgCount: recentMessages.length
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // 채팅방 lastMessage 업데이트
            await db.collection("chats").doc(chatId).update({
                lastMessage: `🤖 ${replyText.substring(0, 50)}...`,
                lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // 🧠 9️⃣ 판매자 학습 메모리에 이번 대화 기록
            await db.collection("sellers").doc(sellerId).set({
                memory: admin.firestore.FieldValue.arrayUnion({
                    query: message.text,
                    reply: replyText,
                    productId: productId,
                    timestamp: new Date().toISOString(),
                }),
            }, { merge: true });
            console.log("✅ 지능형 AI 응답 전송 + 학습 메모리 저장 완료");
        }
        return null;
    }
    catch (error) {
        console.error("❌ 지능형 AI 챗봇 오류:", error);
        // 에러 시 기본 메시지
        try {
            await db.collection("chats").doc(chatId).collection("messages").add({
                senderId: "AI_ShopBot",
                senderEmail: "🤖 AI 판매 비서",
                text: "판매자님께서 곧 답변하실 예정입니다. 잠시만 기다려 주세요! 😊",
                type: "fallback",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log("✅ 기본 응답 전송 완료");
        }
        catch (fallbackError) {
            console.error("❌ 기본 응답도 실패:", fallbackError);
        }
        return null;
    }
});
// 📚 판매자 학습 데이터 초기화 헬퍼 함수
export const initSellerData = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다");
    }
    const sellerId = context.auth.uid;
    const { intro, faq, productTags } = data;
    await db.collection("sellers").doc(sellerId).set({
        sellerId: sellerId,
        intro: intro || "",
        faq: faq || [],
        productTags: productTags || [],
        memory: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log("✅ 판매자 학습 데이터 초기화 완료:", sellerId);
    return {
        success: true,
        sellerId,
        message: "판매자 AI 학습 데이터가 초기화되었습니다."
    };
});
// 🔄 판매자 FAQ 업데이트 헬퍼 함수
export const updateSellerFAQ = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다");
    }
    const sellerId = context.auth.uid;
    const { faq } = data;
    if (!Array.isArray(faq)) {
        throw new functions.https.HttpsError("invalid-argument", "faq는 배열이어야 합니다");
    }
    await db.collection("sellers").doc(sellerId).update({
        faq: faq,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("✅ 판매자 FAQ 업데이트 완료:", { sellerId, faqCount: faq.length });
    return {
        success: true,
        sellerId,
        faqCount: faq.length
    };
});
//# sourceMappingURL=smartChatbot.js.map