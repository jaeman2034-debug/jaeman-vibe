import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

// ?뱤 二쇨컙 AI 由ы룷???먮룞 ?앹꽦 (留ㅼ＜ ?붿슂???ㅼ쟾 9??
export const generateWeeklyAIReport = functions.pubsub
  .schedule("0 9 * * MON")
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("?뱤 二쇨컙 AI 由ы룷???먮룞 ?앹꽦 ?쒖옉");

    try {
      const sellersSnap = await db.collection("sellers").get();
      console.log(`?뵇 ?먮ℓ???? ${sellersSnap.docs.length}紐?);

      for (const sellerDoc of sellersSnap.docs) {
        const sellerId = sellerDoc.id;
        const sellerData = sellerDoc.data();

        console.log(`?뱢 ${sellerId} 二쇨컙 由ы룷???앹꽦 以?..`);

        // 理쒓렐 ?쇱＜???곗씠???섏쭛
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const chatsSnap = await db
          .collection("chats")
          .where("sellerId", "==", sellerId)
          .get();

        let totalMessages = 0;
        let aiMessages = 0;
        let aiShopBotMessages = 0;
        let aiAssistantMessages = 0;
        let buyerMessages = 0;
        let sellerMessages = 0;
        const keywordMap: { [key: string]: number } = {};
        const conversations: Array<{ senderId: string; text: string; timestamp: number }> = [];

        // 媛?梨꾪똿諛⑹쓽 硫붿떆吏 ?섏쭛
        for (const chatDoc of chatsSnap.docs) {
          const chatId = chatDoc.id;
          const messagesSnap = await db
            .collection("chats")
            .doc(chatId)
            .collection("messages")
            .get();

          for (const msgDoc of messagesSnap.docs) {
            const msg = msgDoc.data();
            const timestamp = msg.createdAt?.toMillis ? msg.createdAt.toMillis() : 0;

            // 理쒓렐 ?쇱＜??硫붿떆吏留?            if (timestamp < oneWeekAgo) continue;

            totalMessages++;

            // 諛쒖떊?먮퀎 遺꾨쪟
            if (msg.senderId === "AI_ShopBot") {
              aiMessages++;
              aiShopBotMessages++;
            } else if (msg.senderId === "AI_Assistant") {
              aiMessages++;
              aiAssistantMessages++;
            } else if (msg.senderId === sellerId) {
              sellerMessages++;
            } else {
              buyerMessages++;

              // ?ㅼ썙??異붿텧 (援щℓ??硫붿떆吏留?
              const keywords = ["諛곗넚", "?ъ씠利?, "媛寃?, "?좎씤", "援먰솚", "?섎텋", "吏곴굅??, "?뺥뭹"];
              keywords.forEach(keyword => {
                if (msg.text && msg.text.includes(keyword)) {
                  keywordMap[keyword] = (keywordMap[keyword] || 0) + 1;
                }
              });
            }

            // ????섑뵆 ???(理쒕? 20媛?
            if (conversations.length < 20) {
              conversations.push({
                senderId: msg.senderId || "unknown",
                text: msg.text || "",
                timestamp: timestamp
              });
            }
          }
        }

        // AI ?묐떟瑜?怨꾩궛
        const aiResponseRate = buyerMessages > 0 
          ? Math.round((aiMessages / buyerMessages) * 100) 
          : 0;

        // Top 5 ?ㅼ썙??        const topKeywords = Object.entries(keywordMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([keyword, count]) => ({ keyword, count }));

        console.log(`?뱤 ${sellerId} 二쇨컙 ?듦퀎:`, {
          totalMessages,
          aiMessages,
          aiResponseRate: `${aiResponseRate}%`,
          topKeywordsCount: topKeywords.length
        });

        // ?쨼 AI ?덉쭏 ?됯? (GPT-4o-mini)
        const apiKey = functions.config().openai?.api_key || process.env.OPENAI_API_KEY;
        let evaluation = "AI ?덉쭏 ?됯?瑜?嫄대꼫?곗뿀?듬땲??(API ???놁쓬).";
        let qualityScore = 0;

        if (apiKey && conversations.length > 0) {
          try {
            const conversationSample = conversations
              .slice(-10)
              .map(c => {
                const role = c.senderId === "AI_ShopBot" ? "AI" :
                            c.senderId === "AI_Assistant" ? "AI" :
                            c.senderId === sellerId ? "?먮ℓ?? : "援щℓ??;
                return `${role}: ${c.text}`;
              })
              .join("\n");

            const evalPrompt = `
?뱀떊? AI 怨좉컼 ?묐? ?덉쭏 ?됯? ?꾨Ц媛?낅땲??

吏???쇱＜?쇨컙??AI ?묐떟 ?곗씠?곕? 遺꾩꽍?섍퀬 ?됯???二쇱꽭??

?뱤 ?듦퀎:
- AI ?묐떟瑜? ${aiResponseRate}%
- 珥?硫붿떆吏: ${totalMessages}媛?- AI ?묐떟: ${aiMessages}媛?(吏?ν삎: ${aiShopBotMessages}, 湲곕낯: ${aiAssistantMessages})
- 援щℓ??臾몄쓽: ${buyerMessages}媛?- ?먮ℓ??吏곸젒 ?묐떟: ${sellerMessages}媛?
?뮠 理쒓렐 ????섑뵆:
${conversationSample}

?ㅼ쓬 ?뺤떇?쇰줈 ?됯???二쇱꽭??

1. **?덉쭏 ?먯닔 (0-100??**: [?먯닔]
2. **二쇱슂 媛뺤젏 (3媛吏)**:
   - [媛뺤젏 1]
   - [媛뺤젏 2]
   - [媛뺤젏 3]
3. **媛쒖꽑 ?ъ씤??(3媛吏)**:
   - [媛쒖꽑??1]
   - [媛쒖꽑??2]
   - [媛쒖꽑??3]
4. **醫낇빀 ?됯?**: [??以??붿빟]
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
                    content: "?뱀떊? AI 怨좉컼 ?묐? ?덉쭏???됯??섎뒗 ?꾨Ц媛?낅땲?? ?뺥솗?섍퀬 嫄댁꽕?곸씤 ?쇰뱶諛깆쓣 ?쒓났?섏꽭??" 
                  },
                  { role: "user", content: evalPrompt },
                ],
                max_tokens: 600,
                temperature: 0.5,
              }),
            });

            if (response.ok) {
              const evalData = await response.json();
              evaluation = evalData.choices?.[0]?.message?.content?.trim() || "?됯? ?ㅽ뙣";
              
              // ?덉쭏 ?먯닔 異붿텧 (?뺢퇋??
              const scoreMatch = evaluation.match(/?덉쭏\s*?먯닔[:\s]*(\d+)/);
              qualityScore = scoreMatch ? parseInt(scoreMatch[1]) : 75;

              console.log(`??AI ?덉쭏 ?됯? ?꾨즺 - ?먯닔: ${qualityScore}??);
            } else {
              console.error("??OpenAI API ?ㅻ쪟:", response.status);
            }

          } catch (evalError) {
            console.error("??AI ?덉쭏 ?됯? ?ㅻ쪟:", evalError);
            evaluation = "AI ?덉쭏 ?됯? 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.";
          }
        }

        // ?뱞 Firestore??由ы룷?????        const reportDoc = await db.collection("reports").add({
          sellerId,
          sellerName: sellerData.intro?.substring(0, 50) || "?먮ℓ??,
          reportType: "weekly-ai-quality",
          weekStartDate: new Date(oneWeekAgo).toISOString(),
          weekEndDate: new Date().toISOString(),
          stats: {
            totalMessages,
            aiMessages,
            aiShopBotMessages,
            aiAssistantMessages,
            buyerMessages,
            sellerMessages,
            aiResponseRate,
          },
          qualityScore,
          topKeywords,
          evaluation,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`??${sellerId} 二쇨컙 由ы룷??Firestore ????꾨즺:`, reportDoc.id);

        // ?뵒 n8n Webhook ?몄텧 (Slack ?뚮┝??
        const n8nWebhookUrl = functions.config().n8n?.report_webhook_url || 
                              process.env.N8N_REPORT_WEBHOOK_URL;

        if (n8nWebhookUrl) {
          try {
            await fetch(n8nWebhookUrl, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "X-Internal-Key": functions.config().n8n?.internal_key || ""
              },
              body: JSON.stringify({
                event: "WEEKLY_AI_REPORT",
                sellerId,
                reportId: reportDoc.id,
                aiResponseRate,
                qualityScore,
                topKeywords: topKeywords.map(k => k.keyword),
                evaluation: evaluation.substring(0, 200) + "...",
                reportUrl: `https://yagovibe.web.app/admin/reports/${reportDoc.id}`,
              }),
            });
            console.log("??n8n Webhook ?몄텧 ?꾨즺 (Slack ?뚮┝)");
          } catch (webhookError) {
            console.error("??n8n Webhook ?몄텧 ?ㅻ쪟:", webhookError);
          }
        }
      }

      console.log("?럦 紐⑤뱺 ?먮ℓ??二쇨컙 由ы룷???앹꽦 ?꾨즺!");
      return null;

    } catch (error) {
      console.error("??二쇨컙 由ы룷???앹꽦 ?ㅻ쪟:", error);
      return null;
    }
  });

