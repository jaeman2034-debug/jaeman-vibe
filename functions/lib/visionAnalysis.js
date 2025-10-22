// ✅ YAGO VIBE AI 이미지 분석 자동화 (Vision API + Firebase Functions)
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Storage } from "@google-cloud/storage";
import vision from "@google-cloud/vision";
const db = admin.firestore();
const storage = new Storage();
const visionClient = new vision.ImageAnnotatorClient();
/**
 * Storage에 이미지가 업로드되면 자동으로 Vision API로 분석하고
 * Firestore에 AI 신뢰도 점수를 저장합니다.
 *
 * 경로 규칙: market/{productId}/{fileName}
 * customMetadata: { productId: "문서ID" }
 */
export const analyzeMarketImage = functions
    .region("asia-northeast3") // 서울 리전 (필요시 변경 가능)
    .storage.object()
    .onFinalize(async (object) => {
    try {
        const { name: filePath, contentType, metadata } = object;
        console.log("🔍 Storage 트리거 실행:", filePath);
        // ✅ 이미지 파일만 처리
        if (!contentType || !contentType.startsWith("image/")) {
            console.log("⏭️ 이미지 파일이 아님, 건너뜀");
            return;
        }
        // ✅ 경로 규칙: market/{productId}/fileName
        if (!filePath || !filePath.startsWith("market/")) {
            console.log("⏭️ market/ 경로가 아님, 건너뜀");
            return;
        }
        // ✅ productId 추출 (우선 customMetadata, 없으면 경로에서 파싱)
        const productId = (metadata === null || metadata === void 0 ? void 0 : metadata.productId) || filePath.split("/")[1]; // "market/<id>/filename"
        if (!productId) {
            console.warn("❌ productId를 찾을 수 없음:", filePath);
            return;
        }
        console.log("📦 상품 ID:", productId);
        // ✅ 파일 존재 확인
        const bucket = storage.bucket(object.bucket);
        const [exists] = await bucket.file(filePath).exists();
        if (!exists) {
            console.warn("❌ 파일이 존재하지 않음:", filePath);
            return;
        }
        const gsUri = `gs://${object.bucket}/${filePath}`;
        console.log("🖼️ 이미지 URI:", gsUri);
        // ✅ 1) Vision API 호출 - Label Detection (라벨 감지)
        console.log("🤖 Vision API 호출 중...");
        const [labelRes] = await visionClient.labelDetection(gsUri);
        const labels = (labelRes.labelAnnotations || [])
            .slice(0, 8)
            .map((l) => l.description || "");
        console.log("🏷️ 감지된 라벨:", labels);
        // ✅ 2) Vision API 호출 - Safe Search Detection (유해성 검사)
        const [safeRes] = await visionClient.safeSearchDetection(gsUri);
        const safe = safeRes.safeSearchAnnotation || {};
        console.log("🛡️ Safe Search 결과:", {
            adult: safe.adult,
            violence: safe.violence,
            medical: safe.medical,
            spoof: safe.spoof,
            racy: safe.racy,
        });
        // ✅ 3) 점수 계산 (간단/보수적 스코어링)
        // 기본 100점에서 유해 가능성에 따라 감점, 라벨 수에 따라 보정
        let score = 100;
        const penalize = (likelihood, weight = 10) => {
            if (!likelihood)
                return 0;
            const map = {
                VERY_UNLIKELY: 0,
                UNLIKELY: 2,
                POSSIBLE: 6,
                LIKELY: 12,
                VERY_LIKELY: 24,
            };
            return map[likelihood] ? (map[likelihood] * weight) / 12 : 0;
        };
        // 유해성 감점
        score -= penalize(safe.adult, 18);
        score -= penalize(safe.violence, 16);
        score -= penalize(safe.medical, 10);
        score -= penalize(safe.spoof, 6);
        score -= penalize(safe.racy, 14);
        // 라벨 수에 따른 신뢰도 보정
        if (labels.length < 3)
            score -= 8; // 라벨이 너무 적으면 감점
        if (labels.length > 6)
            score += 4; // 라벨이 많으면 가산점
        // 스포츠/용품 관련 라벨 가중치 (YAGO VIBE 특화)
        const sportsKeywords = [
            "sports",
            "soccer",
            "football",
            "ball",
            "equipment",
            "athletic",
            "sportswear",
            "jersey",
            "shoes",
            "bag",
        ];
        const hasSportsLabel = labels.some((label) => sportsKeywords.some((keyword) => label.toLowerCase().includes(keyword)));
        if (hasSportsLabel) {
            score += 5; // 스포츠 관련 상품이면 가산점
            console.log("⚽ 스포츠 관련 상품 감지 → +5점");
        }
        // 최종 점수 범위: 0~100
        score = Math.max(0, Math.min(100, Math.round(score)));
        console.log("📊 최종 AI 신뢰도 점수:", score);
        // ✅ 4) Firestore 업데이트
        await db
            .collection("marketItems")
            .doc(productId)
            .set({
            ai: {
                score,
                labels,
                safeSearch: {
                    adult: safe.adult || "UNKNOWN",
                    spoof: safe.spoof || "UNKNOWN",
                    medical: safe.medical || "UNKNOWN",
                    violence: safe.violence || "UNKNOWN",
                    racy: safe.racy || "UNKNOWN",
                },
                analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
                filePath,
            },
        }, { merge: true });
        console.log(`✅ AI 점수 ${score}점이 상품 ${productId}에 저장되었습니다`);
        // ✅ 5) 점수가 너무 낮으면 관리자에게 알림 (선택 사항)
        if (score < 50) {
            console.warn(`⚠️ 낮은 신뢰도 점수 (${score}점) - 관리자 확인 필요`);
            // TODO: 관리자 알림 로직 추가 (FCM, 이메일 등)
        }
    }
    catch (err) {
        console.error("❌ analyzeMarketImage 오류:", err);
        // 에러가 발생해도 함수는 정상 종료 (재시도 방지)
    }
});
//# sourceMappingURL=visionAnalysis.js.map