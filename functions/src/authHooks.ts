import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import { postToN8N } from "./lib/n8n";

// Firebase Admin 초기화 (이미 초기화되어 있을 수 있음)
if (!admin.apps.length) {
  admin.initializeApp();
}

const users = () => admin.firestore().collection("users");

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    const { uid, displayName, email, photoURL } = user;
    
    // Firestore에 사용자 문서 생성
    await users().doc(uid).set({
      displayName: displayName || null,
      email: email || null,
      photoURL: photoURL || null,
      role: "user",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
      marketingAccepted: false,
    });

    logger.info("User created in Firestore", { uid, displayName, email });

    // n8n에 사용자 생성 이벤트 전송
    const webhookUrl = process.env.N8N_WEBHOOK_USER_CREATED;
    if (webhookUrl) {
      const success = await postToN8N(webhookUrl, {
        type: "user.created",
        uid,
        displayName,
        email,
        photoURL,
        createdAt: new Date().toISOString(),
      });

      if (success) {
        logger.info("User creation event sent to n8n", { uid });
      } else {
        logger.warn("Failed to send user creation event to n8n", { uid });
      }
    } else {
      logger.warn("N8N_WEBHOOK_USER_CREATED not configured");
    }
  } catch (error) {
    logger.error("Error in onUserCreate", { 
      error: error.message, 
      uid: user.uid 
    });
  }
});
