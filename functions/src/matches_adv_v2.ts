import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

const db = admin.firestore();

async function assertStaff(eventId: string, uid?: string) {
  if (!uid) throw new HttpsError('unauthenticated', 'login');
  const r = await db.doc(`events/${eventId}/roles/${uid}`).get();
  if (!r.exists || (r.data() as any)?.role !== 'staff') {
    throw new HttpsError('permission-denied', 'staff only');
  }
}

function seedPairs(ids: string[]) {
  // 1vs최후, 2vs차최후 … (짝수 맞추기 위해 BYE 추가)
  const arr = [...ids];
  const pow = 1 << Math.ceil(Math.log2(Math.max(2, arr.length)));
  while (arr.length < pow) arr.push('__BYE__');
  const out: [string, string][] = [];
  for (let i = 0; i < pow / 2; i++) {
    out.push([arr[i], arr[pow - 1 - i]]);
  }
  return out;
}

export const advanceTopToBracket = onCall(async (request) => {
  const { eventId, topN } = request.data as { eventId: string; topN: number };
  await assertStaff(eventId, request.auth?.uid);
  if (!topN || topN < 2) throw new HttpsError('invalid-argument', 'topN>=2');

  // standings 정렬: 승률(pct) → 득실(diff) → 득점(ptsFor)
  const st = await db.collection(`events/${eventId}/standings`).get();
  if (!st.size) throw new HttpsError('failed-precondition', 'standings empty');
  const rows = st.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
    .sort((a, b) => (b.pct || 0) - (a.pct || 0) || (b.diff || 0) - (a.diff || 0) || (b.ptsFor || 0) - (a.ptsFor || 0));

  const seeds = rows.slice(0, topN).map(r => r.id);
  if (seeds.length < 2) throw new HttpsError('failed-precondition', 'need >=2 teams');

  // 기존 bracket 초기화
  const old = await db.collection(`events/${eventId}/matches`).where('phase', '==', 'bracket').get();
  if (old.size) {
    const b = db.batch();
    old.docs.forEach(d => b.delete(d.ref));
    await b.commit();
  }

  const pairs = seedPairs(seeds);
  const batch = db.batch();
  pairs.forEach(([A, B], i) => {
    const ref = db.doc(`events/${eventId}/matches/R1_${i + 1}`);
    batch.set(ref, {
      phase: 'bracket',
      round: 1,
      order: i + 1,
      teamA: A,
      teamB: B,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  await batch.commit();
  return { ok: true, seeded: seeds.length, r1: pairs.length };
});
