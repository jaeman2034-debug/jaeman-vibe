import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

// Admin SDK 초기화 (이미 초기화되어 있으면 무시)
if (!admin.apps.length) {
  admin.initializeApp();
}

export const ping = functions
  .region("us-central1")
  .https.onCall(async (data, ctx) => {
    console.log("[ping]", {uid: ctx.auth?.uid, data});
    return { ok: true, uid: ctx.auth?.uid ?? null };
  });
