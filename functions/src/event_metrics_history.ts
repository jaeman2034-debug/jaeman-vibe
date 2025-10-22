import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { wrapCall, wrapRun } from './sentry';

const db = admin.firestore();

function dkey(d: Date) { 
  const y = d.getFullYear(), m = (d.getMonth() + 1 + '').padStart(2, '0'), day = (d.getDate() + '').padStart(2, '0'); 
  return `${y}-${m}-${day}`; 
}

async function computeDay(eventId: string, day: Date) {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0);
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
  const ts = admin.firestore.Timestamp;

  const [atts, pres, pays, waits] = await Promise.all([
    db.collection(`events/${eventId}/attendees`).where('joinedAt', '>=', ts.fromDate(start)).where('joinedAt', '<=', ts.fromDate(end)).get().catch(() => ({ size: 0 } as any)),
    db.collection(`events/${eventId}/presence`).where('checkedInAt', '>=', ts.fromDate(start)).where('checkedInAt', '<=', ts.fromDate(end)).get().catch(() => ({ size: 0 } as any)),
    db.collection(`events/${eventId}/payments`).where('status', '==', 'paid').where('approvedAt', '>=', ts.fromDate(start)).where('approvedAt', '<=', ts.fromDate(end)).get().catch(() => ({ size: 0 } as any)),
    db.collection(`events/${eventId}/waitlist`).where('joinedAt', '>=', ts.fromDate(start)).where('joinedAt', '<=', ts.fromDate(end)).get().catch(() => ({ size: 0 } as any)),
  ]);

  const docRef = db.doc(`events/${eventId}/metrics/history/${dkey(day)}`);
  await docRef.set({
    date: dkey(day),
    attendees: atts.size,
    presence: pres.size,
    paid: pays.size,
    wait: waits.size,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

async function computeRange(eventId: string, days = 30) {
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today); 
    d.setDate(today.getDate() - i);
    await computeDay(eventId, d);
  }
}

export const recomputeEventHistory = wrapCall('recomputeEventHistory', async (data) => {
  const { eventId, days = 30 } = data as { eventId: string; days?: number };
  if (!eventId) throw new functions.https.HttpsError('invalid-argument', 'eventId');
  await computeRange(eventId, Math.min(days, 90));
  return { ok: true };
});

export const scheduleEventHistory = functions.pubsub
  .schedule('every 1 hours').timeZone('Asia/Seoul')
  .onRun(wrapRun('scheduleEventHistory', async () => {
    const qs = await db.collection('events').select().limit(50).get();
    await Promise.all(qs.docs.map(d => computeRange(d.id, 3))); // 최근 3일 롤링 갱신
    return null;
  }));
