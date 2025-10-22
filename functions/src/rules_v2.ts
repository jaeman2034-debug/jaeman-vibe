import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

const db = admin.firestore();

export const setRules = onCall(async (request) => {
  const { eventId, rules } = request.data as { eventId: string; rules: any };
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'login');
  
  const role = await db.doc(`events/${eventId}/roles/${request.auth.uid}`).get();
  if (!role.exists) throw new HttpsError('permission-denied', 'staff only');
  
  await db.doc(`events/${eventId}`).set({ rules }, { merge: true });
  return { ok: true };
});
