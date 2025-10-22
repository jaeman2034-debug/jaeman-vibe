import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

// Admin SDK 초기화 (이미 초기화되어 있으면 무시)
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// 공용 유틸
function now() { return admin.firestore.FieldValue.serverTimestamp(); }

type JoinPayload = { eventId: string };
type LeavePayload = { eventId: string };

export const joinEvent = functions
  .region("us-central1")
  .https.onCall(async (data: JoinPayload, ctx) => {
    try {
      const uid = ctx.auth?.uid;
      if (!uid) throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
      const { eventId } = data;
      if (!eventId) throw new functions.https.HttpsError("invalid-argument", "eventId가 필요합니다.");

      console.log("[joinEvent-mini] 시작:", { uid, eventId });

      const evRef = db.doc(`events/${eventId}`);
      const atRef = evRef.collection("attendees").doc(uid);

      await db.runTransaction(async (tx) => {
        const evSnap = await tx.get(evRef);
        if (!evSnap.exists) throw new functions.https.HttpsError("not-found", "이벤트 없음");

        // 이미 참가면 패스
        const atSnap = await tx.get(atRef);
        if (atSnap.exists && atSnap.get("status") === "joined") {
          console.log("[joinEvent-mini] 이미 참가 중");
          return;
        }

        // 최소 성공 경로: 참가 + 카운트 + 타임스탬프
        tx.set(atRef, { 
          status: "joined", 
          joinedAt: admin.firestore.FieldValue.serverTimestamp() 
        }, { merge: true });
        
        tx.update(evRef, {
          attendeeCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log("[joinEvent-mini] 참가 완료");
      });

      return { ok: true, joined: true };
    } catch (err: any) {
      console.error("[joinEvent-mini] error:", err);
      if (err instanceof functions.https.HttpsError) throw err;
      throw new functions.https.HttpsError("internal", err?.message ?? "join failed");
    }
  });

export const leaveEvent = functions
  .region("us-central1")
  .https.onCall(async (data: LeavePayload, ctx) => {
    try {
      const uid = ctx.auth?.uid;
      if (!uid) throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
      const { eventId } = data;
      if (!eventId) throw new functions.https.HttpsError("invalid-argument", "eventId가 필요합니다.");

      const evRef = db.doc(`events/${eventId}`);
      const atRef = evRef.collection("attendees").doc(uid);

      return await db.runTransaction(async (tx) => {
        const [evSnap, atSnap] = await Promise.all([tx.get(evRef), tx.get(atRef)]);
        if (!evSnap.exists) throw new functions.https.HttpsError("not-found", "이벤트가 없습니다.");
        if (!atSnap.exists || atSnap.get("status") !== "joined") {
          return { ok: true, noop: true };
        }

        const ev = evSnap.data() as any;
        const count = Number(ev.attendeeCount ?? 0);

        tx.set(atRef, { status: "canceled", canceledAt: now() }, { merge: true });
        tx.update(evRef, { attendeeCount: Math.max(0, count - 1), updatedAt: now() });
        tx.set(evRef.collection("logs").doc(), { type: "leave", uid, at: now() });
        return { ok: true, left: true };
      });
    } catch (err: any) {
      console.error("[leaveEvent] error:", err);
      if (err instanceof functions.https.HttpsError) throw err;
      throw new functions.https.HttpsError("internal", err?.message ?? "leave failed");
    }
  });
