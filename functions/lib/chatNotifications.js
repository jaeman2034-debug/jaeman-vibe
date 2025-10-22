import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const db = admin.firestore();
// 💬 새 채팅 메시지 푸시 알림
export const onNewChatMessage = functions.firestore
    .document("chats/{chatId}/messages/{messageId}")
    .onCreate(async (snap, context) => {
    var _a, _b;
    const message = snap.data();
    const chatId = context.params.chatId;
    const messageId = context.params.messageId;
    console.log("🔔 새 메시지 감지:", {
        chatId,
        messageId,
        senderId: message.senderId,
        text: message.text
    });
    try {
        // 채팅방 정보 가져오기
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
        const productTitle = chat.productTitle || "상품";
        console.log("📋 채팅방 정보:", {
            sellerId,
            buyerId,
            senderId,
            productTitle
        });
        // 받는 사람 결정 (발신자가 아닌 쪽)
        let receiverId = "";
        let receiverRole = "";
        if (senderId === buyerId) {
            // 구매자가 보낸 경우 → 판매자에게 알림
            receiverId = sellerId;
            receiverRole = "판매자";
        }
        else if (senderId === sellerId) {
            // 판매자가 보낸 경우 → 구매자에게 알림
            receiverId = buyerId;
            receiverRole = "구매자";
        }
        else {
            console.warn("⚠️ 발신자가 채팅방 참여자가 아닙니다:", senderId);
            return null;
        }
        console.log("🎯 알림 대상:", { receiverId, receiverRole });
        // 받는 사람의 FCM 토큰 가져오기
        const receiverDoc = await db.collection("users").doc(receiverId).get();
        if (!receiverDoc.exists) {
            console.warn("⚠️ 받는 사람 정보 없음:", receiverId);
            return null;
        }
        const receiverData = receiverDoc.data();
        const fcmToken = receiverData === null || receiverData === void 0 ? void 0 : receiverData.fcmToken;
        if (!fcmToken) {
            console.log("⚠️ FCM 토큰 없음 (사용자가 알림 권한을 허용하지 않았거나 로그인 안 함):", receiverId);
            return null;
        }
        console.log("✅ FCM 토큰 확인:", fcmToken);
        // 메시지 텍스트 (최대 100자)
        const messageText = message.text.length > 100
            ? message.text.substring(0, 100) + "..."
            : message.text;
        // FCM 알림 페이로드
        const payload = {
            notification: {
                title: `💬 ${productTitle}`,
                body: messageText,
                icon: chat.productImageUrl || "/icon-512x512.png",
                badge: "/icon-512x512.png",
                tag: chatId, // 같은 채팅방 알림 그룹화
                requireInteraction: false,
            },
            data: {
                chatId: chatId,
                productId: chat.productId || "",
                senderId: senderId,
                type: "chat_message",
                clickAction: `/chat/${chatId}`,
            },
            webpush: {
                fcmOptions: {
                    link: `/chat/${chatId}`, // 알림 클릭 시 이동할 URL
                },
            },
        };
        // FCM 전송
        const response = await admin.messaging().sendToDevice(fcmToken, payload);
        console.log("✅ FCM 푸시 알림 전송 완료:", {
            receiverId,
            receiverRole,
            success: response.successCount,
            failure: response.failureCount
        });
        if (response.failureCount > 0) {
            console.error("❌ FCM 전송 실패:", response.results[0].error);
            // 토큰이 유효하지 않으면 Firestore에서 제거
            if (((_a = response.results[0].error) === null || _a === void 0 ? void 0 : _a.code) === "messaging/invalid-registration-token" ||
                ((_b = response.results[0].error) === null || _b === void 0 ? void 0 : _b.code) === "messaging/registration-token-not-registered") {
                console.log("🗑️ 유효하지 않은 FCM 토큰 제거:", receiverId);
                await db.collection("users").doc(receiverId).update({
                    fcmToken: admin.firestore.FieldValue.delete(),
                });
            }
        }
        return null;
    }
    catch (error) {
        console.error("❌ FCM 알림 전송 오류:", error);
        return null;
    }
});
// 📊 채팅방 생성 시 환영 알림 (선택사항)
export const onChatRoomCreated = functions.firestore
    .document("chats/{chatId}")
    .onCreate(async (snap, context) => {
    var _a;
    const chat = snap.data();
    const chatId = context.params.chatId;
    console.log("🆕 새 채팅방 생성됨:", chatId);
    try {
        // 판매자에게 "새 문의" 알림
        const sellerDoc = await db.collection("users").doc(chat.sellerId).get();
        const fcmToken = (_a = sellerDoc.data()) === null || _a === void 0 ? void 0 : _a.fcmToken;
        if (!fcmToken) {
            console.log("⚠️ 판매자 FCM 토큰 없음");
            return null;
        }
        const payload = {
            notification: {
                title: "🔔 새 문의가 도착했습니다!",
                body: `${chat.productTitle}에 대한 문의가 들어왔습니다.`,
                icon: chat.productImageUrl || "/icon-512x512.png",
            },
            data: {
                chatId: chatId,
                productId: chat.productId || "",
                type: "new_inquiry",
                clickAction: `/chat/${chatId}`,
            },
            webpush: {
                fcmOptions: {
                    link: `/chat/${chatId}`,
                },
            },
        };
        await admin.messaging().sendToDevice(fcmToken, payload);
        console.log("✅ 새 문의 알림 전송 완료:", chat.sellerId);
        return null;
    }
    catch (error) {
        console.error("❌ 새 문의 알림 오류:", error);
        return null;
    }
});
//# sourceMappingURL=chatNotifications.js.map