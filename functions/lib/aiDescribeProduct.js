import * as functions from "firebase-functions";
import fetch from "node-fetch";
export const aiDescribeProduct = functions.https.onCall(async (data, context) => {
    var _a, _b, _c;
    const { imageUrl } = data;
    if (!imageUrl) {
        throw new functions.https.HttpsError("invalid-argument", "imageUrl이 필요합니다.");
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new functions.https.HttpsError("failed-precondition", "OpenAI API 키가 설정되지 않았습니다.");
    }
    const body = {
        model: "gpt-4o-mini",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "이 이미지는 중고 스포츠 용품입니다. 다음 형식으로 한국어로 요약해줘:\n\n제목: [상품명]\n설명: [상품 설명]\n카테고리: [축구/야구/농구/테니스/골프/기타]\n특징: [주요 특징]"
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
        max_tokens: 500,
        temperature: 0.7
    };
    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            throw new Error(`OpenAI API 오류: ${res.status} ${res.statusText}`);
        }
        const responseData = await res.json();
        const aiText = ((_c = (_b = (_a = responseData === null || responseData === void 0 ? void 0 : responseData.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || "AI 설명 생성 실패";
        // AI 응답을 파싱하여 구조화된 데이터로 변환
        const parsedData = parseAIResponse(aiText);
        return {
            success: true,
            rawText: aiText,
            ...parsedData
        };
    }
    catch (err) {
        console.error("AI 처리 오류:", err);
        throw new functions.https.HttpsError("internal", "AI 처리 중 오류 발생");
    }
});
// AI 응답 파싱 함수
function parseAIResponse(text) {
    const lines = text.split('\n').filter(line => line.trim());
    let title = "";
    let description = "";
    let category = "기타";
    let features = "";
    lines.forEach(line => {
        if (line.includes('제목:')) {
            title = line.replace('제목:', '').trim();
        }
        else if (line.includes('설명:')) {
            description = line.replace('설명:', '').trim();
        }
        else if (line.includes('카테고리:')) {
            const cat = line.replace('카테고리:', '').trim();
            if (['축구', '야구', '농구', '테니스', '골프', '기타'].includes(cat)) {
                category = cat;
            }
        }
        else if (line.includes('특징:')) {
            features = line.replace('특징:', '').trim();
        }
    });
    return {
        title: title || "상품명",
        description: description || "상품 설명이 없습니다.",
        category: category,
        features: features || ""
    };
}
//# sourceMappingURL=aiDescribeProduct.js.map