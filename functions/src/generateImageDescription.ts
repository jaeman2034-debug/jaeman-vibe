import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";

// Firebase Admin 珥덇린??admin.initializeApp();

// OpenAI ?대씪?댁뼵??珥덇린??(?곗꽑?쒖쐞: functions config > ?섍꼍蹂??
const openai = new OpenAI({
  apiKey: (functions.config().openai && functions.config().openai.key) || process.env.OPENAI_API_KEY,
});

// AI ?대?吏 ?ㅻ챸 ?앹꽦 ?⑥닔 (Callable)
export const generateImageDescription = functions
  .region("asia-northeast3") // ?쒖슱 由ъ쟾 異붿쿇
  .https.onCall(async (data, context) => {
  try {
    const { imageUrl } = data;

    if (!imageUrl) {
      throw new functions.https.HttpsError("invalid-argument", "imageUrl???꾩슂?⑸땲??");
    }

    console.log("?쭬 AI ?대?吏 ?ㅻ챸 ?앹꽦 ?쒖옉:", imageUrl);

    // OpenAI Vision API ?몄텧
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 鍮좊Ⅴ怨?寃쎌젣?곸씤 紐⑤뜽
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "???대?吏瑜???臾몃떒?쇰줈 臾섏궗?댁쨾. ?먯뿰?ㅻ읇怨??곹뭹 ?ㅻ챸?⑹쑝濡?" 
            },
            { 
              type: "image_url", 
              image_url: { url: imageUrl } 
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const description = response.choices[0]?.message?.content?.trim() ?? "?대?吏 ?ㅻ챸???앹꽦?섏? 紐삵뻽?듬땲??";
    
    console.log("??AI ?대?吏 ?ㅻ챸 ?앹꽦 ?꾨즺:", description);

    return { description };

  } catch (err: any) {
    console.error("OpenAI Vision Error:", err);
    throw new functions.https.HttpsError("internal", "AI 泥섎━ ?ㅻ쪟");
  }
});

// HTTP 踰꾩쟾 (?몃? ?몄텧??
export const generateImageDescriptionHttp = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    // CORS ?ㅼ젙
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { imageUrl } = req.body;
    if (!imageUrl) {
      res.status(400).json({ error: "imageUrl required" });
      return;
    }

    try {
      const result = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "???대?吏瑜??곹뭹 ?ㅻ챸泥섎읆 ?먯뿰?ㅻ읇寃??붿빟?댁쨾." },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 300,
      });

      const description = result.choices[0]?.message?.content?.trim() ?? "";
      res.json({ description });
    } catch (err) {
      console.error("OpenAI Vision HTTP Error:", err);
      res.status(500).json({ error: "Internal Error" });
    }
  });
