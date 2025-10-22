/**
 * 🔗 YAGO VIBE - n8n 채팅 Webhook 연동
 * 
 * 기능:
 * 1. 새 메시지 → n8n Webhook 전송
 * 2. Slack/Discord/Telegram/KakaoTalk 알림
 * 3. 채팅 이벤트 로깅
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * 🔔 새 메시지 → n8n Webhook 트리거
 */
exports.sendChatToN8N = functions.firestore
  .document("chatRooms/{roomId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const { roomId, messageId } = context.params;

    console.log("💬 새 메시지 감지:", {
      roomId,
      messageId,
      text: message.text,
      sender: message.sender,
    });

    try {
      // 채팅방 정보 가져오기
      const roomRef = admin.firestore().doc(`chatRooms/${roomId}`);
      const roomSnap = await roomRef.get();
      
      if (!roomSnap.exists) {
        console.warn("⚠️ 채팅방을 찾을 수 없습니다:", roomId);
        return null;
      }

      const roomData = roomSnap.data();

      // n8n Webhook URL (환경변수 또는 기본값)
      const N8N_WEBHOOK_URL = 
        process.env.N8N_CHAT_WEBHOOK_URL || 
        functions.config().n8n?.webhook_url ||
        "https://n8n.yagovibe.com/webhook/chat-new-message";

      // 전송 Payload
      const payload = {
        event: "new_chat_message",
        roomId,
        messageId,
        message: {
          text: message.text || "",
          sender: message.sender || "unknown",
          senderName: message.senderName || "익명",
          createdAt: message.createdAt 
            ? (message.createdAt.toDate ? message.createdAt.toDate().toISOString() : new Date().toISOString())
            : new Date().toISOString(),
        },
        room: {
          productId: roomData.productId || "",
          productTitle: roomData.productTitle || "알 수 없음",
          productImage: roomData.productImage || "",
          participants: roomData.participants || [],
        },
        links: {
          chatRoom: `https://yagovibe.com/chat/${roomId}`,
          product: roomData.productId ? `https://yagovibe.com/market/${roomData.productId}` : "",
        },
        timestamp: new Date().toISOString(),
      };

      console.log("🔗 n8n Webhook 호출:", N8N_WEBHOOK_URL);

      // n8n Webhook 호출
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "YAGO-VIBE-Functions/1.0",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log("✅ n8n Webhook 전송 완료:", response.status);
        
        // 성공 로그 저장
        await admin.firestore().collection("logs").add({
          event: "n8n_webhook_success",
          roomId,
          messageId,
          webhookUrl: N8N_WEBHOOK_URL,
          status: response.status,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        console.warn("⚠️ n8n Webhook 응답 오류:", response.status, await response.text());
        
        // 실패 로그 저장
        await admin.firestore().collection("logs").add({
          event: "n8n_webhook_error",
          roomId,
          messageId,
          webhookUrl: N8N_WEBHOOK_URL,
          status: response.status,
          error: await response.text(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return null;
    } catch (error) {
      console.error("❌ n8n Webhook 전송 실패:", error);
      
      // 에러 로그 저장
      await admin.firestore().collection("logs").add({
        event: "n8n_webhook_exception",
        roomId,
        messageId,
        error: error.message,
        stack: error.stack,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return null;
    }
  });

/**
 * 📊 채팅 이벤트 로깅 (추가 트리거)
 */
exports.logChatEvent = functions.firestore
  .document("chatRooms/{roomId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const { roomId, messageId } = context.params;

    try {
      // 이벤트 로그 저장
      await admin.firestore().collection("chatEvents").add({
        type: "message_created",
        roomId,
        messageId,
        sender: message.sender || "unknown",
        textLength: message.text?.length || 0,
        isAutoReply: message.isAutoReply || false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("📊 채팅 이벤트 로깅 완료:", messageId);
    } catch (error) {
      console.error("❌ 채팅 이벤트 로깅 실패:", error);
    }

    return null;
  });

/**
 * 🔔 채팅방 생성 알림 (선택)
 */
exports.notifyNewChatRoom = functions.firestore
  .document("chatRooms/{roomId}")
  .onCreate(async (snap, context) => {
    const roomData = snap.data();
    const { roomId } = context.params;

    console.log("🆕 새 채팅방 생성:", roomId);

    try {
      const N8N_WEBHOOK_URL = 
        process.env.N8N_CHAT_ROOM_WEBHOOK_URL || 
        functions.config().n8n?.room_webhook_url;

      if (!N8N_WEBHOOK_URL) {
        console.log("⚠️ 채팅방 생성 Webhook URL이 설정되지 않았습니다");
        return null;
      }

      const payload = {
        event: "new_chat_room",
        roomId,
        productId: roomData.productId || "",
        productTitle: roomData.productTitle || "알 수 없음",
        participants: roomData.participants || [],
        createdAt: new Date().toISOString(),
        chatUrl: `https://yagovibe.com/chat/${roomId}`,
      };

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log("✅ 채팅방 생성 알림 전송 완료");
      }

      return null;
    } catch (error) {
      console.error("❌ 채팅방 생성 알림 실패:", error);
      return null;
    }
  });

