/**
 * 🔔 YAGO VIBE - 채팅 알림 자동화 시스템
 * 
 * 기능:
 * 1. 새 메시지 감지 (Firestore Trigger)
 * 2. 판매자/구매자 자동 알림 (FCM Push)
 * 3. AI 자동 응답 (키워드 기반)
 * 4. n8n Webhook 연동 (Slack/Discord)
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// ✅ 1️⃣ 새 메시지 감지 트리거
exports.onNewChatMessage = functions.firestore
  .document("chatRooms/{roomId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const { roomId, messageId } = context.params;

    console.log("📩 새 메시지 감지:", {
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
      const { participants, productTitle, productId } = roomData;

      // 메시지 발신자가 아닌 다른 참여자 찾기 (수신자)
      const receiver = participants?.find((uid) => uid !== message.sender);

      if (!receiver) {
        console.warn("⚠️ 수신자를 찾을 수 없습니다");
        return null;
      }

      console.log("📬 수신자:", receiver);

      // ✅ 2️⃣ FCM 푸시 알림 전송
      await sendPushNotification(receiver, {
        title: `💬 ${productTitle || "새 메시지"}`,
        body: message.text,
        roomId,
        productId,
      });

      // ✅ 3️⃣ AI 자동 응답 (키워드 기반)
      await handleAutoResponse(roomId, message);

      // ✅ 4️⃣ n8n Webhook 알림 (선택)
      await sendWebhookNotification(roomId, message, roomData);

      return null;
    } catch (error) {
      console.error("❌ 채팅 알림 처리 실패:", error);
      return null;
    }
  });

/**
 * 📱 FCM 푸시 알림 전송
 */
async function sendPushNotification(userId, { title, body, roomId, productId }) {
  try {
    // 사용자 FCM 토큰 가져오기
    const userDoc = await admin.firestore().doc(`users/${userId}`).get();
    const fcmToken = userDoc.data()?.fcmToken;

    if (!fcmToken) {
      console.log("⚠️ FCM 토큰이 없습니다:", userId);
      return;
    }

    const payload = {
      notification: {
        title,
        body: body.length > 100 ? body.substring(0, 100) + "..." : body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/badge-72x72.png",
        tag: `chat-${roomId}`,
      },
      data: {
        type: "chat",
        roomId,
        productId: productId || "",
        click_action: `/chat/${roomId}`,
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "chat_messages",
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
    };

    await admin.messaging().sendToDevice(fcmToken, payload);
    console.log("✅ FCM 알림 전송 완료:", userId);
  } catch (error) {
    console.error("❌ FCM 알림 전송 실패:", error);
  }
}

/**
 * 🤖 AI 자동 응답 (키워드 기반)
 */
async function handleAutoResponse(roomId, message) {
  const text = message.text.toLowerCase();

  // 시스템 메시지는 무시
  if (message.sender === "system" || message.sender === "anonymous") {
    return;
  }

  let autoReply = null;

  // 키워드 기반 자동 응답
  if (text.includes("사진") || text.includes("이미지")) {
    autoReply = "📸 상품 사진은 상단 이미지에서 확인하실 수 있습니다!";
  } else if (text.includes("가격") || text.includes("얼마")) {
    autoReply = "💰 상품 가격은 상세 페이지에서 확인해주세요.";
  } else if (text.includes("배송") || text.includes("택배")) {
    autoReply = "📦 배송 방법은 판매자와 직접 상의해주세요.";
  } else if (text.includes("안녕") || text.includes("hello")) {
    autoReply = "👋 안녕하세요! YAGO VIBE입니다. 무엇을 도와드릴까요?";
  }

  // 자동 응답 메시지 전송
  if (autoReply) {
    await admin
      .firestore()
      .collection("chatRooms")
      .doc(roomId)
      .collection("messages")
      .add({
        text: autoReply,
        sender: "system",
        senderName: "YAGO VIBE 봇",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
        isAutoReply: true,
      });

    console.log("🤖 AI 자동 응답 전송:", autoReply);
  }
}

/**
 * 🔗 n8n Webhook 알림 (Slack/Discord)
 */
async function sendWebhookNotification(roomId, message, roomData) {
  const webhookUrl = process.env.N8N_CHAT_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log("⚠️ n8n Webhook URL이 설정되지 않았습니다");
    return;
  }

  try {
    const payload = {
      event: "new_chat_message",
      roomId,
      productTitle: roomData.productTitle || "알 수 없음",
      productId: roomData.productId || "",
      message: {
        text: message.text,
        sender: message.sender,
        senderName: message.senderName || "익명",
        timestamp: new Date().toISOString(),
      },
      chatUrl: `https://yagovibe.com/chat/${roomId}`,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log("✅ n8n Webhook 알림 전송 완료");
    } else {
      console.warn("⚠️ n8n Webhook 응답 오류:", response.status);
    }
  } catch (error) {
    console.error("❌ n8n Webhook 전송 실패:", error);
  }
}

/**
 * 📊 채팅 통계 업데이트 (선택)
 */
exports.updateChatStats = functions.firestore
  .document("chatRooms/{roomId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const { roomId } = context.params;

    try {
      const roomRef = admin.firestore().doc(`chatRooms/${roomId}`);
      
      await roomRef.update({
        messageCount: admin.firestore.FieldValue.increment(1),
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("📊 채팅 통계 업데이트 완료:", roomId);
    } catch (error) {
      console.error("❌ 채팅 통계 업데이트 실패:", error);
    }

    return null;
  });

/**
 * 🗑️ 오래된 채팅방 자동 정리 (선택)
 */
exports.cleanupOldChats = functions.pubsub
  .schedule("0 3 * * *") // 매일 새벽 3시
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const oldChatsQuery = admin
        .firestore()
        .collection("chatRooms")
        .where("lastActivity", "<", thirtyDaysAgo)
        .where("status", "==", "active");

      const snapshot = await oldChatsQuery.get();

      const batch = admin.firestore().batch();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { status: "archived" });
      });

      await batch.commit();

      console.log(`🗑️ ${snapshot.size}개의 오래된 채팅방 아카이브 완료`);
    } catch (error) {
      console.error("❌ 채팅방 정리 실패:", error);
    }

    return null;
  });

