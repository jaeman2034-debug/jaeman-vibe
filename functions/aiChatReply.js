// 🤖 AI 자동 답변 모듈 - 독립 실행형
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const OpenAI = require("openai");

// Firebase Admin 초기화 (이미 초기화되어 있으면 무시)
if (!admin.apps.length) {
  admin.initializeApp();
}

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY,
});

/**
 * 🤖 AI 자동 답변 트리거
 * 새 메시지가 생성되면 자동으로 AI가 답변을 생성합니다
 */
exports.aiChatReply = functions.firestore
  .document("chatRooms/{roomId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const roomId = context.params.roomId;
    const messageId = context.params.messageId;

    console.log(`🤖 AI 답변 트리거: roomId=${roomId}, messageId=${messageId}`);

    // 자기 자신(AI)이 보낸 메시지는 무시
    if (message.senderId === "AI" || message.senderId === "yago-bot") {
      console.log("🤖 AI 메시지 무시");
      return null;
    }

    // 시스템 메시지나 빈 메시지는 무시
    if (!message.text || message.text.trim().length === 0) {
      console.log("🤖 빈 메시지 무시");
      return null;
    }

    try {
      // 🧠 야고봇 프롬프트 최적화
      const prompt = `
당신은 "야고봇"이라는 친절한 스포츠 중고거래 플랫폼 AI 어시스턴트입니다.

사용자 메시지: "${message.text}"

다음 규칙에 따라 답변해주세요:
1. 짧고 친절하게 한국어로 답변
2. 스포츠 용품 거래에 관련된 질문이라면 도움을 제공
3. 가격 문의 시 "가격은 판매자와 직접 협의해보세요" 안내
4. 위치 문의 시 "거래 위치는 판매자와 상의해보세요" 안내
5. 상품 상태 문의 시 "상품 상태는 판매자에게 직접 문의하시면 됩니다" 안내
6. 일반적인 인사나 감사 인사에는 자연스럽게 응답
7. 답변은 1-2문장으로 간결하게
8. 이모지 1-2개 적절히 사용

답변:`;

      console.log(`🧠 OpenAI API 호출 시작: "${message.text}"`);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      });

      const aiReply = response.choices[0].message.content?.trim() || "안녕하세요! 야고봇입니다. 무엇을 도와드릴까요? 😊";

      console.log(`🤖 AI 답변 생성 완료: "${aiReply}"`);

      // 📤 Firestore에 AI 응답 추가
      const messagesRef = admin.firestore().collection("chatRooms").doc(roomId).collection("messages");
      
      await messagesRef.add({
        text: aiReply,
        senderId: "yago-bot",
        senderName: "야고봇 🤖",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isAI: true,
      });

      // 🔄 ChatRoom 문서의 lastMessage 업데이트
      await admin.firestore().collection("chatRooms").doc(roomId).update({
        lastMessage: aiReply,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageSender: "yago-bot",
      });

      console.log(`✅ AI 응답 저장 완료: roomId=${roomId}`);

      return { success: true, reply: aiReply };

    } catch (error) {
      console.error("❌ AI 응답 생성 실패:", error);
      
      // 에러 발생 시 기본 응답
      const fallbackReply = "죄송합니다. 현재 답변을 생성할 수 없습니다. 잠시 후 다시 시도해주세요. 😅";
      
      try {
        await admin.firestore().collection("chatRooms").doc(roomId).collection("messages").add({
          text: fallbackReply,
          senderId: "yago-bot",
          senderName: "야고봇 🤖",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isAI: true,
          isError: true,
        });
      } catch (fallbackError) {
        console.error("❌ Fallback 응답 저장 실패:", fallbackError);
      }

      return { success: false, error: error.message };
    }
  });

/**
 * 🧪 AI 답변 테스트 함수 (수동 호출용)
 */
exports.testAIChatReply = functions.https.onCall(async (data, context) => {
  const { testMessage } = data;
  
  if (!testMessage) {
    throw new functions.https.HttpsError("invalid-argument", "testMessage is required");
  }

  try {
    const prompt = `
당신은 "야고봇"이라는 친절한 스포츠 중고거래 플랫폼 AI 어시스턴트입니다.
사용자 메시지: "${testMessage}"
짧고 친절하게 한국어로 답변해주세요.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.7,
    });

    const reply = response.choices[0].message.content?.trim() || "테스트 응답을 생성할 수 없습니다.";

    return { 
      success: true, 
      originalMessage: testMessage,
      aiReply: reply 
    };

  } catch (error) {
    console.error("❌ AI 테스트 실패:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
