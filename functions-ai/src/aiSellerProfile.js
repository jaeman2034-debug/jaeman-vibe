const admin = require("firebase-admin");
const OpenAI = require("openai");

admin.initializeApp();
const db = admin.firestore();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const generateSellerProfile = async (req, res) => {
  // CORS 설정
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { sellerUid } = req.body;
    if (!sellerUid) return res.status(400).send("Missing sellerUid");

    console.log(`[AI Seller Profile] Generating profile for seller: ${sellerUid}`);

    // 판매자의 모든 상품 수집
    const snap = await db.collection("marketItems").where("sellerUid", "==", sellerUid).get();
    if (snap.empty) {
      return res.status(404).json({ 
        ok: false, 
        msg: "판매자가 등록한 상품이 없습니다.",
        sellerUid 
      });
    }

    const items = [];
    let totalTrust = 0;
    let totalPrice = 0;
    let priceCount = 0;
    const categories = new Set();
    const brands = new Set();

    snap.forEach((d) => {
      const data = d.data();
      items.push({
        id: d.id,
        title: data.title || "",
        category: data.category || "기타",
        brand: data.aiTags?.brand || "",
        price: data.price || 0,
        trustScore: data.trustScore?.total || 50,
        createdAt: data.createdAt
      });
      
      totalTrust += data.trustScore?.total || 50;
      if (data.price && data.price > 0) {
        totalPrice += data.price;
        priceCount++;
      }
      
      if (data.category) categories.add(data.category);
      if (data.aiTags?.brand) brands.add(data.aiTags.brand);
    });

    const avgTrust = Math.round(totalTrust / items.length);
    const avgPrice = priceCount > 0 ? Math.round(totalPrice / priceCount) : 0;
    const itemCount = items.length;
    const categoryCount = categories.size;
    const brandCount = brands.size;

    // 상품 데이터 요약
    const summary = items.map((i) => 
      `${i.title} / ${i.category} / ${i.brand ? i.brand + ' 브랜드' : '브랜드 미상'} / 신뢰도 ${i.trustScore}점${i.price > 0 ? ` / ${i.price.toLocaleString()}원` : ''}`
    ).join("\n");

    const prompt = `
다음은 한 판매자의 거래 내역입니다. 각 항목은 상품명, 카테고리, 브랜드, 신뢰도, 가격 정보입니다.

판매자 통계:
- 총 상품 수: ${itemCount}개
- 평균 신뢰도: ${avgTrust}점
- 평균 가격: ${avgPrice > 0 ? avgPrice.toLocaleString() + '원' : '가격 정보 없음'}
- 카테고리 다양성: ${categoryCount}개 카테고리
- 브랜드 다양성: ${brandCount}개 브랜드

상품 내역:
${summary}

이 정보를 바탕으로 판매자의 성향, 강점, 신뢰 수준을 분석하고 아래 JSON 형태로 요약하세요:

{
  "sellerScore": 0-100,
  "summary": "판매자 평판 설명 (2-3문장)",
  "strengths": ["강점1", "강점2", "강점3"],
  "risks": ["주의점1", "주의점2"],
  "specialties": ["전문분야1", "전문분야2"],
  "recommendations": ["거래시 주의사항1", "거래시 주의사항2"]
}

평가 기준:
- sellerScore: 상품 신뢰도, 가격 적정성, 카테고리 다양성, 브랜드 신뢰도 종합
- strengths: 판매자의 강점 (예: 고가 브랜드 전문, 신뢰도 높음, 다양한 카테고리)
- risks: 주의해야 할 점 (예: 가격 변동 큼, 신뢰도 낮음)
- specialties: 전문 분야 (예: 스포츠용품, 브랜드 제품)
- recommendations: 거래 시 주의사항
`;

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an assistant that evaluates seller trust profiles for Korean marketplace. Analyze seller patterns and provide trust insights." },
        { role: "user", content: prompt },
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
        sellerScore: avgTrust,
        summary: `${itemCount}개 상품을 등록한 판매자입니다. 평균 신뢰도는 ${avgTrust}점입니다.`,
        strengths: ["다양한 상품 등록"],
        risks: ["평가 데이터 부족"],
        specialties: ["일반 상품"],
        recommendations: ["거래 시 주의하세요"]
      };
    }

    // sellers 컬렉션에 프로필 저장
    await db.collection("sellers").doc(sellerUid).set({
      ...parsed,
      avgTrust,
      avgPrice,
      itemCount,
      categoryCount,
      brandCount,
      categories: Array.from(categories),
      brands: Array.from(brands),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastEvaluatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`[AI Seller Profile] Profile generated for seller: ${sellerUid}`, parsed);

    res.json({ 
      ok: true, 
      seller: parsed,
      stats: {
        avgTrust,
        avgPrice,
        itemCount,
        categoryCount,
        brandCount
      },
      sellerUid,
      message: "판매자 신뢰 프로필이 생성되었습니다."
    });
  } catch (err) {
    console.error("Seller Profile Error:", err);
    res.status(500).json({ 
      ok: false, 
      error: String(err),
      message: "판매자 프로필 생성 중 오류가 발생했습니다."
    });
  }
};

module.exports = { generateSellerProfile };
