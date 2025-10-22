import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { wrapCall } from './sentry';

const db = admin.firestore();

export const computeSettlement = functions.https.onCall(wrapCall('computeSettlement', async (data, ctx) => {
  const { eventId } = data as { eventId: string };
  if (!eventId) throw new functions.https.HttpsError('invalid-argument', 'eventId');
  
  // 스태프만
  const role = await db.doc(`events/${eventId}/roles/${ctx.auth?.uid}`).get();
  if (!role.exists) throw new functions.https.HttpsError('permission-denied', 'staff only');

  const pays = await db.collection(`events/${eventId}/payments`).select().get();
  let gross = 0, discount = 0, paid = 0, canceled = 0, failed = 0;
  
  for (const d of pays.docs) {
    const p = d.data() as any;
    gross += p.amount || 0;
    discount += p.discount || 0;
    if (p.status === 'paid') paid += (p.amount || 0) - (p.discount || 0);
    if (p.status === 'canceled') canceled += (p.amount || 0) - (p.discount || 0);
    if (p.status === 'failed') failed += (p.amount || 0) - (p.discount || 0);
  }
  
  const net = paid - canceled;
  return { gross, discount, paid, canceled, failed, net, count: pays.size };
}));
