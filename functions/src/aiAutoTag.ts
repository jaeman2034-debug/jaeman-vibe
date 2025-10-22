import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";

// OpenAI ?대씪?댁뼵??珥덇린??const openai = new OpenAI({
  apiKey: functions.config().openai?.api_key || process.env.OPENAI_API_KEY,
});

/**
 * AI ?대?吏 ?먮룞 遺꾩꽍 諛??쒓렇 ?앹꽦 Cloud Function
 * 
 * ?ъ슜踰?
 * POST https://asia-northeast3-YOUR_PROJECT.cloudfunctions.net/aiAutoTag
 * Body: { "imageUrl": "https://...", "docId": "marketItems/abc123" }
 */
export const aiAutoTag = functions
  .https.onRequest(async (req, res) => {
    // CORS ?ㅼ젙
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { imageUrl, docId } = req.body;

      if (!imageUrl || !docId) {
        res.status(400).json({ 
          error: "Missing required fields: imageUrl and docId" 
        });
        return;
      }

      console.log(`[AI Auto Tag] Starting analysis for docId: ${docId}`);

      // AI 遺꾩꽍 ?꾨＼?꾪듃
      const prompt = `
???곹뭹 ?대?吏瑜?遺꾩꽍?댁꽌 ?쒓뎅 以묎퀬嫄곕옒 留덉폆???뺣낫瑜?異붿텧?댁＜?몄슂.

?ㅼ쓬 ?뺤떇??JSON?쇰줈 ?묐떟?댁＜?몄슂:
{
  "category": "移댄뀒怨좊━紐?(?? 異뺢뎄?? ?섎쪟, ?꾩옄?쒗뭹, 媛援? ?꾩꽌, ?ㅽ룷痢좎슜?? 湲고?)",
  "color": "二쇱슂 ?됱긽 (?? 寃?? 鍮④컯, ?뚮옉)",
  "brand": "釉뚮옖?쒕챸 (?몄떇 媛?ν븳 寃쎌슦, ?놁쑝硫?鍮?臾몄옄??",
  "condition": "?곹뭹 ?곹깭 (?덇쾬, 醫뗭쓬, 蹂댄넻, ?섏겏)",
  "priceHint": "?쒓뎅 以묎퀬嫄곕옒 ?쒖옣 湲곗? 異붿쿇 媛寃?踰붿쐞 (?? 5留뚯썝~8留뚯썝)",
  "tags": ["?쒓렇1", "?쒓렇2", "?쒓렇3", "?쒓렇4", "?쒓렇5"]
}

?쒓렇???곹뭹???뱀쭠, ?⑸룄, ?ъ쭏, ?ㅽ????깆쓣 ?ы븿?댁＜?몄슂.
媛寃⑹? ?ㅼ젣 ?쒓뎅 以묎퀬嫄곕옒 ?쒖옣 湲곗??쇰줈 ?꾩떎?곸쑝濡?異붿젙?댁＜?몄슂.
`;

      // OpenAI Vision API ?몄텧
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "?뱀떊? 以묎퀬嫄곕옒 留덉폆???꾪븳 ?곹뭹 ?대?吏 遺꾩꽍 ?꾨Ц媛?낅땲?? ?뺥솗?섍퀬 ?ㅼ슜?곸씤 ?뺣낫瑜??쒓났?댁＜?몄슂."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      const rawResponse = completion.choices[0]?.message?.content;
      
      if (!rawResponse) {
        throw new Error("OpenAI API returned empty response");
      }

      // JSON ?뚯떛 ?쒕룄
      let aiResult;
      try {
        // JSON 遺遺꾨쭔 異붿텧
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError);
        console.error("Raw response:", rawResponse);
        
        // ?뚯떛 ?ㅽ뙣 ??湲곕낯媛?諛섑솚
        aiResult = {
          category: "湲고?",
          color: "誘명솗??,
          brand: "",
          condition: "蹂댄넻",
          priceHint: "媛寃⑸Ц??,
          tags: ["AI 遺꾩꽍 ?ㅽ뙣"]
        };
      }

      // Firestore ?낅뜲?댄듃
      const db = admin.firestore();
      await db.collection("marketItems").doc(docId).update({
        aiTags: aiResult.tags || [],
        aiCategory: aiResult.category || "湲고?",
        aiBrand: aiResult.brand || "",
        aiColor: aiResult.color || "誘명솗??,
        aiCondition: aiResult.condition || "蹂댄넻",
        aiSuggestedPrice: {
          hint: aiResult.priceHint || "媛寃⑸Ц??,
          analyzedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        aiAnalysisCompleted: true,
        aiAnalyzedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`[AI Auto Tag] Analysis completed for docId: ${docId}`, aiResult);

      res.json({ 
        success: true, 
        aiResult,
        docId,
        message: "AI 遺꾩꽍???꾨즺?섏뿀?듬땲??"
      });

    } catch (error) {
      console.error("[AI Auto Tag] Error:", error);
      
      // ?먮윭 諛쒖깮 ?쒖뿉??Firestore???ㅽ뙣 ?곹깭 湲곕줉
      try {
        const { docId } = req.body;
        if (docId) {
          const db = admin.firestore();
          await db.collection("marketItems").doc(docId).update({
            aiAnalysisCompleted: false,
            aiError: String(error),
            aiAnalyzedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      } catch (updateError) {
        console.error("[AI Auto Tag] Failed to update error status:", updateError);
      }

      res.status(500).json({ 
        success: false,
        error: String(error),
        message: "AI 遺꾩꽍 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎."
      });
    }
  });

/**
 * AI 遺꾩꽍 ?곹깭 ?뺤씤 ?⑥닔
 */
export const checkAiAnalysisStatus = functions
  .https.onRequest(async (req, res) => {
    // CORS ?ㅼ젙
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { docId } = req.query;

      if (!docId) {
        res.status(400).json({ error: "Missing docId parameter" });
        return;
      }

      const db = admin.firestore();
      const doc = await db.collection("marketItems").doc(docId as string).get();

      if (!doc.exists) {
        res.status(404).json({ error: "Document not found" });
        return;
      }

      const data = doc.data();
      res.json({
        success: true,
        docId,
        aiAnalysisCompleted: data?.aiAnalysisCompleted || false,
        aiAnalyzedAt: data?.aiAnalyzedAt || null,
        aiError: data?.aiError || null
      });

    } catch (error) {
      console.error("[Check AI Status] Error:", error);
      res.status(500).json({ 
        success: false,
        error: String(error)
      });
    }
  });
