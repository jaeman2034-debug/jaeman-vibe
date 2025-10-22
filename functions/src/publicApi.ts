import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { postToN8N } from "./lib/n8n";

// CORS 헤더 설정 함수
function setCorsHeaders(res: any) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

// 세션 시작 이벤트 수집
export const sessionStarted = onRequest(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { country, ua, timestamp, url } = req.body ?? {};

    logger.info("Session started event received", { country, ua, url });

    // n8n에 세션 시작 이벤트 전송
    const webhookUrl = process.env.N8N_WEBHOOK_USER_CREATED; // 또는 별도 세션 웹훅
    if (webhookUrl) {
      const success = await postToN8N(webhookUrl, {
        type: "session.started",
        country,
        ua,
        timestamp,
        url,
      });

      if (success) {
        logger.info("Session started event sent to n8n", { country });
      } else {
        logger.warn("Failed to send session started event to n8n", { country });
      }
    } else {
      logger.warn("N8N_WEBHOOK_USER_CREATED not configured for session events");
    }

    res.json({ ok: true });
  } catch (error) {
    logger.error("Error in sessionStarted", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
});

// 일반 분석 이벤트 수집
export const analytics = onRequest(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { eventType, data } = req.body ?? {};

    if (!eventType) {
      res.status(400).json({ error: "Missing eventType" });
      return;
    }

    logger.info("Analytics event received", { eventType, data });

    // n8n에 분석 이벤트 전송
    const webhookUrl = process.env.N8N_WEBHOOK_USER_CREATED; // 또는 별도 분석 웹훅
    if (webhookUrl) {
      const success = await postToN8N(webhookUrl, {
        type: "analytics.event",
        eventType,
        data,
      });

      if (success) {
        logger.info("Analytics event sent to n8n", { eventType });
      } else {
        logger.warn("Failed to send analytics event to n8n", { eventType });
      }
    } else {
      logger.warn("N8N_WEBHOOK_USER_CREATED not configured for analytics events");
    }

    res.json({ ok: true });
  } catch (error) {
    logger.error("Error in analytics", { error: error.message });
    res.status(500).json({ error: "Internal server error" });
  }
});
