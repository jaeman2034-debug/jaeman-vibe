import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();

async function assertStaff(eventId: string, uid?: string) {
  if (!uid) throw new HttpsError('unauthenticated', 'login');
  const r = await db.doc(`events/${eventId}/roles/${uid}`).get();
  if (!r.exists) throw new HttpsError('permission-denied', 'staff only');
}

/** 라운드로빈 페어링(Circle Method) */
function roundRobinPairs(teamIds: string[], repeat = 1) {
  const teams = [...teamIds];
  if (teams.length % 2 === 1) teams.push('__BYE__');
  const n = teams.length;
  const rounds: any[] = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const A = teams[i], B = teams[n - 1 - i];
      if (A !== '__BYE__' && B !== '__BYE__') pairs.push([A, B]);
    }
    rounds.push(pairs);
    // rotate
    const fixed = teams[0];
    const tail = teams.slice(1);
    tail.unshift(tail.pop()!);
    teams.splice(0, teams.length, fixed, ...tail);
  }
  // repeat 회차 반복 (홈/어웨이 뒤집기)
  const out: [string, string, number][] = [];
  for (let k = 0; k < repeat; k++) {
    rounds.forEach((ps, ri) => {
      ps.forEach(([a, b], oi) => {
        out.push(k % 2 === 0 ? [a, b, ri + 1 + (n - 1) * k] : [b, a, ri + 1 + (n - 1) * k]);
      });
    });
  }
  return out; // [teamA, teamB, round]
}

/** 싱글 엘림 브래킷(2의 거듭제곱 미만은 BYE) */
function seedSingleElim(teamIds: string[]) {
  const n = teamIds.length;
  const pow = 1 << Math.ceil(Math.log2(Math.max(2, n)));
  const seeds = [...teamIds];
  while (seeds.length < pow) seeds.push('__BYE__');
  // 간단 시딩(1-vs-last)
  const pairing: [string, string][] = [];
  for (let i = 0; i < pow / 2; i++) {
    pairing.push([seeds[i], seeds[pow - 1 - i]]);
  }
  return pairing;
}

export const generateRoundRobin = onCall(async (request) => {
  const { eventId, repeat = 1 } = request.data as { eventId: string; repeat?: number };
  await assertStaff(eventId, request.auth?.uid);

  const teams = await db.collection(`events/${eventId}/teams`).get();
  const teamIds = teams.docs.map(d => d.id);
  if (teamIds.length < 2) throw new HttpsError('failed-precondition', '팀이 2개 이상 필요합니다');

  // 기존 그룹 매치 삭제
  const old = await db.collection(`events/${eventId}/matches`).where('phase', '==', 'group').get();
  if (old.size) {
    const b = db.batch();
    old.docs.forEach(d => b.delete(d.ref));
    await b.commit();
  }

  const pairs = roundRobinPairs(teamIds, repeat); // [A,B,round]
  let order = 1;
  const batch = db.batch();
  for (const [A, B, round] of pairs) {
    const ref = db.collection(`events/${eventId}/matches`).doc();
    batch.set(ref, {
      phase: 'group',
      round,
      order: order++,
      teamA: A,
      teamB: B,
      status: 'pending',
      createdAt: now()
    });
  }
  await batch.commit();
  return { ok: true, count: pairs.length };
});

export const generateSingleElim = onCall(async (request) => {
  const { eventId } = request.data as { eventId: string };
  await assertStaff(eventId, request.auth?.uid);

  const teams = await db.collection(`events/${eventId}/teams`).get();
  const teamIds = teams.docs.map(d => d.id);
  if (teamIds.length < 2) throw new HttpsError('failed-precondition', '팀이 2개 이상 필요합니다');

  // 기존 브래킷 삭제
  const old = await db.collection(`events/${eventId}/matches`).where('phase', '==', 'bracket').get();
  if (old.size) {
    const b = db.batch();
    old.docs.forEach(d => b.delete(d.ref));
    await b.commit();
  }

  const P = seedSingleElim(teamIds); // [A,B]
  let order = 1;
  const batch = db.batch();
  P.forEach(([A, B], i) => {
    const ref = db.collection(`events/${eventId}/matches`).doc(`R1_${i + 1}`);
    batch.set(ref, {
      phase: 'bracket',
      round: 1,
      order: order++,
      teamA: A,
      teamB: B,
      status: 'pending',
      createdAt: now()
    });
  });
  await batch.commit();
  return { ok: true, count: P.length };
});

