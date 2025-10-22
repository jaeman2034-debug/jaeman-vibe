import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

const db = admin.firestore();

type Att = { uid: string; level?: string; position?: string };
const LV = { Beginner: 1, Intermediate: 2, Advanced: 3 };

function scoreLevel(l?: string) { 
  return LV[l as keyof typeof LV] || 2; // 기본 Intermediate
}

export const suggestTeams = onCall(async (request) => {
  const { eventId, teamCount = 2 } = request.data as { eventId: string; teamCount?: number };
  if (!eventId || teamCount < 2 || teamCount > 12) {
    throw new HttpsError('invalid-argument', 'bad args');
  }

  const atts = await db.collection(`events/${eventId}/attendees`).select().get();
  const members: Att[] = atts.docs.map(d => ({ uid: d.id, ...(d.data() as any) }));

  // 포지션 기준 버킷 → 각 팀에 라운드로빈, 이후 레벨 균형 미세조정
  const buckets: Record<string, Att[]> = {};
  for (const a of members) {
    (buckets[a.position || 'ANY'] ||= []).push(a);
  }
  Object.values(buckets).forEach(arr => 
    arr.sort((x, y) => scoreLevel(y.level) - scoreLevel(x.level))
  );

  const teams: { uids: string[], sum: number }[] = Array.from({ length: teamCount }, () => ({ uids: [], sum: 0 }));

  // 1) 포지션 라운드로빈
  for (const key of Object.keys(buckets)) {
    let i = 0;
    for (const a of buckets[key]) {
      teams[i % teamCount].uids.push(a.uid);
      teams[i % teamCount].sum += scoreLevel(a.level);
      i++;
    }
  }
  // 2) 레벨 균형: 높은 레벨이 많은 팀에서 낮은 팀으로 일부 스왑(가벼운 그리디)
  teams.sort((a, b) => a.sum - b.sum);
  // (간단히 정렬만으로 균형 가정 — v1)

  return { teams: teams.map((t, i) => ({ name: `팀 ${i + 1}`, uids: t.uids })) };
});

export const saveTeams = onCall(async (request) => {
  const { eventId, teams } = request.data as { 
    eventId: string; 
    teams: { name: string; uids: string[]; color?: string }[] 
  };
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'login');
  
  const role = await db.doc(`events/${eventId}/roles/${request.auth.uid}`).get();
  if (!role.exists) throw new HttpsError('permission-denied', 'staff only');

  // 삭제 후 재작성(단순화)
  const cur = await db.collection(`events/${eventId}/teams`).get();
  const batch = db.batch();
  cur.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();

  for (const t of teams) {
    const tRef = await db.collection(`events/${eventId}/teams`).add({ 
      name: t.name, 
      color: t.color || null, 
      createdAt: admin.firestore.FieldValue.serverTimestamp() 
    });
    const b = db.batch();
    for (const uid of (t.uids || [])) {
      b.set(db.doc(`events/${eventId}/teams/${tRef.id}/members/${uid}`), { 
        at: admin.firestore.FieldValue.serverTimestamp() 
      }, { merge: true });
    }
    await b.commit();
  }
  return { ok: true };
});
