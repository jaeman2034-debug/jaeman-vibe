var _a;
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";
// Firebase Admin 초기화
admin.initializeApp();
// OpenAI 클라이언트 초기화
const openai = new OpenAI({
    apiKey: ((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.api_key) || process.env.OPENAI_API_KEY,
});
/**
 * AI 이미지 자동 분석 및 태그 생성 Cloud Function
 *
 * 사용법:
 * POST https://YOUR_PROJECT.cloudfunctions.net/aiAutoTag
 * Body: { "imageUrl": "https://...", "docId": "marketItems/abc123" }
 */
export const aiAutoTag = functions.https.onRequest(async (req, res) => {
    var _a, _b;
    // CORS 설정
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
        // AI 분석 프롬프트
        const prompt = `
이 상품 이미지를 분석해서 한국 중고거래 마켓용 정보를 추출해주세요.

다음 형식의 JSON으로 응답해주세요:
{
  "category": "카테고리명 (예: 축구화, 의류, 전자제품, 가구, 도서, 스포츠용품, 기타)",
  "color": "주요 색상 (예: 검정, 빨강, 파랑)",
  "brand": "브랜드명 (인식 가능한 경우, 없으면 빈 문자열)",
  "condition": "상품 상태 (새것, 좋음, 보통, 나쁨)",
  "priceHint": "한국 중고거래 시장 기준 추천 가격 범위 (예: 5만원~8만원)",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"]
}

태그는 상품의 특징, 용도, 재질, 스타일 등을 포함해주세요.
가격은 실제 한국 중고거래 시장 기준으로 현실적으로 추정해주세요.
`;
        // OpenAI Vision API 호출
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "당신은 중고거래 마켓을 위한 상품 이미지 분석 전문가입니다. 정확하고 실용적인 정보를 제공해주세요."
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
        const rawResponse = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!rawResponse) {
            throw new Error("OpenAI API returned empty response");
        }
        // JSON 파싱 시도
        let aiResult;
        try {
            // JSON 부분만 추출
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiResult = JSON.parse(jsonMatch[0]);
            }
            else {
                throw new Error("No JSON found in response");
            }
        }
        catch (parseError) {
            console.error("JSON parsing failed:", parseError);
            console.error("Raw response:", rawResponse);
            // 파싱 실패 시 기본값 반환
            aiResult = {
                category: "기타",
                color: "미확인",
                brand: "",
                condition: "보통",
                priceHint: "가격문의",
                tags: ["AI 분석 실패"]
            };
        }
        // Firestore 업데이트
        const db = admin.firestore();
        await db.collection("marketItems").doc(docId).update({
            aiTags: aiResult.tags || [],
            aiCategory: aiResult.category || "기타",
            aiBrand: aiResult.brand || "",
            aiColor: aiResult.color || "미확인",
            aiCondition: aiResult.condition || "보통",
            aiSuggestedPrice: {
                hint: aiResult.priceHint || "가격문의",
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
            message: "AI 분석이 완료되었습니다."
        });
    }
    catch (error) {
        console.error("[AI Auto Tag] Error:", error);
        // 에러 발생 시에도 Firestore에 실패 상태 기록
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
        }
        catch (updateError) {
            console.error("[AI Auto Tag] Failed to update error status:", updateError);
        }
        res.status(500).json({
            success: false,
            error: String(error),
            message: "AI 분석 중 오류가 발생했습니다."
        });
    }
});
//# sourceMappingURL=aiAutoTagStandalone.js.map