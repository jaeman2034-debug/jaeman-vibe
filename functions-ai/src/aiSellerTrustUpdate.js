// functions-ai/src/aiSellerTrustUpdate.js
// AI 판매자 신뢰도 갱신 Cloud Function

import * as admin from "firebase-admin";
import OpenAI from "openai";

admin.initializeApp();
const db = admin.firestore();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const updateSellerTrust = async (req, res) => {
  try {
    const { sellerUid } = req.body;
    if (!sellerUid) return res.status(400).send("Missing sellerUid");

    // 판매자의 모든 리뷰 수집
    const reviewsSnap = await db.collection("reviews")
      .where("sellerUid", "==", sellerUid)
      .get();
    
    if (reviewsSnap.empty) {
      return res.json({ ok: true, message: "No reviews found" });
    }

    const reviews = [];
    let totalScore = 0;
    
    reviewsSnap.forEach((doc) => {
      const data = doc.data();
      reviews.push(data);
      totalScore += data.score || 0;
    });

    const avgScore = totalScore / reviews.length;
    
    // 판매자의 모든 상품 수집
    const itemsSnap = await db.collection("marketItems")
      .where("sellerUid", "==", sellerUid)
      .get();
    
    const items = [];
    let totalTrustScore = 0;
    
    itemsSnap.forEach((doc) => {
      const data = doc.data();
      items.push(data);
      totalTrustScore += data.trustScore?.total || 50;
    });

    const avgTrustScore = items.length > 0 ? totalTrustScore / items.length : 50;

    // AI가 판매자 신뢰도 종합 분석
    const reviewSummary = reviews.map(r => 
      `점수: ${r.score}/5, 리뷰: ${r.comment || '리뷰 없음'}`
    ).join('\n');

    const prompt = `다음은 한 판매자의 거래 리뷰와 상품 신뢰도 데이터입니다.

리뷰 데이터:
${reviewSummary}

상품 신뢰도 평균: ${avgTrustScore}/100
총 리뷰 수: ${reviews.length}
총 상품 수: ${items.length}

이 데이터를 바탕으로 판매자의 종합 신뢰도를 분석하고 JSON 형태로 요약하세요:

{
  "sellerScore": 0-100,
  "summary": "판매자 신뢰도 요약",
  "strengths": ["강점1", "강점2"],
  "risks": ["주의점1", "주의점2"],
  "recommendation": "구매자에게 주는 조언"
}`;

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an assistant that evaluates seller trust based on reviews and transaction data." },
        { role: "user", content: prompt },
      ],
    });

    const aiAnalysis = JSON.parse(result.choices[0].message.content);

    // 판매자 문서 업데이트
    await db.collection("sellers").doc(sellerUid).set({
      ...aiAnalysis,
      avgReviewScore: avgScore,
      totalReviews: reviews.length,
      avgTrustScore: avgTrustScore,
      totalItems: items.length,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    res.json({ 
      ok: true, 
      sellerScore: aiAnalysis.sellerScore,
      avgReviewScore: avgScore,
      totalReviews: reviews.length,
      summary: aiAnalysis.summary
    });

  } catch (err) {
    console.error("Seller Trust Update Error:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
};

// CORS 헤더 추가
export const aiSellerTrustUpdate = functions
  .region("asia-northeast3")
  .https.onRequest((req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    updateSellerTrust(req, res);
  });
