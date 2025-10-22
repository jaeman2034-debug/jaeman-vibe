const fetch = require("node-fetch");
const admin = require("firebase-admin");
const OpenAI = require("openai");

admin.initializeApp();
const db = admin.firestore();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const analyzeProductImage = async (req, res) => {
  // CORS 설정
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { imageUrl, docId } = req.body;
    if (!imageUrl || !docId) return res.status(400).send("Missing imageUrl or docId");

    console.log(`[AI Auto Category] Starting analysis for docId: ${docId}`);

    const prompt = `
      Analyze this product photo and describe:
      - Main product category (축구화, 유니폼, 공, 용품, 기타)
      - Color
      - Brand (if visible)
      - Condition (new, used, worn)
      - Estimated price range (KRW)
      - 3 descriptive tags in Korean
      Return as JSON:
      { "category": "", "color": "", "brand": "", "condition": "", "priceHint": "", "tags": [] }
    `;

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an assistant that analyzes product photos for a sports marketplace." },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const raw = result.choices[0].message.content;
    
    if (!raw) {
      throw new Error("OpenAI API returned empty response");
    }

    // JSON 파싱 시도
    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      console.error("Raw response:", raw);
      
      // 파싱 실패 시 기본값 반환
      parsed = {
        category: "기타",
        color: "미확인",
        brand: "",
        condition: "보통",
        priceHint: "가격문의",
        tags: ["AI 분석 실패"]
      };
    }

    // Firestore 업데이트
    await db.collection("marketItems").doc(docId).update({
      aiTags: parsed,
      category: parsed.category || "기타",
      tags: parsed.tags || [],
      aiAnalyzedAt: admin.firestore.FieldValue.serverTimestamp(),
      aiAnalysisCompleted: true
    });

    console.log(`[AI Auto Category] Analysis completed for docId: ${docId}`, parsed);

    res.json({ ok: true, aiTags: parsed });
  } catch (err) {
    console.error("AI analyze error:", err);
    
    // 에러 발생 시에도 Firestore에 실패 상태 기록
    try {
      const { docId } = req.body;
      if (docId) {
        await db.collection("marketItems").doc(docId).update({
          aiAnalysisCompleted: false,
          aiError: String(err),
          aiAnalyzedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (updateError) {
      console.error("Failed to update error status:", updateError);
    }

    res.status(500).json({ ok: false, error: String(err) });
  }
};

module.exports = { analyzeProductImage };
