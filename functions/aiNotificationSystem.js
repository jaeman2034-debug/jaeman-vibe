// 🤖 AI + FCM + Slack 통합 알림 시스템
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const OpenAI = require("openai");
const fetch = require("node-fetch");

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY,
});

// Slack Webhook URL (선택사항)
const SLACK_WEBHOOK_URL = functions.config().slack?.webhook_url || process.env.SLACK_WEBHOOK_URL;

/**
 * 🤖 AI 응답 + 판매자 FCM 알림 + Slack 로그
 */
exports.aiProductChatNotification = functions.firestore
  .document("chatRooms/{roomId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const roomId = context.params.roomId;
    const messageId = context.params.messageId;

    console.log(`🤖 AI 알림 트리거: roomId=${roomId}, messageId=${messageId}`);

    // AI가 보낸 메시지는 무시
    if (message.senderId === "AI" || message.senderId === "yago-bot") {
      console.log("🤖 AI 메시지 무시");
      return null;
    }

    // 빈 메시지는 무시
    if (!message.text || message.text.trim().length === 0) {
      console.log("🤖 빈 메시지 무시");
      return null;
    }

    try {
      // ① 채팅방 정보 가져오기
      const roomRef = db.collection("chatRooms").doc(roomId);
      const roomSnap = await roomRef.get();
      const room = roomSnap.data();

      if (!room) {
        console.error("❌ 채팅방 정보를 찾을 수 없습니다.");
        return null;
      }

      // ② 상품 정보 가져오기 (상품 기반 채팅인 경우)
      let productInfo = null;
      if (room.productId) {
        try {
          const productSnap = await db.collection("marketItems").doc(room.productId).get();
          if (productSnap.exists()) {
            productInfo = productSnap.data();
          }
        } catch (error) {
          console.warn("⚠️ 상품 정보를 가져올 수 없습니다:", error);
        }
      }

      // ③ AI 답변 생성
      let aiReply = "안녕하세요! 무엇을 도와드릴까요? 😊";
      
      if (productInfo) {
        // 상품 기반 AI 답변
        const prompt = `
당신은 "야고봇"이라는 친절한 스포츠 중고거래 플랫폼 AI 어시스턴트입니다.

상품 정보:
- 상품명: ${productInfo.title || "상품"}
- 가격: ${productInfo.price ? productInfo.price.toLocaleString() : "가격 문의"}원
- 설명: ${productInfo.desc || "상품 설명 없음"}

사용자 메시지: "${message.text}"

다음 규칙에 따라 답변해주세요:
1. 상품 정보를 바탕으로 정확하고 도움이 되는 답변 제공
2. 가격 문의 시 구체적인 가격 정보 제공
3. 상품 상태나 특징에 대한 질문에는 상품 설명을 참고하여 답변
4. 거래 관련 질문에는 "판매자와 직접 상의해보세요" 안내
5. 짧고 친절하게 한국어로 답변 (1-2문장)
6. 이모지 1-2개 적절히 사용

답변:`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 150,
          temperature: 0.7,
        });

        aiReply = response.choices[0].message.content?.trim() || aiReply;
      } else {
        // 일반 AI 답변
        const prompt = `
당신은 "야고봇"이라는 친절한 스포츠 중고거래 플랫폼 AI 어시스턴트입니다.

사용자 메시지: "${message.text}"

짧고 친절하게 한국어로 답변해주세요. (1-2문장, 이모지 1-2개 사용)

답변:`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 100,
          temperature: 0.7,
        });

        aiReply = response.choices[0].message.content?.trim() || aiReply;
      }

      console.log(`🤖 AI 답변 생성: "${aiReply}"`);

      // ④ Firestore에 AI 응답 추가
      await roomRef.collection("messages").add({
        text: aiReply,
        senderId: "yago-bot",
        senderName: "야고봇 🤖",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isAI: true,
      });

      // 채팅방 lastMessage 업데이트
      await roomRef.update({
        lastMessage: aiReply,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageSender: "yago-bot",
      });

      // ⑤ 판매자에게 FCM 푸시 알림
      try {
        const sellerTokenSnap = await db.collection("fcmTokens").doc(room.sellerId).get();
        if (sellerTokenSnap.exists()) {
          const token = sellerTokenSnap.data().token;
          
          const notificationTitle = productInfo 
            ? `📩 ${room.buyerName}님이 '${productInfo.title}'에 대해 질문했습니다`
            : `📩 ${room.buyerName}님으로부터 새 메시지가 도착했습니다`;
          
          const notificationBody = message.text.length > 50 
            ? message.text.substring(0, 50) + "..."
            : message.text;

          await admin.messaging().send({
            token,
            notification: {
              title: notificationTitle,
              body: notificationBody,
            },
            data: {
              roomId,
              productId: room.productId || "",
              buyerName: room.buyerName || "구매자",
              messageType: "new_inquiry",
            },
            android: {
              notification: {
                icon: "ic_notification",
                color: "#8B5CF6",
                sound: "default",
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: "default",
                  badge: 1,
                },
              },
            },
          });

          console.log(`📲 판매자에게 FCM 푸시 전송 완료: ${room.sellerId}`);
        } else {
          console.warn(`⚠️ 판매자 FCM 토큰을 찾을 수 없습니다: ${room.sellerId}`);
        }
      } catch (fcmError) {
        console.error("❌ FCM 푸시 전송 실패:", fcmError);
      }

      // ⑥ Slack 알림 (선택사항)
      if (SLACK_WEBHOOK_URL) {
        try {
          const slackMessage = {
            text: `🤖 *AI 응답 완료*`,
            attachments: [
              {
                color: productInfo ? "good" : "warning",
                fields: [
                  {
                    title: "상품",
                    value: productInfo ? productInfo.title : "일반 채팅",
                    short: true,
                  },
                  {
                    title: "구매자",
                    value: room.buyerName || "알 수 없음",
                    short: true,
                  },
                  {
                    title: "질문",
                    value: message.text,
                    short: false,
                  },
                  {
                    title: "AI 답변",
                    value: aiReply,
                    short: false,
                  },
                ],
                footer: "YAGO VIBE AI System",
                ts: Math.floor(Date.now() / 1000),
              },
            ],
          };

          await fetch(SLACK_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(slackMessage),
          });

          console.log("📱 Slack 알림 전송 완료");
        } catch (slackError) {
          console.error("❌ Slack 알림 전송 실패:", slackError);
        }
      }

      console.log("🔥 AI 응답 + FCM + Slack 알림 완료");
      return { success: true, aiReply };

    } catch (error) {
      console.error("❌ AI 알림 시스템 오류:", error);
      
      // 에러 발생 시 기본 응답
      const fallbackReply = "죄송합니다. 현재 답변을 생성할 수 없습니다. 잠시 후 다시 시도해주세요. 😅";
      
      try {
        const roomRef = db.collection("chatRooms").doc(roomId);
        await roomRef.collection("messages").add({
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
 * 🧪 AI 알림 시스템 테스트 함수
 */
exports.testAINotification = functions.https.onCall(async (data, context) => {
  const { testMessage, roomId } = data;
  
  if (!testMessage || !roomId) {
    throw new functions.https.HttpsError("invalid-argument", "testMessage and roomId are required");
  }

  try {
    // 테스트 메시지 생성
    const roomRef = db.collection("chatRooms").doc(roomId);
    const testMessageRef = await roomRef.collection("messages").add({
      text: testMessage,
      senderId: context.auth?.uid || "test-user",
      senderName: "테스트 사용자",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { 
      success: true, 
      messageId: testMessageRef.id,
      message: "테스트 메시지가 생성되었습니다. AI 응답을 확인해주세요."
    };

  } catch (error) {
    console.error("❌ AI 알림 테스트 실패:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
