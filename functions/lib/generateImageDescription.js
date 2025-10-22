import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";
// Firebase Admin 초기화
admin.initializeApp();
// OpenAI 클라이언트 초기화 (우선순위: functions config > 환경변수)
const openai = new OpenAI({
    apiKey: (functions.config().openai && functions.config().openai.key) || process.env.OPENAI_API_KEY,
});
// AI 이미지 설명 생성 함수 (Callable)
export const generateImageDescription = functions
    .region("asia-northeast3") // 서울 리전 추천
    .https.onCall(async (data, context) => {
    var _a, _b, _c, _d;
    try {
        const { imageUrl } = data;
        if (!imageUrl) {
            throw new functions.https.HttpsError("invalid-argument", "imageUrl이 필요합니다.");
        }
        console.log("🧠 AI 이미지 설명 생성 시작:", imageUrl);
        // OpenAI Vision API 호출
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // 빠르고 경제적인 모델
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "이 이미지를 한 문단으로 묘사해줘. 자연스럽고 상품 설명용으로."
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
        const description = (_d = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "이미지 설명을 생성하지 못했습니다.";
        console.log("✅ AI 이미지 설명 생성 완료:", description);
        return { description };
    }
    catch (err) {
        console.error("OpenAI Vision Error:", err);
        throw new functions.https.HttpsError("internal", "AI 처리 오류");
    }
});
// HTTP 버전 (외부 호출용)
export const generateImageDescriptionHttp = functions
    .region("asia-northeast3")
    .https.onRequest(async (req, res) => {
    var _a, _b, _c, _d;
    // CORS 설정
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
                        { type: "text", text: "이 이미지를 상품 설명처럼 자연스럽게 요약해줘." },
                        { type: "image_url", image_url: { url: imageUrl } },
                    ],
                },
            ],
            max_tokens: 300,
        });
        const description = (_d = (_c = (_b = (_a = result.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "";
        res.json({ description });
    }
    catch (err) {
        console.error("OpenAI Vision HTTP Error:", err);
        res.status(500).json({ error: "Internal Error" });
    }
});
//# sourceMappingURL=generateImageDescription.js.map