import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

// ?쨼 AI ?먮룞?묐떟 梨쀫큸
export const onAutoReplyChat = functions.firestore
  .document("chats/{chatId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const chatId = context.params.chatId;
    const messageId = context.params.messageId;

    console.log("?쨼 AI ?먮룞?묐떟 泥댄겕 ?쒖옉:", {
      chatId,
      messageId,
      senderId: message.senderId,
      text: message.text
    });

    try {
      // 梨꾪똿諛??뺣낫 濡쒕뱶
      const chatDoc = await db.collection("chats").doc(chatId).get();
      
      if (!chatDoc.exists) {
        console.warn("?좑툘 梨꾪똿諛⑹쓣 李얠쓣 ???놁뒿?덈떎:", chatId);
        return null;
      }

      const chat = chatDoc.data();
      if (!chat) return null;

      const sellerId = chat.sellerId;
      const buyerId = chat.buyerId;
      const senderId = message.senderId;

      // 1截뤴깵 援щℓ??硫붿떆吏留?泥섎━ (?먮ℓ??AI媛 蹂대궦 嫄??쒖쇅)
      if (senderId !== buyerId) {
        console.log("?뱄툘 ?먮ℓ???먮뒗 AI 硫붿떆吏 ???먮룞?묐떟 嫄대꼫?");
        return null;
      }

      // AI 硫붿떆吏??嫄대꼫?
      if (senderId === "AI_Assistant") {
        console.log("?뱄툘 AI 硫붿떆吏 ??嫄대꼫?");
        return null;
      }

      console.log("?뱥 梨꾪똿諛??뺣낫:", { sellerId, buyerId, senderId });

      // 2截뤴깵 ?먮ℓ???곹깭 ?뺤씤
      const sellerDoc = await db.collection("users").doc(sellerId).get();
      
      if (!sellerDoc.exists) {
        console.warn("?좑툘 ?먮ℓ???뺣낫 ?놁쓬:", sellerId);
        return null;
      }

      const seller = sellerDoc.data();
      const isOnline = seller?.isOnline || false;

      console.log("?뵇 ?먮ℓ???곹깭:", { sellerId, isOnline });

      // ?먮ℓ?먭? ?⑤씪?몄씠硫??먮룞?묐떟 嫄대꼫?
      if (isOnline) {
        console.log("???먮ℓ???⑤씪????AI ?먮룞?묐떟 嫄대꼫?");
        return null;
      }

      console.log("?쨼 ?먮ℓ???ㅽ봽?쇱씤 ??AI ?먮룞?묐떟 ?쒖옉");

      // 3截뤴깵 ?곹뭹 ?뺣낫 媛?몄삤湲?      const productId = chat.productId;
      const productDoc = await db.collection("market-uploads").doc(productId).get();
      const product = productDoc.data();

      if (!product) {
        console.warn("?좑툘 ?곹뭹 ?뺣낫 ?놁쓬:", productId);
      }

      // ?곹뭹 ?뺣낫 而⑦뀓?ㅽ듃 援ъ꽦
      const contextText = `
?곹뭹紐? ${chat.productTitle || product?.title || "誘몃벑濡??곹뭹"}
媛寃? ${chat.productPrice || product?.price || "媛寃??뺣낫 ?놁쓬"}???곹뭹 ?ㅻ챸: ${product?.description || "?ㅻ챸 ?놁쓬"}
AI 遺꾩꽍 (?쒓뎅??: ${product?.caption_ko || ""}
AI 遺꾩꽍 (?곸뼱): ${product?.caption_en || ""}
移댄뀒怨좊━: ${product?.aiCategory || ""}
釉뚮옖?? ${product?.aiBrand || ""}
?곹깭: ${product?.aiCondition || ""}
`;

      console.log("?뱷 AI 而⑦뀓?ㅽ듃:", contextText);

      // 4截뤴깵 OpenAI API ?몄텧
      const apiKey = functions.config().openai?.api_key || process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        console.warn("?좑툘 OPENAI_API_KEY ?놁쓬 ??AI ?먮룞?묐떟 嫄대꼫?");
        return null;
      }

      const prompt = `?뱀떊? YAGO VIBE ?ㅽ룷痢?留덉폆??移쒖젅???먮ℓ 蹂댁“ AI?낅땲??

怨좉컼???ㅼ쓬怨?媛숈씠 臾몄쓽?덉뒿?덈떎:
"${message.text}"

?꾨옒 ?곹뭹 ?뺣낫瑜?李멸퀬?섏뿬 ?먯뿰?ㅻ읇怨?移쒖젅???쒓뎅?대줈 ?듬???二쇱꽭??
${contextText}

?듬? 洹쒖튃:
1. 媛꾧껐?섍퀬 移쒖젅?섍쾶 (2-3臾몄옣 ?대궡)
2. ?곹뭹 ?뺣낫???덈뒗 ?댁슜留??듬?
3. 紐⑤Ⅴ???댁슜? "?먮ℓ?먯뿉寃??뺤씤??蹂닿쿋?듬땲???쇨퀬 ?듬?
4. ?대え吏 ?ъ슜 媛??(?삃, ?몟 ??
5. "?먮ℓ?먮떂猿섏꽌 怨??듬??섏떎 ?덉젙?낅땲?? 臾멸뎄 ?ы븿
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
              content: "?뱀떊? 移쒖젅???ㅽ룷痢??⑺뭹 ?먮ℓ 蹂댁“ AI?낅땲?? 怨좉컼?먭쾶 ?뺥솗?섍퀬 移쒖젅?섍쾶 ?듬??섏꽭??" 
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
        throw new Error(`OpenAI API ?ㅻ쪟: ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.choices?.[0]?.message?.content?.trim() || "";

      console.log("?쨼 AI ?앹꽦 ?듬?:", replyText);

      // 5截뤴깵 Firestore??AI 硫붿떆吏 異붽?
      if (replyText) {
        await db.collection("chats").doc(chatId).collection("messages").add({
          senderId: "AI_Assistant",
          senderEmail: "AI 梨쀫큸",
          text: replyText,
          type: "auto-reply",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 梨꾪똿諛?lastMessage ?낅뜲?댄듃
        await db.collection("chats").doc(chatId).update({
          lastMessage: `?쨼 ${replyText.substring(0, 50)}...`,
          lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log("??AI ?먮룞?묐떟 ?꾩넚 ?꾨즺:", replyText);
      } else {
        console.warn("?좑툘 AI ?묐떟??鍮꾩뼱?덉뒿?덈떎.");
      }

      return null;

    } catch (error: any) {
      console.error("??AI ?먮룞?묐떟 ?ㅻ쪟:", error);
      
      // ?ㅻ쪟 諛쒖깮 ??湲곕낯 硫붿떆吏 ?꾩넚
      try {
        await db.collection("chats").doc(chatId).collection("messages").add({
          senderId: "AI_Assistant",
          senderEmail: "AI 梨쀫큸",
          text: "?먮ℓ?먮떂猿섏꽌 怨??듬??섏떎 ?덉젙?낅땲?? ?좎떆留?湲곕떎??二쇱꽭?? ?삃",
          type: "auto-reply",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log("??湲곕낯 AI ?묐떟 ?꾩넚 ?꾨즺");
      } catch (fallbackError) {
        console.error("??湲곕낯 ?묐떟 ?꾩넚???ㅽ뙣:", fallbackError);
      }

      return null;
    }
  });

// ?윟 ?ъ슜???⑤씪???곹깭 ?낅뜲?댄듃 ?ы띁 ?⑥닔 (?좏깮?ы빆)
export const updateUserOnlineStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "濡쒓렇?몄씠 ?꾩슂?⑸땲??);
  }

  const userId = context.auth.uid;
  const isOnline = data.isOnline || false;

  await db.collection("users").doc(userId).update({
    isOnline: isOnline,
    lastActive: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`?윟 ?ъ슜???곹깭 ?낅뜲?댄듃: ${userId} ??${isOnline ? "?⑤씪?? : "?ㅽ봽?쇱씤"}`);

  return { success: true, userId, isOnline };
});

