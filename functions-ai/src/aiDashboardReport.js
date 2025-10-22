const admin = require("firebase-admin");
const OpenAI = require("openai");

admin.initializeApp();
const db = admin.firestore();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const generateDashboardReport = async (req, res) => {
  // CORS 설정
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    console.log("[AI Dashboard Report] Generating comprehensive dashboard report...");

    // 모든 상품 데이터 수집
    const productsSnap = await db.collection("marketItems").get();
    const sellersSnap = await db.collection("sellers").get();

    let totalTrust = 0;
    let highTrustCount = 0;
    let lowTrustCount = 0;
    let totalPrice = 0;
    let priceCount = 0;
    const categories = new Map();
    const brands = new Map();
    const sellers = new Map();

    const products = [];
    productsSnap.forEach((d) => {
      const data = d.data();
      products.push({
        id: d.id,
        ...data
      });
      
      const trustScore = data.trustScore?.total || 50;
      totalTrust += trustScore;
      
      if (trustScore >= 80) highTrustCount++;
      if (trustScore < 50) lowTrustCount++;
      
      if (data.price && data.price > 0) {
        totalPrice += data.price;
        priceCount++;
      }
      
      // 카테고리 통계
      const category = data.category || "기타";
      categories.set(category, (categories.get(category) || 0) + 1);
      
      // 브랜드 통계
      const brand = data.aiTags?.brand || "미상";
      brands.set(brand, (brands.get(brand) || 0) + 1);
      
      // 판매자 통계
      const sellerUid = data.sellerUid || "anonymous";
      sellers.set(sellerUid, (sellers.get(sellerUid) || 0) + 1);
    });

    const avgTrust = Math.round(totalTrust / Math.max(products.length, 1));
    const avgPrice = priceCount > 0 ? Math.round(totalPrice / priceCount) : 0;
    const highTrustRatio = products.length > 0 ? Math.round((highTrustCount / products.length) * 100) : 0;
    const lowTrustRatio = products.length > 0 ? Math.round((lowTrustCount / products.length) * 100) : 0;

    // 판매자 데이터 수집
    const sellerProfiles = [];
    sellersSnap.forEach((d) => {
      sellerProfiles.push({
        id: d.id,
        ...d.data()
      });
    });

    // 상위 카테고리, 브랜드, 판매자
    const topCategories = Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topBrands = Array.from(brands.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topSellers = Array.from(sellers.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // 위험 판매자 및 우수 판매자 식별
    const riskSellers = sellerProfiles
      .filter(s => s.sellerScore < 50)
      .map(s => s.id);
    const highTrustSellers = sellerProfiles
      .filter(s => s.sellerScore >= 80)
      .map(s => s.id);

    // 최근 상품들 (신뢰도 분석용)
    const recentProducts = products
      .filter(p => p.createdAt)
      .sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate())
      .slice(0, 20);

    const prompt = `
다음은 YAGO VIBE 마켓의 전체 거래 데이터 분석 결과입니다.

=== 전체 통계 ===
- 총 상품 수: ${products.length}개
- 총 판매자 수: ${sellerProfiles.length}명
- 평균 신뢰도: ${avgTrust}점
- 평균 가격: ${avgPrice > 0 ? avgPrice.toLocaleString() + '원' : '가격 정보 없음'}
- 높은 신뢰 상품 비율: ${highTrustRatio}%
- 낮은 신뢰 상품 비율: ${lowTrustRatio}%

=== 인기 카테고리 ===
${topCategories.map(([cat, count]) => `${cat}: ${count}개`).join('\n')}

=== 인기 브랜드 ===
${topBrands.map(([brand, count]) => `${brand}: ${count}개`).join('\n')}

=== 활발한 판매자 ===
${topSellers.map(([seller, count]) => `${seller}: ${count}개 상품`).join('\n')}

=== 최근 상품 샘플 ===
${recentProducts.slice(0, 10).map(p => 
  `${p.title || '제목없음'} / 신뢰도 ${p.trustScore?.total || 50}점 / ${p.category || '기타'} / ${p.price ? p.price.toLocaleString() + '원' : '가격미정'}`
).join('\n')}

=== 판매자 신뢰도 분석 ===
- 위험 판매자 (50점 미만): ${riskSellers.length}명
- 우수 판매자 (80점 이상): ${highTrustSellers.length}명

이 데이터를 종합 분석하여 다음 JSON 형태로 요약하세요:

{
  "summary": "전체 마켓 상태에 대한 AI 분석 요약 (3-4문장)",
  "riskSellers": ["위험 판매자 ID 목록"],
  "highTrust": ["우수 판매자 ID 목록"],
  "avgTrust": ${avgTrust},
  "trend": "최근 신뢰도 트렌드 분석 (상승/하락/안정)",
  "recommendations": ["관리자 권장사항 1", "관리자 권장사항 2", "관리자 권장사항 3"],
  "alerts": ["주의사항 1", "주의사항 2"],
  "insights": {
    "topCategory": "${topCategories[0]?.[0] || '기타'}",
    "topBrand": "${topBrands[0]?.[0] || '미상'}",
    "mostActiveSeller": "${topSellers[0]?.[0] || '없음'}"
  }
}

분석 기준:
- summary: 전체적인 마켓 건강도와 주요 특징
- trend: 최근 상품들의 신뢰도 변화 패턴
- recommendations: 마켓 운영 개선을 위한 구체적 제안
- alerts: 즉시 주의해야 할 문제점들
`;

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an AI marketplace risk analyst and administrator assistant for YAGO VIBE. Provide comprehensive insights and actionable recommendations." },
        { role: "user", content: prompt },
      ],
      max_tokens: 1500,
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
        summary: `YAGO VIBE 마켓에 총 ${products.length}개의 상품과 ${sellerProfiles.length}명의 판매자가 등록되어 있습니다. 평균 신뢰도는 ${avgTrust}점입니다.`,
        riskSellers: riskSellers,
        highTrust: highTrustSellers,
        avgTrust: avgTrust,
        trend: "데이터 분석 중",
        recommendations: ["정기적인 신뢰도 모니터링 필요"],
        alerts: ["AI 분석 결과 확인 필요"],
        insights: {
          topCategory: topCategories[0]?.[0] || "기타",
          topBrand: topBrands[0]?.[0] || "미상",
          mostActiveSeller: topSellers[0]?.[0] || "없음"
        }
      };
    }

    // dashboard 컬렉션에 리포트 저장
    await db.collection("dashboard").doc("summary").set({
      ...parsed,
      productCount: products.length,
      sellerCount: sellerProfiles.length,
      avgPrice: avgPrice,
      highTrustRatio: highTrustRatio,
      lowTrustRatio: lowTrustRatio,
      topCategories: topCategories,
      topBrands: topBrands,
      topSellers: topSellers,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastAnalyzedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log("[AI Dashboard Report] Report generated successfully", parsed);

    res.json({ 
      ok: true, 
      report: parsed,
      stats: {
        productCount: products.length,
        sellerCount: sellerProfiles.length,
        avgTrust: avgTrust,
        avgPrice: avgPrice,
        highTrustRatio: highTrustRatio,
        lowTrustRatio: lowTrustRatio
      },
      message: "AI 대시보드 리포트가 생성되었습니다."
    });
  } catch (err) {
    console.error("Dashboard AI Error:", err);
    res.status(500).json({ 
      ok: false, 
      error: String(err),
      message: "대시보드 리포트 생성 중 오류가 발생했습니다."
    });
  }
};

module.exports = { generateDashboardReport };
