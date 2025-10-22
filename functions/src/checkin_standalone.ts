import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();

function assertAuth(ctx: functions.https.CallableContext) {
  const uid = ctx.auth?.uid;
  if (!uid) throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
  return uid;
}
async function assertHost(ctx: functions.https.CallableContext, eventId: string) {
  const uid = assertAuth(ctx);
  if (!eventId) throw new functions.https.HttpsError("invalid-argument", "eventId가 필요합니다.");
  const evRef = db.doc(`events/${eventId}`);
  const evSnap = await evRef.get();
  if (!evSnap.exists) throw new functions.https.HttpsError("not-found", "이벤트가 없습니다.");
  const ev = evSnap.data() as any;
  if (ev.hostId !== uid) throw new functions.https.HttpsError("permission-denied", "호스트만 가능합니다.");
  return { evRef, ev, uid };
}

/** 1) 체크인 QR용 nonce 생성 (여러 참가자 공용, 만료시간 내 재사용) */
export const createCheckinNonce = functions.region("us-central1").https.onCall(async (data, ctx) => {
  try {
    const { eventId, ttlSec = 2 * 60 * 60 } = data as { eventId: string; ttlSec?: number };
    await assertHost(ctx, eventId);
    const nonce = cryptoRandom();
    const expAt = admin.firestore.Timestamp.fromMillis(Date.now() + ttlSec * 1000);
    await db.doc(`checkinNonces/${nonce}`).set({
      eventId, expAt, createdAt: now(), createdBy: ctx.auth!.uid,
    });
    return { ok: true, nonce, expAt: expAt.toMillis() };
  } catch (err: any) {
    console.error("[createCheckinNonce]", err);
    if (err instanceof functions.https.HttpsError) throw err;
    throw new functions.https.HttpsError("internal", err?.message ?? "createCheckinNonce failed");
  }
});

/** 2) 셀프 체크인 (참가자: QR로 열림) */
export const checkin = functions.region("us-central1").https.onCall(async (data, ctx) => {
  try {
    const uid = assertAuth(ctx);
    const { eventId, nonce } = data as { eventId: string; nonce: string };
    if (!eventId || !nonce) throw new functions.https.HttpsError("invalid-argument", "eventId, nonce가 필요합니다.");

    const nonceRef = db.doc(`checkinNonces/${nonce}`);
    const nonceSnap = await nonceRef.get();
    if (!nonceSnap.exists) throw new functions.https.HttpsError("not-found", "유효하지 않은 QR입니다.");
    const n = nonceSnap.data() as any;
    if (n.eventId !== eventId) throw new functions.https.HttpsError("failed-precondition", "이 이벤트의 QR이 아닙니다.");
    if (n.expAt.toMillis() < Date.now()) throw new functions.https.HttpsError("deadline-exceeded", "QR 유효시간이 지났습니다.");

    const evRef = db.doc(`events/${eventId}`);
    const atRef = evRef.collection("attendees").doc(uid);
    await db.runTransaction(async (tx) => {
      const [evSnap, atSnap] = await Promise.all([tx.get(evRef), tx.get(atRef)]);
      if (!evSnap.exists) throw new functions.https.HttpsError("not-found", "이벤트가 없습니다.");
      if (!atSnap.exists || atSnap.get("status") !== "joined") {
        throw new functions.https.HttpsError("permission-denied", "참가 확정된 사용자만 체크인할 수 있습니다.");
      }
      if (atSnap.get("checkedInAt")) {
        // 이미 체크인 된 경우
        return;
      }
      tx.update(atRef, { checkedInAt: now() });
      tx.set(evRef.collection("logs").doc(), { type: "checkin", uid, at: now() });
    });
    return { ok: true };
  } catch (err: any) {
    console.error("[checkin]", err);
    if (err instanceof functions.https.HttpsError) throw err;
    throw new functions.https.HttpsError("internal", err?.message ?? "checkin failed");
  }
});

/** 간단한 랜덤 문자열 생성 */
function cryptoRandom(len = 24) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let s = ""; for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
