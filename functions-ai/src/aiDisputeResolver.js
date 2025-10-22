const admin = require("firebase-admin");
const OpenAI = require("openai");

admin.initializeApp();
const db = admin.firestore();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const resolveDispute = async (req, res) => {
  // CORS 설정
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { disputeId, buyer, seller, transaction, disputeType } = req.body;
    if (!buyer || !seller || !transaction) {
      return res.status(400).send("Missing required fields: buyer, seller, transaction");
    }

    console.log(`[AI Dispute Resolver] Resolving dispute: ${disputeId}`);

    const prompt = `
다음은 YAGO VIBE 마켓플레이스의 거래 분쟁 사건입니다. 객관적이고 공정하게 분석하여 조정 의견을 제시하세요.

=== 거래 정보 ===
- 상품명: ${transaction.title || "정보 없음"}
- 가격: ${transaction.price ? transaction.price.toLocaleString() + '원' : '가격 정보 없음'}
- 상품 신뢰도: ${transaction.trustScore?.total || 50}점
- 분쟁 유형: ${disputeType || "일반 분쟁"}

=== 구매자 주장 ===
${buyer.statement || "구매자 주장 없음"}

=== 판매자 주장 ===
${seller.statement || "판매자 주장 없음"}

=== 추가 정보 ===
- 구매자 신뢰도: ${buyer.trustScore || "정보 없음"}
- 판매자 신뢰도: ${seller.trustScore || "정보 없음"}
- 거래 일자: ${transaction.date || "정보 없음"}
- 상품 상태: ${transaction.condition || "정보 없음"}

다음 JSON 형식으로 객관적인 조정 의견을 제시하세요:

{
  "summary": "분쟁 사건의 핵심 요약 (2-3문장)",
  "buyerView": "구매자 입장 요약",
  "sellerView": "판매자 입장 요약",
  "aiDecision": "AI의 중립적 판단 및 분석",
  "responsibility": {
    "buyer": 0-100,
    "seller": 0-100
  },
  "recommendation": [
    "구체적 조정 제안 1",
    "구체적 조정 제안 2",
    "구체적 조정 제안 3"
  ],
  "evidence": {
    "buyerEvidence": ["구매자 증거 1", "구매자 증거 2"],
    "sellerEvidence": ["판매자 증거 1", "판매자 증거 2"]
  },
  "confidence": 0-100,
  "nextSteps": [
    "다음 단계 1",
    "다음 단계 2"
  ]
}

분석 기준:
- responsibility: 구매자와 판매자의 책임 비율 (합계 100%)
- confidence: AI 판단의 신뢰도 (0-100점)
- recommendation: 구체적이고 실행 가능한 조정 제안
- evidence: 양측의 주장을 뒷받침하는 증거 요소
- nextSteps: 분쟁 해결을 위한 구체적 다음 단계
`;

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a neutral dispute-resolution expert for YAGO VIBE marketplace. Analyze disputes objectively and provide fair, balanced recommendations based on evidence and marketplace policies." 
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.2
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
        summary: "분쟁 사건 분석 중 오류가 발생했습니다.",
        buyerView: "구매자 주장을 분석할 수 없습니다.",
        sellerView: "판매자 주장을 분석할 수 없습니다.",
        aiDecision: "AI 분석 결과를 생성할 수 없습니다.",
        responsibility: { buyer: 50, seller: 50 },
        recommendation: ["수동 조정이 필요합니다."],
        evidence: { buyerEvidence: [], sellerEvidence: [] },
        confidence: 30,
        nextSteps: ["운영자 개입 필요"]
      };
    }

    // disputes 컬렉션에 조정 결과 저장
    await db.collection("disputes").doc(disputeId).set({
      ...parsed,
      disputeId: disputeId,
      buyer: buyer,
      seller: seller,
      transaction: transaction,
      disputeType: disputeType || "일반 분쟁",
      status: "resolved",
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      aiResolverVersion: "1.0"
    }, { merge: true });

    console.log(`[AI Dispute Resolver] Dispute resolved: ${disputeId}`, parsed);

    res.json({ 
      ok: true, 
      result: parsed,
      disputeId: disputeId,
      message: "AI 분쟁 조정이 완료되었습니다."
    });
  } catch (err) {
    console.error("Dispute AI Error:", err);
    
    // 에러 발생 시에도 Firestore에 실패 상태 기록
    try {
      const { disputeId } = req.body;
      if (disputeId) {
        await db.collection("disputes").doc(disputeId).set({
          status: "failed",
          error: String(err),
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    } catch (updateError) {
      console.error("Failed to update dispute error status:", updateError);
    }

    res.status(500).json({ 
      ok: false, 
      error: String(err),
      message: "AI 분쟁 조정 중 오류가 발생했습니다."
    });
  }
};

module.exports = { resolveDispute };
