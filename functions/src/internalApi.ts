import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions/v2";

// Firebase Admin 초기화 (이미 초기화되어 있을 수 있음)
if (!admin.apps.length) {
  admin.initializeApp();
}

export const adminUpdateDoc = onRequest(async (req, res) => {
  // CORS 헤더 설정
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, x-internal-key");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // 내부 키 인증
  const internalKey = req.headers["x-internal-key"];
  const expectedKey = process.env.INTERNAL_KEY || "internal_default_key_please_change";
  if (internalKey !== expectedKey) {
    logger.warn("Unauthorized internal API access attempt", {
      ip: req.ip,
      userAgent: req.get("User-Agent")
    });
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { path, update } = req.body as { 
      path: string; 
      update: Record<string, unknown> 
    };

    if (!path || !update) {
      res.status(400).json({ error: "Missing path or update data" });
      return;
    }

    // Firestore 문서 업데이트
    await admin.firestore().doc(path).update(update);
    
    logger.info("Document updated via internal API", { path, update });
    res.json({ ok: true, path, updatedAt: new Date().toISOString() });
  } catch (error) {
    logger.error("Internal API error", { error: error.message, path: req.body?.path });
    res.status(500).json({ error: "Internal server error" });
  }
});
