// 🤖 AI 자동 답변 모듈만 export
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const OpenAI = require("openai");

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp();
}

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY,
});

/**
 * 🤖 AI 자동 답변 트리거
 */
exports.aiChatReply = functions.firestore
  .document("chatRooms/{roomId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const roomId = context.params.roomId;

    console.log(`🤖 AI 답변 트리거: roomId=${roomId}`);

    // AI가 보낸 메시지는 무시
    if (message.senderId === "AI" || message.senderId === "yago-bot") {
      return null;
    }

    // 빈 메시지는 무시
    if (!message.text || message.text.trim().length === 0) {
      return null;
    }

    try {
      const prompt = `
당신은 "야고봇"이라는 친절한 스포츠 중고거래 플랫폼 AI 어시스턴트입니다.
사용자 메시지: "${message.text}"
짧고 친절하게 한국어로 답변해주세요.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      });

      const aiReply = response.choices[0].message.content?.trim() || "안녕하세요! 야고봇입니다. 😊";

      // Firestore에 AI 응답 추가
      await admin.firestore().collection("chatRooms").doc(roomId).collection("messages").add({
        text: aiReply,
        senderId: "yago-bot",
        senderName: "야고봇 🤖",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isAI: true,
      });

      // ChatRoom lastMessage 업데이트
      await admin.firestore().collection("chatRooms").doc(roomId).update({
        lastMessage: aiReply,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageSender: "yago-bot",
      });

      console.log(`✅ AI 응답 완료: "${aiReply}"`);
      return { success: true };

    } catch (error) {
      console.error("❌ AI 응답 실패:", error);
      return { success: false, error: error.message };
    }
  });
