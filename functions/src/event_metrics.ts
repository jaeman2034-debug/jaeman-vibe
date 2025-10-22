import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { wrapCall, wrapRun } from './sentry';

const db = admin.firestore();

async function computeFor(eventId: string) {
  const [atts, pres, pays, waits] = await Promise.all([
    db.collection(`events/${eventId}/attendees`).select().get(),
    db.collection(`events/${eventId}/presence`).select().get(),
    db.collection(`events/${eventId}/payments`).where('status', '==', 'paid').select().get(),
    db.collection(`events/${eventId}/waitlist`).select().get()
  ]);
  
  const attendeeCount = atts.size;
  const presentCount = pres.size;
  const paidCount = pays.size;
  const waitCount = waits.size;

  const noShowRate = attendeeCount ? ((attendeeCount - presentCount) / attendeeCount) : 0;
  const payConv = attendeeCount ? (paidCount / attendeeCount) : 0;

  await db.doc(`events/${eventId}/metrics/summary`).set({
    attendeeCount, 
    presentCount, 
    paidCount, 
    waitCount,
    noShowRate, 
    payConv,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { attendeeCount, presentCount, paidCount, waitCount, noShowRate, payConv };
}

export const recomputeEventMetrics = wrapCall('recomputeEventMetrics', async (data, ctx) => {
  const { eventId } = data as { eventId: string };
  if (!eventId) throw new functions.https.HttpsError('invalid-argument', 'eventId');
  return await computeFor(eventId);
});

export const scheduleMetrics = functions.pubsub
  .schedule('every 2 hours').timeZone('Asia/Seoul')
  .onRun(wrapRun('scheduleMetrics', async () => {
    const qs = await db.collection('events').select().limit(50).get();
    await Promise.all(qs.docs.map(d => computeFor(d.id)));
    return null;
  }));
