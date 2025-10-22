const admin = require("firebase-admin");
const OpenAI = require("openai");

admin.initializeApp();
const db = admin.firestore();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const evaluateTrustScore = async (req, res) => {
  // CORS 설정
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { docId, data } = req.body;
    if (!data?.imageUrl && !data?.title) return res.status(400).send("Missing fields");

    console.log(`[AI Trust Score] Evaluating trust for docId: ${docId}`);

    const prompt = `
상품의 신뢰도를 0~100점으로 평가하세요. 한국 중고거래 마켓플레이스 기준으로 분석해주세요.

고려항목:
1. 가격 적정성 (market 평균 대비 과대/과소 여부)
2. 브랜드 진위 (사진과 제목 일치도, 브랜드 로고 인식)
3. 상태 신뢰도 (이미지의 사용감/손상/오염 정도)
4. 설명 구체성 (상품 상세 기술의 충실도)

평가 기준:
- 가격 적정성: 시장 평균 대비 ±20% 이내면 높은 점수
- 브랜드 진위: 브랜드 로고/명칭이 명확하면 높은 점수
- 상태 신뢰도: 사용감이 적절하고 손상이 적으면 높은 점수
- 설명 구체성: 상세하고 구체적인 설명이면 높은 점수

결과는 JSON 형태로만 반환:
{ 
  "priceScore": 0-100, 
  "brandScore": 0-100, 
  "conditionScore": 0-100, 
  "descScore": 0-100, 
  "total": 0-100, 
  "review": "한줄평 (예: 가격이 적정하고 상태가 양호함)",
  "riskFactors": ["위험요소1", "위험요소2"],
  "recommendations": ["개선제안1", "개선제안2"]
}
`;

    const messages = [
      { role: "system", content: "You are a product trust evaluation AI for YAGO VIBE marketplace. Analyze products with Korean market standards." },
      {
        role: "user",
        content: [
          { type: "text", text: `${prompt}\n\n상품명: ${data.title}\n가격: ${data.price ? data.price.toLocaleString() + '원' : '가격 미정'}\n설명: ${data.desc || '설명 없음'}` },
          ...(data.imageUrl ? [{ type: "image_url", image_url: { url: data.imageUrl } }] : []),
        ],
      },
    ];

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
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
        priceScore: 50,
        brandScore: 50,
        conditionScore: 50,
        descScore: 50,
        total: 50,
        review: "AI 분석 중 오류가 발생했습니다.",
        riskFactors: ["분석 오류"],
        recommendations: ["다시 분석해주세요"]
      };
    }

    // Firestore 업데이트
    await db.collection("marketItems").doc(docId).update({
      trustScore: parsed,
      trustEvaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
      trustEvaluated: true
    });

    console.log(`[AI Trust Score] Evaluation completed for docId: ${docId}`, parsed);

    res.json({ 
      ok: true, 
      trust: parsed,
      docId,
      message: "신뢰도 평가가 완료되었습니다."
    });
  } catch (err) {
    console.error("TrustScore AI Error:", err);
    
    // 에러 발생 시에도 Firestore에 실패 상태 기록
    try {
      const { docId } = req.body;
      if (docId) {
        await db.collection("marketItems").doc(docId).update({
          trustEvaluated: false,
          trustError: String(err),
          trustEvaluatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (updateError) {
      console.error("Failed to update trust error status:", updateError);
    }

    res.status(500).json({ 
      ok: false, 
      error: String(err),
      message: "신뢰도 평가 중 오류가 발생했습니다."
    });
  }
};

module.exports = { evaluateTrustScore };
