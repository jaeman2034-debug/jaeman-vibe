import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { wrapCall } from './sentry';

const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();

async function assertStaff(eventId: string, uid?: string) {
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'login');
  const role = await db.doc(`events/${eventId}/roles/${uid}`).get();
  if (!role.exists) throw new functions.https.HttpsError('permission-denied', 'staff only');
}

function randCode(prefix: string) {
  const n = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(2, 8);
  return [prefix.toUpperCase(), n].join('-');
}

export const createCouponPool = functions.https.onCall(wrapCall('createCouponPool', async (data, ctx) => {
  const { eventId, prefix, count = 100, payload } = data as { 
    eventId: string; 
    prefix: string; 
    count: number; 
    payload: any 
  };
  await assertStaff(eventId, ctx.auth?.uid);
  
  if (!prefix || count < 1 || count > 5000) {
    throw new functions.https.HttpsError('invalid-argument', 'bad args');
  }

  const poolRef = await db.collection(`events/${eventId}/coupon_pools`).add({
    prefix: prefix.toUpperCase(), 
    count, 
    payload, 
    createdAt: now(), 
    createdBy: ctx.auth!.uid, 
    stats: { issued: 0, active: 0 }
  });

  let issued = 0;
  const batchLimit = 400;
  let batch = db.batch();
  
  for (let i = 0; i < count; i++) {
    const code = randCode(prefix);
    const codeRef = db.doc(`events/${eventId}/coupons/${code}`);
    batch.set(codeRef, {
      ...payload, 
      poolId: poolRef.id, 
      active: true, 
      usedCount: 0, 
      totalLimit: 1, 
      createdAt: now(), 
      createdBy: ctx.auth!.uid
    }, { merge: true });
    issued++;
    
    if (issued % batchLimit === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  
  await batch.commit();
  await poolRef.set({ stats: { issued, active: issued } }, { merge: true });
  
  return { ok: true, poolId: poolRef.id, issued };
}));
