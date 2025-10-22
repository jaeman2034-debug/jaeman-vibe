// ??YAGO VIBE AI ?대?吏 遺꾩꽍 ?먮룞??(Vision API + Firebase Functions)
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Storage } from "@google-cloud/storage";
import vision from "@google-cloud/vision";

const db = admin.firestore();
const storage = new Storage();
const visionClient = new vision.ImageAnnotatorClient();

/**
 * Storage???대?吏媛 ?낅줈?쒕릺硫??먮룞?쇰줈 Vision API濡?遺꾩꽍?섍퀬
 * Firestore??AI ?좊ː???먯닔瑜???ν빀?덈떎.
 * 
 * 寃쎈줈 洹쒖튃: market/{productId}/{fileName}
 * customMetadata: { productId: "臾몄꽌ID" }
 */
export const analyzeMarketImage = functions
  .region("asia-northeast3") // ?쒖슱 由ъ쟾 (?꾩슂??蹂寃?媛??
  .storage.object()
  .onFinalize(async (object) => {
    try {
      const { name: filePath, contentType, metadata } = object;

      console.log("?뵇 Storage ?몃━嫄??ㅽ뻾:", filePath);

      // ???대?吏 ?뚯씪留?泥섎━
      if (!contentType || !contentType.startsWith("image/")) {
        console.log("??툘 ?대?吏 ?뚯씪???꾨떂, 嫄대꼫?");
        return;
      }

      // ??寃쎈줈 洹쒖튃: market/{productId}/fileName
      if (!filePath || !filePath.startsWith("market/")) {
        console.log("??툘 market/ 寃쎈줈媛 ?꾨떂, 嫄대꼫?");
        return;
      }

      // ??productId 異붿텧 (?곗꽑 customMetadata, ?놁쑝硫?寃쎈줈?먯꽌 ?뚯떛)
      const productId =
        metadata?.productId || filePath.split("/")[1]; // "market/<id>/filename"

      if (!productId) {
        console.warn("??productId瑜?李얠쓣 ???놁쓬:", filePath);
        return;
      }

      console.log("?벀 ?곹뭹 ID:", productId);

      // ???뚯씪 議댁옱 ?뺤씤
      const bucket = storage.bucket(object.bucket);
      const [exists] = await bucket.file(filePath).exists();
      if (!exists) {
        console.warn("???뚯씪??議댁옱?섏? ?딆쓬:", filePath);
        return;
      }

      const gsUri = `gs://${object.bucket}/${filePath}`;
      console.log("?뼹截??대?吏 URI:", gsUri);

      // ??1) Vision API ?몄텧 - Label Detection (?쇰꺼 媛먯?)
      console.log("?쨼 Vision API ?몄텧 以?..");
      const [labelRes] = await visionClient.labelDetection(gsUri);
      const labels = (labelRes.labelAnnotations || [])
        .slice(0, 8)
        .map((l) => l.description || "");

      console.log("?뤇截?媛먯????쇰꺼:", labels);

      // ??2) Vision API ?몄텧 - Safe Search Detection (?좏빐??寃??
      const [safeRes] = await visionClient.safeSearchDetection(gsUri);
      const safe = safeRes.safeSearchAnnotation || {};

      console.log("?썳截?Safe Search 寃곌낵:", {
        adult: safe.adult,
        violence: safe.violence,
        medical: safe.medical,
        spoof: safe.spoof,
        racy: safe.racy,
      });

      // ??3) ?먯닔 怨꾩궛 (媛꾨떒/蹂댁닔???ㅼ퐫?대쭅)
      // 湲곕낯 100?먯뿉???좏빐 媛?μ꽦???곕씪 媛먯젏, ?쇰꺼 ?섏뿉 ?곕씪 蹂댁젙
      let score = 100;

      const penalize = (likelihood?: string, weight = 10) => {
        if (!likelihood) return 0;
        const map: Record<string, number> = {
          VERY_UNLIKELY: 0,
          UNLIKELY: 2,
          POSSIBLE: 6,
          LIKELY: 12,
          VERY_LIKELY: 24,
        };
        return map[likelihood] ? (map[likelihood] * weight) / 12 : 0;
      };

      // ?좏빐??媛먯젏
      score -= penalize(safe.adult, 18);
      score -= penalize(safe.violence, 16);
      score -= penalize(safe.medical, 10);
      score -= penalize(safe.spoof, 6);
      score -= penalize(safe.racy, 14);

      // ?쇰꺼 ?섏뿉 ?곕Ⅸ ?좊ː??蹂댁젙
      if (labels.length < 3) score -= 8; // ?쇰꺼???덈Т ?곸쑝硫?媛먯젏
      if (labels.length > 6) score += 4; // ?쇰꺼??留롮쑝硫?媛?곗젏

      // ?ㅽ룷痢??⑺뭹 愿???쇰꺼 媛以묒튂 (YAGO VIBE ?뱁솕)
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
      const hasSportsLabel = labels.some((label) =>
        sportsKeywords.some((keyword) =>
          label.toLowerCase().includes(keyword)
        )
      );
      if (hasSportsLabel) {
        score += 5; // ?ㅽ룷痢?愿???곹뭹?대㈃ 媛?곗젏
        console.log("???ㅽ룷痢?愿???곹뭹 媛먯? ??+5??);
      }

      // 理쒖쥌 ?먯닔 踰붿쐞: 0~100
      score = Math.max(0, Math.min(100, Math.round(score)));

      console.log("?뱤 理쒖쥌 AI ?좊ː???먯닔:", score);

      // ??4) Firestore ?낅뜲?댄듃
      await db
        .collection("marketItems")
        .doc(productId)
        .set(
          {
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
          },
          { merge: true }
        );

      console.log(`??AI ?먯닔 ${score}?먯씠 ?곹뭹 ${productId}????λ릺?덉뒿?덈떎`);

      // ??5) ?먯닔媛 ?덈Т ??쑝硫?愿由ъ옄?먭쾶 ?뚮┝ (?좏깮 ?ы빆)
      if (score < 50) {
        console.warn(`?좑툘 ??? ?좊ː???먯닔 (${score}?? - 愿由ъ옄 ?뺤씤 ?꾩슂`);
        // TODO: 愿由ъ옄 ?뚮┝ 濡쒖쭅 異붽? (FCM, ?대찓????
      }
    } catch (err) {
      console.error("??analyzeMarketImage ?ㅻ쪟:", err);
      // ?먮윭媛 諛쒖깮?대룄 ?⑥닔???뺤긽 醫낅즺 (?ъ떆??諛⑹?)
    }
  });

