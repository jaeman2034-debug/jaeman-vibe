import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();

async function assertStaff(eventId: string, uid?: string) {
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'login');
  const r = await db.doc(`events/${eventId}/roles/${uid}`).get();
  if (!r.exists) throw new functions.https.HttpsError('permission-denied', 'staff only');
}

export const startNext = functions.https.onCall(async (data, ctx) => {
  const { eventId } = data as { eventId: string };
  await assertStaff(eventId, ctx.auth?.uid);

  const qs = await db.collection(`events/${eventId}/timeline`).orderBy('order', 'asc').get();
  const next = qs.docs.find(d => (d.data() as any).status !== 'done');
  if (!next) return { ok: true, done: true };

  await next.ref.set({ 
    status: 'running', 
    startAt: admin.firestore.FieldValue.serverTimestamp() 
  }, { merge: true });
  return { ok: true, id: next.id };
});

export const markDone = functions.https.onCall(async (data, ctx) => {
  const { eventId, id } = data as { eventId: string; id: string };
  await assertStaff(eventId, ctx.auth?.uid);
  await db.doc(`events/${eventId}/timeline/${id}`).set({ 
    status: 'done', 
    endAt: now() 
  }, { merge: true });
  return { ok: true };
});