/** 스코어 입력/수정 → standings 갱신, 브래킷 승자 승급 */
export const reportMatch = onCall(async (request) => {
  const { eventId, matchId, scoreA, scoreB } = request.data as { 
    eventId: string; 
    matchId: string; 
    scoreA: number; 
    scoreB: number 
  };
  // reportMatch 권한
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'login');
  const roleDoc = await db.doc(`events/${eventId}/roles/${request.auth.uid}`).get();
  const role = roleDoc.data()?.role;
  if (!(role === 'staff' || role === 'ref')) {
    throw new HttpsError('permission-denied', 'ref/staff only');
  }

  const mref = db.doc(`events/${eventId}/matches/${matchId}`);
  const m = (await mref.get()).data() as any;
  if (!m) throw new HttpsError('not-found', 'match not found');

  const isBye = (id: string) => id === '__BYE__';
  
  // 이벤트 규칙 로드
  const ev = (await db.doc(`events/${eventId}`).get()).data() as any;
  const rules = ev?.rules || { mode: 'points', winPts: 3, drawPts: 1, lossPts: 0 };

  let winner = null as string | null;
  let ptsA = 0, ptsB = 0;

  if (Array.isArray((request.data as any).setsA) && Array.isArray((request.data as any).setsB)) {
    // 세트제: setsA=[25,18,15], setsB=[20,25,13] 처럼 길이 동일
    const setsA: number[] = (request.data as any).setsA;
    const setsB: number[] = (request.data as any).setsB;
    let wa = 0, wb = 0;
    for (let i = 0; i < Math.min(setsA.length, setsB.length); i++) {
      if (setsA[i] > setsB[i]) wa++;
      else if (setsB[i] > setsA[i]) wb++;
    }
    if (wa > wb) winner = m.teamA;
    else if (wb > wa) winner = m.teamB;
    else winner = null;
  } else {
    // 점수제(한 경기 점수)
    const a = Number(scoreA || 0);
    const b = Number(scoreB || 0);
    if (a > b) { 
      winner = m.teamA; 
      ptsA = rules.winPts ?? 3; 
      ptsB = rules.lossPts ?? 0; 
    } else if (b > a) { 
      winner = m.teamB; 
      ptsB = rules.winPts ?? 3; 
      ptsA = rules.lossPts ?? 0; 
    } else { 
      winner = null; 
      ptsA = rules.drawPts ?? 1; 
      ptsB = rules.drawPts ?? 1; 
    }
  }

  await db.runTransaction(async tx => {
    tx.set(mref, {
      scoreA,
      scoreB,
      setsA: (request.data as any).setsA || null,
      setsB: (request.data as any).setsB || null,
      status: 'done',
      endAt: now(),
      winner: winner || null
    }, { merge: true });

    // 그룹 스탠딩 반영
    if (m.phase === 'group' && m.teamA !== '__BYE__' && m.teamB !== '__BYE__') {
      const upd = (tid: string, forP: number, agP: number, w: number, l: number, d: number, pts: number) => {
        const sref = db.doc(`events/${eventId}/standings/${tid}`);
        tx.set(sref, {
          win: admin.firestore.FieldValue.increment(w),
          loss: admin.firestore.FieldValue.increment(l),
          draw: admin.firestore.FieldValue.increment(d),
          ptsFor: admin.firestore.FieldValue.increment(forP),
          ptsAgainst: admin.firestore.FieldValue.increment(agP),
          diff: admin.firestore.FieldValue.increment(forP - agP),
          played: admin.firestore.FieldValue.increment(1),
          points: admin.firestore.FieldValue.increment(pts || 0),
          lastUpdated: now()
        }, { merge: true });
      };

      if (Array.isArray((request.data as any).setsA)) {
        // 세트제: for/against는 세트 득점 총합 집계(선택), 승패/무만 반영
        const SA = ((request.data as any).setsA as number[]).reduce((x: number, y: number) => x + y, 0);
        const SB = ((request.data as any).setsB as number[]).reduce((x: number, y: number) => x + y, 0);
        if (winner === m.teamA) { 
          upd(m.teamA, SA, SB, 1, 0, 0, 0); 
          upd(m.teamB, SB, SA, 0, 1, 0, 0); 
        } else if (winner === m.teamB) { 
          upd(m.teamB, SB, SA, 1, 0, 0, 0); 
          upd(m.teamA, SA, SB, 0, 1, 0, 0); 
        } else { 
          upd(m.teamA, SA, SB, 0, 0, 1, 0); 
          upd(m.teamB, SB, SA, 0, 0, 1, 0); 
        }
      } else {
        // 승점제
        const a = Number(scoreA || 0);
        const b = Number(scoreB || 0);
        if (a > b) { 
          upd(m.teamA, a, b, 1, 0, 0, ptsA); 
          upd(m.teamB, b, a, 0, 1, 0, ptsB); 
        } else if (b > a) { 
          upd(m.teamB, b, a, 1, 0, 0, ptsB); 
          upd(m.teamA, a, b, 0, 1, 0, ptsA); 
        } else { 
          upd(m.teamA, a, b, 0, 0, 1, ptsA); 
          upd(m.teamB, b, a, 0, 0, 1, ptsB); 
        }
      }
    }

    // 브래킷 승급(단순 라운드1만 ⇒ v2에서 라운드 n 지원)
    if (m.phase === 'bracket' && m.round === 1 && winner && !isBye(winner)) {
      // 예: R1_1 승자 vs R1_2 승자 → R2_1
      const idx = Number(String(matchId).split('_')[1]) || 1;
      const nextIdx = Math.ceil(idx / 2);
      const slot = idx % 2 === 1 ? 'A' : 'B';
      const nextId = `R2_${nextIdx}`;
      const nextRef = db.doc(`events/${eventId}/matches/${nextId}`);
      tx.set(nextRef, {
        phase: 'bracket',
        round: 2,
        order: 100 + nextIdx,
        status: 'pending',
        [`team${slot}`]: winner,
        createdAt: now()
      }, { merge: true });
    }
  });

  return { ok: true, winner: winner || null };
});

