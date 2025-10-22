import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();

async function assertStaff(eventId: string, uid?: string) {
  if (!uid) throw new HttpsError('unauthenticated', 'login');
  const r = await db.doc(`events/${eventId}/roles/${uid}`).get();
  if (!r.exists) throw new HttpsError('permission-denied', 'staff only');
}

// 코트 생성/수정
export const upsertCourt = onCall(async (request) => {
  const { eventId, courtId, name, pin, active = true } = request.data as { 
    eventId: string; 
    courtId?: string; 
    name: string; 
    pin?: string; 
    active?: boolean 
  };
  await assertStaff(eventId, request.auth?.uid);
  
  const ref = courtId
    ? db.doc(`events/${eventId}/courts/${courtId}`)
    : db.collection(`events/${eventId}/courts`).doc();
  
  await ref.set({ 
    name, 
    pin: pin || null, 
    active, 
    createdAt: now() 
  }, { merge: true });
  
  return { ok: true, courtId: ref.id };
});

// 배정(매치를 특정 코트 큐에 push)
export const assignMatchToCourt = onCall(async (request) => {
  const { eventId, matchId, courtId } = request.data as { 
    eventId: string; 
    matchId: string; 
    courtId: string 
  };
  await assertStaff(eventId, request.auth?.uid);
  
  const mref = db.doc(`events/${eventId}/matches/${matchId}`);
  const cref = db.doc(`events/${eventId}/courts/${courtId}`);
  const [m, c] = await Promise.all([mref.get(), cref.get()]);
  
  if (!m.exists) throw new HttpsError('not-found', 'match');
  if (!c.exists) throw new HttpsError('not-found', 'court');

  const qs = await db.collection(`events/${eventId}/court_assignments`)
    .where('courtId', '==', courtId)
    .get();
  const order = qs.size + 1;

  const aRef = db.collection(`events/${eventId}/court_assignments`).doc();
  await aRef.set({ 
    courtId, 
    matchId, 
    status: 'queued', 
    order, 
    createdAt: now() 
  });
  await mref.set({ table: courtId }, { merge: true });
  
  return { ok: true, assignmentId: aRef.id, order };
});

// 시작(해당 코트에 running 하나만 허용)
export const startAssignment = onCall(async (request) => {
  const { eventId, assignmentId, pin } = request.data as { 
    eventId: string; 
    assignmentId: string; 
    pin?: string 
  };
  
  // 스태프 OR 심판 OR 코트 PIN — 셋 중 하나면 허용
  const aRef = db.doc(`events/${eventId}/court_assignments/${assignmentId}`);
  const a = (await aRef.get()).data() as any;
  if (!a) throw new HttpsError('not-found', 'assignment');
  
  const court = (await db.doc(`events/${eventId}/courts/${a.courtId}`).get()).data() as any;
  const roleDoc = request.auth?.uid ? 
    await db.doc(`events/${eventId}/roles/${request.auth.uid}`).get() : null;
  const role = roleDoc?.data()?.role;
  const isAllowed = role === 'staff' || role === 'ref' || (!!court?.pin && court.pin === pin);
  
  if (!isAllowed) {
    throw new HttpsError('permission-denied', 'need ref/staff or pin');
  }

  // 같은 코트 running 있으면 막기
  const running = await db.collection(`events/${eventId}/court_assignments`)
    .where('courtId', '==', a.courtId)
    .where('status', '==', 'running')
    .limit(1)
    .get();
  
  if (!running.empty) {
    throw new HttpsError('failed-precondition', 'already running');
  }

  await db.runTransaction(async tx => {
    tx.set(aRef, { status: 'running', startedAt: now() }, { merge: true });
    tx.set(db.doc(`events/${eventId}/matches/${a.matchId}`), { 
      status: 'running', 
      startAt: now(), 
      table: a.courtId 
    }, { merge: true });
  });
  
  return { ok: true };
});

// 완료(스코어 입력은 클라에서 reportMatch 호출 후 → 완료 처리)
export const completeAssignment = onCall(async (request) => {
  const { eventId, assignmentId, pin } = request.data as { 
    eventId: string; 
    assignmentId: string; 
    pin?: string 
  };
  
  const aRef = db.doc(`events/${eventId}/court_assignments/${assignmentId}`);
  const a = (await aRef.get()).data() as any;
  if (!a) throw new HttpsError('not-found', 'assignment');
  
  const court = (await db.doc(`events/${eventId}/courts/${a.courtId}`).get()).data() as any;
  const roleDoc = request.auth?.uid ? 
    await db.doc(`events/${eventId}/roles/${request.auth.uid}`).get() : null;
  const role = roleDoc?.data()?.role;
  const isAllowed = role === 'staff' || role === 'ref' || (!!court?.pin && court.pin === pin);
  
  if (!isAllowed) {
    throw new HttpsError('permission-denied', 'need ref/staff or pin');
  }

  await db.runTransaction(async tx => {
    tx.set(aRef, { status: 'done', endedAt: now() }, { merge: true });
    tx.set(db.doc(`events/${eventId}/matches/${a.matchId}`), { 
      status: 'done', 
      endAt: now() 
    }, { merge: true });
  });
  
  return { ok: true };
});

// 큐 제거
export const removeAssignment = onCall(async (request) => {
  const { eventId, assignmentId } = request.data as { 
    eventId: string; 
    assignmentId: string 
  };
  await assertStaff(eventId, request.auth?.uid);
  await db.doc(`events/${eventId}/court_assignments/${assignmentId}`).delete();
  return { ok: true };
});
