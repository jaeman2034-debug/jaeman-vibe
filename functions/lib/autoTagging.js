import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const db = admin.firestore();
/**
 * 📦 Storage 이미지 업로드 시 자동 태그 생성 및 Firestore 업데이트
 *
 * 트리거: Storage onFinalize
 * 기능:
 * 1. market-uploads 문서에서 caption_ko 로드
 * 2. 한국어 캡션에서 키워드 추출
 * 3. tags 배열 필드 업데이트
 * 4. searchKeywords 필드 생성 (검색 최적화)
 */
export const autoGenerateTags = functions.firestore
    .document("market-uploads/{uploadId}")
    .onWrite(async (change, context) => {
    var _a;
    const uploadId = context.params.uploadId;
    // 문서 삭제된 경우 무시
    if (!change.after.exists) {
        console.log(`⏩ 문서 삭제됨, 태그 생성 스킵:`, uploadId);
        return null;
    }
    const data = change.after.data();
    const caption_ko = data === null || data === void 0 ? void 0 : data.caption_ko;
    const caption_en = data === null || data === void 0 ? void 0 : data.caption_en;
    // caption이 없으면 태그 생성 불가
    if (!caption_ko && !caption_en) {
        console.log(`⚠️ caption이 없어서 태그 생성 불가:`, uploadId);
        return null;
    }
    console.log(`🏷️ 자동 태그 생성 시작:`, uploadId);
    try {
        // 1️⃣ 한국어 캡션에서 태그 추출
        const koreanTags = caption_ko
            ? caption_ko
                .split(/[\s,\.!?]+/) // 공백, 쉼표, 마침표 등으로 분리
                .filter((word) => word.length > 1) // 1글자는 제외
                .filter((word) => !/^[0-9]+$/.test(word)) // 숫자만 있는 것 제외
                .slice(0, 10) // 최대 10개
            : [];
        // 2️⃣ 영어 캡션에서 태그 추출 (선택)
        const englishTags = caption_en
            ? caption_en
                .toLowerCase()
                .split(/[\s,\.!?]+/)
                .filter((word) => word.length > 2)
                .filter((word) => !/^[0-9]+$/.test(word))
                .slice(0, 5)
            : [];
        // 3️⃣ 중복 제거
        const allTags = Array.from(new Set([...koreanTags, ...englishTags]));
        // 4️⃣ 스포츠 관련 키워드 필터링 및 우선순위 지정
        const sportsKeywords = [
            "축구", "축구공", "축구화", "유니폼", "운동복", "운동화",
            "야구", "농구", "배구", "테니스", "골키퍼", "골대",
            "soccer", "football", "ball", "shoes", "uniform", "sports",
            "jersey", "boots", "goalkeeper", "goal", "field", "stadium"
        ];
        const priorityTags = allTags.filter(tag => sportsKeywords.some(keyword => tag.includes(keyword)));
        const otherTags = allTags.filter(tag => !sportsKeywords.some(keyword => tag.includes(keyword)));
        const finalTags = [...priorityTags, ...otherTags].slice(0, 15);
        // 5️⃣ 검색 최적화용 키워드 생성 (소문자 변환, 중복 제거)
        const searchKeywords = Array.from(new Set(finalTags.map(tag => tag.toLowerCase()).concat(((_a = data === null || data === void 0 ? void 0 : data.title) === null || _a === void 0 ? void 0 : _a.toLowerCase().split(/[\s,\.!?]+/)) || []))).filter(kw => kw.length > 1);
        console.log(`✅ 생성된 태그:`, finalTags);
        console.log(`🔍 검색 키워드:`, searchKeywords);
        // 6️⃣ Firestore 업데이트
        await db.collection("market-uploads").doc(uploadId).update({
            tags: finalTags,
            searchKeywords: searchKeywords,
            tagsGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`🎉 태그 생성 완료:`, uploadId);
        return null;
    }
    catch (error) {
        console.error(`❌ 태그 생성 오류 [${uploadId}]:`, error);
        return null;
    }
});
/**
 * 🧠 AI 기반 자연어 검색어 → 태그 변환 (Callable Function)
 *
 * 사용자가 "축구할 때 신기 좋은 신발" 같은 자연어로 검색하면
 * GPT가 핵심 키워드 2-3개를 추출해서 반환
 */
export const refineSearchKeyword = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e;
    const { query } = data;
    if (!query || typeof query !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "query 파라미터가 필요합니다.");
    }
    console.log(`🧠 자연어 검색어 분석:`, query);
    try {
        const apiKey = ((_a = functions.config().openai) === null || _a === void 0 ? void 0 : _a.api_key) || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn("⚠️ OpenAI API 키가 없어서 원본 쿼리 반환");
            return { keywords: [query] };
        }
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `당신은 스포츠 용품 검색 키워드 추출 전문가입니다.
사용자의 자연어 검색어에서 핵심 키워드 2-3개만 추출하세요.
쉼표로 구분하여 반환하세요.

예시:
입력: "축구할 때 신기 좋은 신발"
출력: "축구화, 신발, 축구"

입력: "골키퍼가 착용하는 장갑"
출력: "골키퍼, 장갑"`,
                    },
                    { role: "user", content: query },
                ],
                max_tokens: 50,
                temperature: 0.3,
            }),
        });
        if (!response.ok) {
            console.error("❌ OpenAI API 오류:", response.status);
            return { keywords: [query] };
        }
        const result = await response.json();
        const rawKeywords = ((_e = (_d = (_c = (_b = result.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) === null || _e === void 0 ? void 0 : _e.trim()) || query;
        // 쉼표로 분리 및 정리
        const keywords = rawKeywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k.length > 0)
            .slice(0, 3); // 최대 3개
        console.log(`✅ 추출된 키워드:`, keywords);
        return { keywords };
    }
    catch (error) {
        console.error("❌ 키워드 추출 오류:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
//# sourceMappingURL=autoTagging.js.map