const admin = require("firebase-admin");
const OpenAI = require("openai");

admin.initializeApp();
const db = admin.firestore();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * 입력:
 * {
 *   "itemId": "marketItems docId",
 *   "buyerUid": "uid",
 *   "paymentAmount": 30000
 * }
 *
 * 동작:
 * 1) 상품, 판매자 프로필 불러오기
 * 2) AI로 리스크 스코어(0~100)와 사유 생성
 * 3) 리스크 등급에 따라 escrowRequired=true/false 제안
 * 4) Firestore에 precheck 결과 저장 (transactions/{txId})
 */
const precheckEscrowRisk = async (req, res) => {
  // CORS 설정
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { itemId, buyerUid, paymentAmount } = req.body || {};
    if (!itemId || !buyerUid || typeof paymentAmount !== "number") {
      return res.status(400).json({ ok: false, error: "Missing required fields: itemId, buyerUid, paymentAmount" });
    }

    console.log(`[AI Escrow Risk] Prechecking transaction for item: ${itemId}, buyer: ${buyerUid}, amount: ${paymentAmount}`);

    // 상품 정보 조회
    const itemSnap = await db.collection("marketItems").doc(itemId).get();
    if (!itemSnap.exists) {
      return res.status(404).json({ ok: false, error: "Item not found" });
    }

    const item = itemSnap.data();
    const sellerUid = item.sellerUid || "unknown";
    
    // 판매자 프로필 조회
    const sellerSnap = await db.collection("sellers").doc(sellerUid).get();
    const seller = sellerSnap.exists ? sellerSnap.data() : null;

    // 구매자 프로필 조회 (있다면)
    const buyerSnap = await db.collection("sellers").doc(buyerUid).get();
    const buyer = buyerSnap.exists ? buyerSnap.data() : null;

    const prompt = `
다음 중고거래의 결제 전 리스크를 0~100점(높을수록 위험)으로 산정하세요.

=== 거래 정보 ===
- 상품명: ${item.title || "정보 없음"}
- 카테고리: ${item.category || "기타"}
- 상품 가격: ${item.price ? item.price.toLocaleString() + '원' : '가격 정보 없음'}
- 결제 금액: ${paymentAmount.toLocaleString()}원
- 상품 설명: ${item.desc || "설명 없음"}

=== 상품 신뢰도 ===
- 상품 신뢰도: ${(item.trustScore && item.trustScore.total) || "N/A"}점
- 가격 적정성: ${item.trustScore?.priceScore || "N/A"}점
- 브랜드 신뢰도: ${item.trustScore?.brandScore || "N/A"}점
- 상태 신뢰도: ${item.trustScore?.conditionScore || "N/A"}점

=== 판매자 프로필 ===
${seller ? `
- 판매자 신뢰도: ${seller.sellerScore || "N/A"}점
- 평균 상품 신뢰도: ${seller.avgTrust || "N/A"}점
- 등록 상품 수: ${seller.itemCount || 0}개
- 판매자 요약: ${seller.summary || "정보 없음"}
- 판매자 강점: ${seller.strengths ? seller.strengths.join(", ") : "정보 없음"}
- 판매자 주의점: ${seller.risks ? seller.risks.join(", ") : "정보 없음"}
` : "판매자 프로필 정보 없음"}

=== 구매자 프로필 ===
${buyer ? `
- 구매자 신뢰도: ${buyer.sellerScore || "N/A"}점
- 평균 상품 신뢰도: ${buyer.avgTrust || "N/A"}점
- 등록 상품 수: ${buyer.itemCount || 0}개
` : "구매자 프로필 정보 없음"}

다음 JSON 형식으로 리스크 평가를 반환하세요:

{
  "risk": 0-100,
  "grade": "LOW"|"MEDIUM"|"HIGH",
  "reasons": ["위험 요소 1", "위험 요소 2", "위험 요소 3"],
  "escrowRecommended": true|false,
  "notes": "한줄 코멘트",
  "riskFactors": {
    "priceRisk": "가격 관련 위험도 설명",
    "sellerRisk": "판매자 관련 위험도 설명", 
    "itemRisk": "상품 관련 위험도 설명",
    "transactionRisk": "거래 규모 관련 위험도 설명"
  },
  "recommendations": ["권장사항 1", "권장사항 2"]
}

평가 기준:
- LOW (0-30): 낮은 위험, 일반 결제 가능
- MEDIUM (31-70): 중간 위험, 에스크로 권장
- HIGH (71-100): 높은 위험, 에스크로 필수

고려 요소:
1. 상품 신뢰도 (trustScore)
2. 판매자 신뢰 프로필 (sellerScore, 평판)
3. 결제 금액 대비 위험 (고액 거래)
4. 카테고리 특성 (전자제품, 명품 등 고위험)
5. 구매자/판매자 신뢰도 차이
6. 상품 설명의 구체성
`;

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an AI risk analyst for escrow decisions in Korean marketplace. Analyze transaction risks objectively and provide fair recommendations." },
        { role: "user", content: prompt },
      ],
      max_tokens: 1000,
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
        risk: 50,
        grade: "MEDIUM",
        reasons: ["AI 분석 중 오류 발생"],
        escrowRecommended: true,
        notes: "안전을 위해 에스크로를 권장합니다.",
        riskFactors: {
          priceRisk: "가격 분석 실패",
          sellerRisk: "판매자 분석 실패",
          itemRisk: "상품 분석 실패",
          transactionRisk: "거래 분석 실패"
        },
        recommendations: ["수동 검토 필요"]
      };
    }

    // 트랜잭션 ID 생성
    const now = admin.firestore.FieldValue.serverTimestamp();
    const txId = `pre_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // transactions 컬렉션에 사전 검증 결과 저장
    await db.collection("transactions").doc(txId).set({
      txId,
      itemId,
      buyerUid,
      sellerUid,
      amount: paymentAmount,
      precheck: parsed,
      escrowRequired: parsed.escrowRecommended || parsed.grade === "HIGH",
      createdAt: now,
      status: "PRECHECKED", // PRECHECKED → AUTHORIZED → PAID/ESCROW_HOLD → RELEASED/REFUNDED
      itemInfo: {
        title: item.title,
        category: item.category,
        price: item.price,
        trustScore: item.trustScore
      },
      sellerInfo: seller ? {
        sellerScore: seller.sellerScore,
        avgTrust: seller.avgTrust,
        itemCount: seller.itemCount
      } : null,
      buyerInfo: buyer ? {
        sellerScore: buyer.sellerScore,
        avgTrust: buyer.avgTrust,
        itemCount: buyer.itemCount
      } : null
    });

    console.log(`[AI Escrow Risk] Precheck completed: ${txId}`, parsed);

    res.json({ 
      ok: true, 
      txId, 
      precheck: parsed, 
      escrowRequired: parsed.escrowRecommended || parsed.grade === "HIGH",
      message: "AI 사전 위험 평가가 완료되었습니다."
    });
  } catch (err) {
    console.error("Escrow precheck error:", err);
    
    // 에러 발생 시에도 Firestore에 실패 상태 기록
    try {
      const { itemId, buyerUid, paymentAmount } = req.body || {};
      if (itemId && buyerUid && paymentAmount) {
        const txId = `pre_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        await db.collection("transactions").doc(txId).set({
          txId,
          itemId,
          buyerUid,
          amount: paymentAmount,
          status: "PRECHECK_FAILED",
          error: String(err),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (updateError) {
      console.error("Failed to update precheck error status:", updateError);
    }

    res.status(500).json({ 
      ok: false, 
      error: String(err),
      message: "AI 사전 위험 평가 중 오류가 발생했습니다."
    });
  }
};

module.exports = { precheckEscrowRisk };
