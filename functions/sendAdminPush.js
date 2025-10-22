import admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

/**
 * 관리자 전체에게 푸시 알림 전송
 * 
 * 사용법:
 * POST https://us-central1-{project-id}.cloudfunctions.net/sendAdminPush
 * Body: {
 *   "title": "📊 주간 리포트 생성 완료",
 *   "body": "소흘FC 60/88/아카데미 리포트가 준비되었습니다.",
 *   "url": "/admin/reports/pdf"
 * }
 */
export const sendAdminPush = onRequest({ cors: true }, async (req, res) => {
  // CORS 처리
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const { title, body, url } = req.body;

    if (!title || !body) {
      res.status(400).json({ error: "title과 body는 필수입니다" });
      return;
    }

    logger.info("📤 관리자 푸시 전송 시작", { title, body, url });

    // 1️⃣ Firestore에서 관리자 유저 조회
    const usersSnapshot = await admin
      .firestore()
      .collection("users")
      .where("role", "==", "admin")
      .get();

    if (usersSnapshot.empty) {
      logger.warn("⚠️ 관리자 유저가 없습니다");
      res.status(200).json({ success: true, sent: 0, message: "관리자 없음" });
      return;
    }

    // 2️⃣ FCM 토큰 수집
    const tokens = [];
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.fcmToken) {
        tokens.push(data.fcmToken);
      }
    });

    if (tokens.length === 0) {
      logger.warn("⚠️ FCM 토큰이 등록된 관리자가 없습니다");
      res.status(200).json({ success: true, sent: 0, message: "토큰 없음" });
      return;
    }

    logger.info(`📱 ${tokens.length}명의 관리자에게 푸시 전송 중...`);

    // 3️⃣ FCM 메시지 생성
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        url: url || "/admin/pwa",
        timestamp: new Date().toISOString(),
      },
      webpush: {
        notification: {
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          requireInteraction: false,
        },
        fcmOptions: {
          link: url || "/admin/pwa",
        },
      },
    };

    // 4️⃣ 일괄 전송
    const results = await Promise.allSettled(
      tokens.map((token) =>
        admin.messaging().send({
          ...message,
          token,
        })
      )
    );

    // 5️⃣ 결과 집계
    let successCount = 0;
    let failureCount = 0;

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        successCount++;
        logger.info(`✅ 푸시 전송 성공: ${tokens[index].substring(0, 20)}...`);
      } else {
        failureCount++;
        logger.error(`❌ 푸시 전송 실패: ${result.reason}`);
      }
    });

    logger.info(`📊 전송 완료: 성공 ${successCount}, 실패 ${failureCount}`);

    res.status(200).json({
      success: true,
      sent: successCount,
      failed: failureCount,
      total: tokens.length,
    });
  } catch (error) {
    logger.error("❌ 푸시 전송 오류:", error);
    res.status(500).json({ error: error.message });
  }
});

