import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { wrapCall } from './sentry';

const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();

async function assertStaff(eventId: string, uid?: string) {
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'login');
  const role = await db.doc(`events/${eventId}/roles/${uid}`).get();
  if (!role.exists) throw new functions.https.HttpsError('permission-denied', 'staff only');
}

export const banUser = functions.https.onCall(wrapCall('banUser', async (data, ctx) => {
  const { eventId, targetUid, days = 7, reason = '' } =
    data as { eventId: string; targetUid: string; days?: number; reason?: string };
  
  await assertStaff(eventId, ctx.auth?.uid);
  const until = admin.firestore.Timestamp.fromDate(new Date(Date.now() + days * 86400000));

  await db.runTransaction(async tx => {
    const banRef = db.doc(`events/${eventId}/bans/${targetUid}`);
    tx.set(banRef, { until, reason, by: ctx.auth!.uid, createdAt: now() }, { merge: true });
    
    // 참석/대기/프레즌스에서 제거
    tx.delete(db.doc(`events/${eventId}/attendees/${targetUid}`));
    tx.delete(db.doc(`events/${eventId}/waitlist/${targetUid}`));
    tx.delete(db.doc(`events/${eventId}/presence/${targetUid}`));
    
    tx.create(db.collection(`events/${eventId}/logs`).doc(), {
      action: 'ban.add', 
      actorId: ctx.auth!.uid, 
      at: now(), 
      meta: { targetUid, days, reason }
    });
  });
  
  return { ok: true };
}));

export const unbanUser = functions.https.onCall(wrapCall('unbanUser', async (data, ctx) => {
  const { eventId, targetUid } = data as { eventId: string; targetUid: string };
  
  await assertStaff(eventId, ctx.auth?.uid);
  
  await db.doc(`events/${eventId}/bans/${targetUid}`).delete();
  await db.collection(`events/${eventId}/logs`).add({
    action: 'ban.remove', 
    actorId: ctx.auth!.uid, 
    at: now(), 
    meta: { targetUid }
  });
  
  return { ok: true };
}));
