import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

const db = admin.firestore();

export const updateLiveScore = onCall(async (request) => {
  const { eventId, matchId, a, b } = request.data as { 
    eventId: string; 
    matchId: string; 
    a: number; 
    b: number 
  };
  // ref 허용
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'login');
  const r = await db.doc(`events/${eventId}/roles/${request.auth.uid}`).get();
  const role = r.data()?.role;
  if (!(role === 'staff' || role === 'ref')) {
    throw new HttpsError('permission-denied', 'ref/staff only');
  }
  
  await db.doc(`events/${eventId}/matches/${matchId}`).set({ liveA: a, liveB: b }, { merge: true });
  return { ok: true };
});
