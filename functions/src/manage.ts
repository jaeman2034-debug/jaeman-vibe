import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();

async function assertHost(ctx: functions.https.CallableContext, eventId: string) {
  const uid = ctx.auth?.uid;
  if (!uid) throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
  if (!eventId) throw new functions.https.HttpsError("invalid-argument", "eventId가 필요합니다.");
  const evRef = db.doc(`events/${eventId}`);
  const evSnap = await evRef.get();
  if (!evSnap.exists) throw new functions.https.HttpsError("not-found", "이벤트가 없습니다.");
  const ev = evSnap.data() as any;
  if (ev.hostId !== uid) throw new functions.https.HttpsError("permission-denied", "호스트만 수행 가능합니다.");
  return { evRef, ev };
}
async function addLog(eventId: string, entry: any) {
  await db.collection(`events/${eventId}/logs`).add({ ...entry, at: now() });
}

export const setEventStatus = functions.region("us-central1").https.onCall(async (data, ctx) => {
  try {
    const { eventId, status } = data as { eventId: string; status: "open" | "closed" };
    if (!["open","closed"].includes(status)) throw new functions.https.HttpsError("invalid-argument","status는 open|closed");
    const { evRef } = await assertHost(ctx, eventId);
    await evRef.update({ status, updatedAt: now() });
    await addLog(eventId, { type: "status", status, uid: ctx.auth!.uid });
    return { ok: true, status };
  } catch (err:any) {
    console.error("[setEventStatus] error:", err);
    if (err instanceof functions.https.HttpsError) throw err;
    throw new functions.https.HttpsError("internal", err?.message ?? "setEventStatus failed");
  }
});

export const pinNotice = functions.region("us-central1").https.onCall(async (data, ctx) => {
  try {
    const { eventId, title, body } = data as { eventId: string; title: string; body: string };
    const { evRef } = await assertHost(ctx, eventId);
    const pinnedRef = evRef.collection("notice").doc("pinned");
    await pinnedRef.set({ title: title ?? "", body: body ?? "", updatedAt: now(), updatedBy: ctx.auth!.uid }, { merge: true });
    await addLog(eventId, { type: "notice_pin", uid: ctx.auth!.uid });
    return { ok: true };
  } catch (err:any) {
    console.error("[pinNotice] error:", err);
    if (err instanceof functions.https.HttpsError) throw err;
    throw new functions.https.HttpsError("internal", err?.message ?? "pinNotice failed");
  }
});

export const kickAttendee = functions.region("us-central1").https.onCall(async (data, ctx) => {
  try {
    const { eventId, targetUid, reason } = data as { eventId: string; targetUid: string; reason?: string };
    if (!targetUid) throw new functions.https.HttpsError("invalid-argument", "targetUid가 필요합니다.");
    const { evRef } = await assertHost(ctx, eventId);
    await db.runTransaction(async (tx) => {
      const atRef = evRef.collection("attendees").doc(targetUid);
      const atSnap = await tx.get(atRef);
      if (!atSnap.exists) return;
      const prev = atSnap.data() as any;
      tx.set(atRef, { status:"kicked", kickedAt: admin.firestore.FieldValue.serverTimestamp(), kickedBy: ctx.auth!.uid, reason: reason ?? "" }, { merge: true });
      await addLog(eventId, { type: "kick", uid: targetUid, by: ctx.auth!.uid, prevStatus: prev?.status, reason: reason ?? "" });
    });
    return { ok: true };
  } catch (err:any) {
    console.error("[kickAttendee] error:", err);
    if (err instanceof functions.https.HttpsError) throw err;
    throw new functions.https.HttpsError("internal", err?.message ?? "kickAttendee failed");
  }
});