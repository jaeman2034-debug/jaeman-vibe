import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

const db = admin.firestore();

async function assertStaff(eventId: string, uid?: string) {
  if (!uid) throw new HttpsError('unauthenticated', 'login');
  const r = await db.doc(`events/${eventId}/roles/${uid}`).get();
  if (!r.exists) throw new HttpsError('permission-denied', 'staff only');
}

export const moveAssignment = onCall(async (request) => {
  const { eventId, assignmentId, toCourtId, toOrder } = request.data as { 
    eventId: string; 
    assignmentId: string; 
    toCourtId: string; 
    toOrder?: number 
  };
  await assertStaff(eventId, request.auth?.uid);
  
  const aRef = db.doc(`events/${eventId}/court_assignments/${assignmentId}`);
  const a = (await aRef.get()).data() as any;
  if (!a) throw new HttpsError('not-found', 'assignment');
  if (a.status === 'running') throw new HttpsError('failed-precondition', 'running cannot move');

  // 대상 코트의 마지막 order+1 또는 지정 toOrder
  const qs = await db.collection(`events/${eventId}/court_assignments`)
    .where('courtId', '==', toCourtId)
    .orderBy('order')
    .get();
  const max = qs.size ? Math.max(...qs.docs.map(d => (d.data() as any).order || 0)) : 0;
  const newOrder = Math.max(1, Math.min(toOrder || max + 1, max + 1));

  await aRef.set({ courtId: toCourtId, order: newOrder }, { merge: true });
  return { ok: true };
});

export const reorderAssignment = onCall(async (request) => {
  const { eventId, courtId, orderMap } = request.data as { 
    eventId: string; 
    courtId: string; 
    orderMap: Record<string, number> 
  };
  await assertStaff(eventId, request.auth?.uid);
  
  const b = db.batch();
  Object.entries(orderMap).forEach(([id, ord]) => {
    b.set(db.doc(`events/${eventId}/court_assignments/${id}`), { order: ord }, { merge: true });
  });
  await b.commit();
  return { ok: true };
});
