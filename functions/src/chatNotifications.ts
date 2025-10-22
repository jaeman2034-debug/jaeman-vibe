import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

// ?뮠 ??梨꾪똿 硫붿떆吏 ?몄떆 ?뚮┝
export const onNewChatMessage = functions.firestore
  .document("chats/{chatId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const chatId = context.params.chatId;
    const messageId = context.params.messageId;

    console.log("?뵒 ??硫붿떆吏 媛먯?:", {
      chatId,
      messageId,
      senderId: message.senderId,
      text: message.text
    });

    try {
      // 梨꾪똿諛??뺣낫 媛?몄삤湲?      const chatDoc = await db.collection("chats").doc(chatId).get();
      
      if (!chatDoc.exists) {
        console.warn("?좑툘 梨꾪똿諛⑹쓣 李얠쓣 ???놁뒿?덈떎:", chatId);
        return null;
      }

      const chat = chatDoc.data();
      if (!chat) return null;

      const sellerId = chat.sellerId;
      const buyerId = chat.buyerId;
      const senderId = message.senderId;
      const productTitle = chat.productTitle || "?곹뭹";

      console.log("?뱥 梨꾪똿諛??뺣낫:", {
        sellerId,
        buyerId,
        senderId,
        productTitle
      });

      // 諛쏅뒗 ?щ엺 寃곗젙 (諛쒖떊?먭? ?꾨땶 履?
      let receiverId = "";
      let receiverRole = "";

      if (senderId === buyerId) {
        // 援щℓ?먭? 蹂대궦 寃쎌슦 ???먮ℓ?먯뿉寃??뚮┝
        receiverId = sellerId;
        receiverRole = "?먮ℓ??;
      } else if (senderId === sellerId) {
        // ?먮ℓ?먭? 蹂대궦 寃쎌슦 ??援щℓ?먯뿉寃??뚮┝
        receiverId = buyerId;
        receiverRole = "援щℓ??;
      } else {
        console.warn("?좑툘 諛쒖떊?먭? 梨꾪똿諛?李몄뿬?먭? ?꾨떃?덈떎:", senderId);
        return null;
      }

      console.log("?렞 ?뚮┝ ???", { receiverId, receiverRole });

      // 諛쏅뒗 ?щ엺??FCM ?좏겙 媛?몄삤湲?      const receiverDoc = await db.collection("users").doc(receiverId).get();
      
      if (!receiverDoc.exists) {
        console.warn("?좑툘 諛쏅뒗 ?щ엺 ?뺣낫 ?놁쓬:", receiverId);
        return null;
      }

      const receiverData = receiverDoc.data();
      const fcmToken = receiverData?.fcmToken;

      if (!fcmToken) {
        console.log("?좑툘 FCM ?좏겙 ?놁쓬 (?ъ슜?먭? ?뚮┝ 沅뚰븳???덉슜?섏? ?딆븯嫄곕굹 濡쒓렇??????:", receiverId);
        return null;
      }

      console.log("??FCM ?좏겙 ?뺤씤:", fcmToken);

      // 硫붿떆吏 ?띿뒪??(理쒕? 100??
      const messageText = message.text.length > 100 
        ? message.text.substring(0, 100) + "..."
        : message.text;

      // FCM ?뚮┝ ?섏씠濡쒕뱶
      const payload = {
        notification: {
          title: `?뮠 ${productTitle}`,
          body: messageText,
          icon: chat.productImageUrl || "/icon-512x512.png",
          badge: "/icon-512x512.png",
          tag: chatId,  // 媛숈? 梨꾪똿諛??뚮┝ 洹몃９??          requireInteraction: false,
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
            link: `/chat/${chatId}`,  // ?뚮┝ ?대┃ ???대룞??URL
          },
        },
      };

      // FCM ?꾩넚
      const response = await admin.messaging().sendToDevice(fcmToken, payload);
      
      console.log("??FCM ?몄떆 ?뚮┝ ?꾩넚 ?꾨즺:", {
        receiverId,
        receiverRole,
        success: response.successCount,
        failure: response.failureCount
      });

      if (response.failureCount > 0) {
        console.error("??FCM ?꾩넚 ?ㅽ뙣:", response.results[0].error);
        
        // ?좏겙???좏슚?섏? ?딆쑝硫?Firestore?먯꽌 ?쒓굅
        if (response.results[0].error?.code === "messaging/invalid-registration-token" ||
            response.results[0].error?.code === "messaging/registration-token-not-registered") {
          console.log("?뿊截??좏슚?섏? ?딆? FCM ?좏겙 ?쒓굅:", receiverId);
          await db.collection("users").doc(receiverId).update({
            fcmToken: admin.firestore.FieldValue.delete(),
          });
        }
      }

      return null;

    } catch (error: any) {
      console.error("??FCM ?뚮┝ ?꾩넚 ?ㅻ쪟:", error);
      return null;
    }
  });

// ?뱤 梨꾪똿諛??앹꽦 ???섏쁺 ?뚮┝ (?좏깮?ы빆)
export const onChatRoomCreated = functions.firestore
  .document("chats/{chatId}")
  .onCreate(async (snap, context) => {
    const chat = snap.data();
    const chatId = context.params.chatId;

    console.log("?넅 ??梨꾪똿諛??앹꽦??", chatId);

    try {
      // ?먮ℓ?먯뿉寃?"??臾몄쓽" ?뚮┝
      const sellerDoc = await db.collection("users").doc(chat.sellerId).get();
      const fcmToken = sellerDoc.data()?.fcmToken;

      if (!fcmToken) {
        console.log("?좑툘 ?먮ℓ??FCM ?좏겙 ?놁쓬");
        return null;
      }

      const payload = {
        notification: {
          title: "?뵒 ??臾몄쓽媛 ?꾩갑?덉뒿?덈떎!",
          body: `${chat.productTitle}?????臾몄쓽媛 ?ㅼ뼱?붿뒿?덈떎.`,
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
      console.log("????臾몄쓽 ?뚮┝ ?꾩넚 ?꾨즺:", chat.sellerId);

      return null;
    } catch (error: any) {
      console.error("????臾몄쓽 ?뚮┝ ?ㅻ쪟:", error);
      return null;
    }
  });

