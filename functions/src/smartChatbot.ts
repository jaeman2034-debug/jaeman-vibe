import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

// ?쭬 吏?ν삎 ?숈뒿 AI ?먮ℓ 鍮꾩꽌
export const onSmartAutoReply = functions.firestore
  .document("chats/{chatId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const chatId = context.params.chatId;
    const messageId = context.params.messageId;

    console.log("?쭬 吏?ν삎 AI 梨쀫큸 ?쒖옉:", {
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

      // 1截뤴깵 援щℓ??硫붿떆吏留?泥섎━
      if (senderId !== buyerId) {
        console.log("?뱄툘 ?먮ℓ??硫붿떆吏 ??嫄대꼫?");
        return null;
      }

      // AI 硫붿떆吏??嫄대꼫?
      if (senderId === "AI_Assistant" || senderId === "AI_ShopBot") {
        console.log("?뱄툘 AI 硫붿떆吏 ??嫄대꼫?");
        return null;
      }

      // 2截뤴깵 ?먮ℓ???⑤씪???곹깭 ?뺤씤
      const sellerUserDoc = await db.collection("users").doc(sellerId).get();
      const isOnline = sellerUserDoc.data()?.isOnline || false;

      if (isOnline) {
        console.log("???먮ℓ???⑤씪????AI ?먮룞?묐떟 嫄대꼫?");
        return null;
      }

      console.log("?쨼 ?먮ℓ???ㅽ봽?쇱씤 ??吏?ν삎 AI ?묐떟 ?쒖옉");

      // ?㎥ 3截뤴깵 ?먮ℓ???숈뒿 ?곗씠??濡쒕뱶 (sellers 而щ젆??
      const sellerDoc = await db.collection("sellers").doc(sellerId).get();
      const sellerData = sellerDoc.data() || {};

      console.log("?뱴 ?먮ℓ???숈뒿 ?곗씠??", {
        intro: sellerData.intro || "?놁쓬",
        faqCount: (sellerData.faq || []).length,
        memoryCount: (sellerData.memory || []).length
      });

      // ?㎥ 4截뤴깵 ?곹뭹 ?뺣낫 濡쒕뱶
      const productId = chat.productId;
      const productDoc = await db.collection("market-uploads").doc(productId).get();
      const productData = productDoc.data() || {};

      console.log("?벀 ?곹뭹 ?뺣낫:", {
        title: productData.title || "?놁쓬",
        price: productData.price || "?놁쓬"
      });

      // ?㎥ 5截뤴깵 理쒓렐 ???留λ씫 濡쒕뱶 (理쒕? 10媛?
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
          const role = data.senderId === buyerId ? "援щℓ?? : 
                      data.senderId === sellerId ? "?먮ℓ?? : 
                      "AI";
          return `${role}: ${data.text}`;
        })
        .reverse();

      console.log("?뮠 理쒓렐 ???", recentMessages.length, "媛?);

      // ?쭬 6截뤴깵 AI 而⑦뀓?ㅽ듃 援ъ꽦 (?먮ℓ?먮퀎 ?숈뒿 ?곗씠??
      const contextText = `
[?먮ℓ???뚭컻]
${sellerData.intro || "?뚭컻 ?뺣낫媛 ?놁뒿?덈떎."}

[?먯＜ 臾삳뒗 吏덈Ц (FAQ)]
${(sellerData.faq || []).map((f: string, i: number) => `Q${i + 1}. ${f}`).join("\n") || "FAQ媛 ?놁뒿?덈떎."}

[?먮ℓ???곹뭹 ?쒓렇]
${(sellerData.productTags || []).join(", ") || "?쒓렇 ?놁쓬"}

[?먮ℓ??怨쇨굅 ?숈뒿 硫붾え由?
${(sellerData.memory || []).slice(-5).map((m: any) => `Q: ${m.query}\nA: ${m.reply}`).join("\n\n") || "?숈뒿 湲곕줉 ?놁쓬"}

[?꾩옱 ?곹뭹 ?뺣낫]
?곹뭹紐? ${chat.productTitle || productData.title || "?쒕ぉ ?놁쓬"}
媛寃? ${chat.productPrice || productData.price || "媛寃?誘몄젙"}???곹뭹 ?ㅻ챸: ${productData.description || ""}
AI 遺꾩꽍 (?쒓뎅??: ${productData.caption_ko || ""}
AI 遺꾩꽍 (?곸뼱): ${productData.caption_en || ""}
移댄뀒怨좊━: ${productData.aiCategory || ""}
釉뚮옖?? ${productData.aiBrand || ""}
?곹깭: ${productData.aiCondition || ""}
異붿쿇 媛寃? ${productData.aiSuggestedPrice || ""}??
[理쒓렐 ???湲곕줉 (而⑦뀓?ㅽ듃 ?좎?)]
${recentMessages.join("\n")}
`;

      console.log("?쭬 AI 而⑦뀓?ㅽ듃 ?ш린:", contextText.length, "??);

      // ?쨼 7截뤴깵 OpenAI GPT-4o-mini ?몄텧 (而⑦뀓?ㅽ듃 湲곕컲)
      const apiKey = functions.config().openai?.api_key || process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        console.warn("?좑툘 OPENAI_API_KEY ?놁쓬");
        return null;
      }

      const systemPrompt = `?뱀떊? YAGO VIBE ?ㅽ룷痢?留덉폆???먮ℓ?먮? ??좏븯??移쒖젅??AI ?먮ℓ 鍮꾩꽌?낅땲??

?듬? 洹쒖튃:
1. ?먮ℓ?먯쓽 ?ㅽ??쇨낵 ?ㅼ쓣 ?좎??섏꽭??2. ?곹뭹 ?뺣낫? FAQ瑜??곗꽑 李멸퀬?섏꽭??3. 理쒓렐 ???湲곕줉??怨좊젮?섏뿬 留λ씫??留욌뒗 ?듬????섏꽭??4. 紐⑤Ⅴ???댁슜? "?먮ℓ?먮떂猿??뺤씤 ???듬??쒕━寃좎뒿?덈떎"?쇨퀬 ?붿쭅?섍쾶 留먰븯?몄슂
5. 媛꾧껐?섍퀬 移쒖젅?섍쾶 (2-3臾몄옣)
6. ?대え吏 ?곸젅???ъ슜 (?삃, ?몟, ????
7. ?먮ℓ??怨쇨굅 ?숈뒿 硫붾え由щ? 李멸퀬?섏뿬 ?쇨????덈뒗 ?듬????섏꽭??
???뺣낫瑜?諛뷀깢?쇰줈 怨좉컼?먭쾶 ?먯뿰?ㅻ읇怨??꾩????섎뒗 ?듬????쒓났?섏꽭??`;

      const userPrompt = `
[?먮ℓ??諛??곹뭹 而⑦뀓?ㅽ듃]
${contextText}

[怨좉컼 臾몄쓽]
${message.text}

???뺣낫瑜?李멸퀬?섏뿬 ?듬???二쇱꽭??`;

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
        throw new Error(`OpenAI API ?ㅻ쪟: ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.choices?.[0]?.message?.content?.trim() || "";

      console.log("?쨼 AI ?앹꽦 ?듬?:", replyText);

      // ?㎥ 8截뤴깵 Firestore??AI 硫붿떆吏 異붽?
      if (replyText) {
        await db.collection("chats").doc(chatId).collection("messages").add({
          senderId: "AI_ShopBot",
          senderEmail: "?쨼 吏?ν삎 AI ?먮ℓ 鍮꾩꽌",
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

        // 梨꾪똿諛?lastMessage ?낅뜲?댄듃
        await db.collection("chats").doc(chatId).update({
          lastMessage: `?쨼 ${replyText.substring(0, 50)}...`,
          lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // ?쭬 9截뤴깵 ?먮ℓ???숈뒿 硫붾え由ъ뿉 ?대쾲 ???湲곕줉
        await db.collection("sellers").doc(sellerId).set(
          {
            memory: admin.firestore.FieldValue.arrayUnion({
              query: message.text,
              reply: replyText,
              productId: productId,
              timestamp: new Date().toISOString(),
            }),
          },
          { merge: true }
        );

        console.log("??吏?ν삎 AI ?묐떟 ?꾩넚 + ?숈뒿 硫붾え由?????꾨즺");
      }

      return null;

    } catch (error: any) {
      console.error("??吏?ν삎 AI 梨쀫큸 ?ㅻ쪟:", error);
      
      // ?먮윭 ??湲곕낯 硫붿떆吏
      try {
        await db.collection("chats").doc(chatId).collection("messages").add({
          senderId: "AI_ShopBot",
          senderEmail: "?쨼 AI ?먮ℓ 鍮꾩꽌",
          text: "?먮ℓ?먮떂猿섏꽌 怨??듬??섏떎 ?덉젙?낅땲?? ?좎떆留?湲곕떎??二쇱꽭?? ?삃",
          type: "fallback",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log("??湲곕낯 ?묐떟 ?꾩넚 ?꾨즺");
      } catch (fallbackError) {
        console.error("??湲곕낯 ?묐떟???ㅽ뙣:", fallbackError);
      }

      return null;
    }
  });

// ?뱴 ?먮ℓ???숈뒿 ?곗씠??珥덇린???ы띁 ?⑥닔
export const initSellerData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "濡쒓렇?몄씠 ?꾩슂?⑸땲??);
  }

  const sellerId = context.auth.uid;
  const { intro, faq, productTags } = data;

  await db.collection("sellers").doc(sellerId).set(
    {
      sellerId: sellerId,
      intro: intro || "",
      faq: faq || [],
      productTags: productTags || [],
      memory: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log("???먮ℓ???숈뒿 ?곗씠??珥덇린???꾨즺:", sellerId);

  return { 
    success: true, 
    sellerId,
    message: "?먮ℓ??AI ?숈뒿 ?곗씠?곌? 珥덇린?붾릺?덉뒿?덈떎."
  };
});

// ?봽 ?먮ℓ??FAQ ?낅뜲?댄듃 ?ы띁 ?⑥닔
export const updateSellerFAQ = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "濡쒓렇?몄씠 ?꾩슂?⑸땲??);
  }

  const sellerId = context.auth.uid;
  const { faq } = data;

  if (!Array.isArray(faq)) {
    throw new functions.https.HttpsError("invalid-argument", "faq??諛곗뿴?댁뼱???⑸땲??);
  }

  await db.collection("sellers").doc(sellerId).update({
    faq: faq,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("???먮ℓ??FAQ ?낅뜲?댄듃 ?꾨즺:", { sellerId, faqCount: faq.length });

  return { 
    success: true, 
    sellerId,
    faqCount: faq.length 
  };
});