// ?뱤 ?섎룞 由ы룷???앹꽦 (利됱떆 ?ㅽ뻾)
export const generateManualAIReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "濡쒓렇?몄씠 ?꾩슂?⑸땲??);
  }

  const sellerId = context.auth.uid;
  console.log("?봽 ?섎룞 由ы룷???앹꽦 ?붿껌:", sellerId);

  try {
    // ?꾩? ?숈씪??濡쒖쭅?쇰줈 利됱떆 由ы룷???앹꽦
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const chatsSnap = await db
      .collection("chats")
      .where("sellerId", "==", sellerId)
      .get();

    let totalMessages = 0;
    let aiMessages = 0;
    let buyerMessages = 0;

    for (const chatDoc of chatsSnap.docs) {
      const messagesSnap = await db
        .collection("chats")
        .doc(chatDoc.id)
        .collection("messages")
        .get();

      messagesSnap.forEach((m) => {
        const msg = m.data();
        const timestamp = msg.createdAt?.toMillis ? msg.createdAt.toMillis() : 0;
        if (timestamp < oneWeekAgo) return;

        totalMessages++;
        if (msg.senderId === "AI_ShopBot" || msg.senderId === "AI_Assistant") {
          aiMessages++;
        } else if (msg.senderId !== sellerId) {
          buyerMessages++;
        }
      });
    }

    const aiResponseRate = buyerMessages > 0 
      ? Math.round((aiMessages / buyerMessages) * 100) 
      : 0;

    await db.collection("reports").add({
      sellerId,
      reportType: "manual-ai-quality",
      stats: {
        totalMessages,
        aiMessages,
        buyerMessages,
        aiResponseRate,
      },
      evaluation: "?섎룞 ?앹꽦 由ы룷??,
      qualityScore: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("???섎룞 由ы룷???앹꽦 ?꾨즺:", { sellerId, aiResponseRate: `${aiResponseRate}%` });

    return {
      success: true,
      sellerId,
      aiResponseRate,
      totalMessages
    };

  } catch (error: any) {
    console.error("???섎룞 由ы룷???앹꽦 ?ㅻ쪟:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