/** 전체 스탠딩 재계산(멱등) */
export const recomputeStandings = onCall(async (request) => {
  const { eventId } = request.data as { eventId: string };
  await assertStaff(eventId, request.auth?.uid);

  // 초기화
  const st = await db.collection(`events/${eventId}/standings`).get();
  if (st.size) {
    const b = db.batch();
    st.docs.forEach(d => b.delete(d.ref));
    await b.commit();
  }

  const matches = await db.collection(`events/${eventId}/matches`)
    .where('phase', '==', 'group')
    .where('status', '==', 'done')
    .get();
  const map = new Map<string, { w: number; l: number; d: number; pf: number; pa: number }>();
  
  for (const d of matches.docs) {
    const m = d.data() as any;
    const A = m.teamA, B = m.teamB, a = m.scoreA || 0, b = m.scoreB || 0;
    if (A === '__BYE__' || B === '__BYE__') continue;
    const RA = map.get(A) || { w: 0, l: 0, d: 0, pf: 0, pa: 0 };
    const RB = map.get(B) || { w: 0, l: 0, d: 0, pf: 0, pa: 0 };
    RA.pf += a; RA.pa += b; RB.pf += b; RB.pa += a;
    if (a > b) { RA.w++; RB.l++; } else if (b > a) { RB.w++; RA.l++; } else { RA.d++; RB.d++; }
    map.set(A, RA); map.set(B, RB);
  }
  
  const batch = db.batch();
  for (const [tid, s] of map) {
    const ref = db.doc(`events/${eventId}/standings/${tid}`);
    const played = s.w + s.l + s.d;
    const diff = s.pf - s.pa;
    const pct = played ? (s.w + 0.5 * s.d) / played : 0;
    batch.set(ref, {
      win: s.w,
      loss: s.l,
      draw: s.d,
      ptsFor: s.pf,
      ptsAgainst: s.pa,
      diff,
      played,
      pct,
      lastUpdated: now()
    });
  }
  await batch.commit();
  return { ok: true, teams: map.size };
});
