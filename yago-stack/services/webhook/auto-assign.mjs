import admin from 'firebase-admin';

const db = admin.firestore();

function intersects(a, b) {
  return Math.max(a.startAt, b.startAt) < Math.min(a.endAt, b.endAt);
}

function restOk(lastEnd, startAt, minRestMin) {
  return (startAt - (lastEnd || 0)) >= (minRestMin * 60 * 1000);
}

async function fetchOfficials(clubId) {
  const col = await db.collection(`clubs/${clubId}/officials`).where('active', '!=', false).get();
  return col.docs.map(d => d.data());
}

async function fetchAvailability(clubId, uid, from, to) {
  const y1 = `${new Date(from).getFullYear()}${String(new Date(from).getMonth() + 1).padStart(2, '0')}`;
  const y2 = `${new Date(to).getFullYear()}${String(new Date(to).getMonth() + 1).padStart(2, '0')}`;
  const docs = [];
  
  for (const y of new Set([y1, y2])) {
    const snap = await db.doc(`clubs/${clubId}/officials/${uid}/availability/${y}`).get();
    if (snap.exists) {
      docs.push(snap.data());
    }
  }
  
  return docs.flatMap(x => x.slots || [])
    .filter(s => s.status !== 'unavailable' && s.endAt >= from && s.startAt <= to);
}

export async function recommendAssignments({ clubId, fixtureIds, minRestMin = 30 }) {
  try {
    // 1) 경기 정보 불러오기
    const fixtures = [];
    for (const id of fixtureIds) {
      const f = (await db.doc(`clubs/${clubId}/fixtures/${id}`).get()).data();
      if (f) fixtures.push(f);
    }
    fixtures.sort((a, b) => a.startAt - b.startAt);
    
    const officials = await fetchOfficials(clubId);
    
    // 이미 배정된 것 로드
    const assignedByUid = new Map(); // uid -> [{startAt,endAt}]
    
    async function loadAssigned(fid) {
      const col = await db.collection(`clubs/${clubId}/fixtures/${fid}/assignments`).get();
      return col.docs.map(d => d.data());
    }
    
    // 2) 각 경기별로 역할 채우는 그리디
    const out = {}; // fid -> [ { uid, role, score } ]
    
    for (const f of fixtures) {
      const need = ['referee', 'ar1', 'ar2']; // 간단 기본
      const cur = await loadAssigned(f.id);
      const taken = new Set(cur.map(x => x.uid));
      const used = [];
      
      for (const role of need) {
        // 후보 점수화: 가용성 겹침 + 휴식 + 선호역할 + 현재 배정 건수 밸런스
        let best = null;
        let bestScore = -1;
        
        for (const o of officials) {
          if (taken.has(o.uid)) continue;
          
          const av = await fetchAvailability(clubId, o.uid, f.startAt - 2 * 60 * 60 * 1000, f.endAt + 2 * 60 * 60 * 1000);
          const ok = av.some(s => intersects({ startAt: f.startAt, endAt: f.endAt }, s));
          if (!ok) continue;
          
          const last = (assignedByUid.get(o.uid) || []).sort((a, b) => b.endAt - a.endAt)[0]?.endAt;
          if (!restOk(last, f.startAt, minRestMin)) continue;
          
          const prefRoleBonus = (o?.preferences?.roles || []).includes(role) ? 10 : 0;
          const loadPenalty = (assignedByUid.get(o.uid) || []).length; // 많이 배정된 사람은 점수 낮춤
          const score = 50 + prefRoleBonus - loadPenalty * 2;
          
          if (score > bestScore) {
            bestScore = score;
            best = o;
          }
        }
        
        if (best) {
          used.push({ uid: best.uid, role, score: bestScore });
          const arr = assignedByUid.get(best.uid) || [];
          arr.push({ startAt: f.startAt, endAt: f.endAt });
          assignedByUid.set(best.uid, arr);
        }
      }
      
      out[f.id] = used;
    }
    
    return out;
  } catch (e) {
    console.error('[auto-assign]', e);
    throw e;
  }
}

export async function commitAssignments({ clubId, suggestions }) {
  try {
    for (const [fid, items] of Object.entries(suggestions)) {
      const batch = db.batch();
      for (const it of items) {
        const ref = db.doc(`clubs/${clubId}/fixtures/${fid}/assignments/${it.uid}`);
        batch.set(ref, {
          uid: it.uid,
          role: it.role,
          assignedAt: Date.now(),
          score: it.score
        });
      }
      await batch.commit();
    }
    return { ok: true };
  } catch (e) {
    console.error('[commit-assignments]', e);
    throw e;
  }
}

// 배정 충돌 검사
export async function checkConflicts({ clubId, fixtureId, uid, startAt, endAt }) {
  try {
    const col = await db.collection(`clubs/${clubId}/fixtures/${fixtureId}/assignments`).get();
    const assignments = col.docs.map(d => d.data());
    
    // 같은 시간대 다른 경기 배정 확인
    const fixturesCol = await db.collection(`clubs/${clubId}/fixtures`)
      .where('startAt', '>=', startAt - 2 * 60 * 60 * 1000)
      .where('startAt', '<=', endAt + 2 * 60 * 60 * 1000)
      .get();
    
    const conflicts = [];
    for (const fDoc of fixturesCol.docs) {
      const f = fDoc.data();
      if (f.id === fixtureId) continue;
      
      const fAssignments = await db.collection(`clubs/${clubId}/fixtures/${f.id}/assignments`).get();
      const fAssigned = fAssignments.docs.map(d => d.data());
      
      if (fAssigned.some(a => a.uid === uid)) {
        conflicts.push({
          fixtureId: f.id,
          startAt: f.startAt,
          endAt: f.endAt,
          homeTeamId: f.homeTeamId,
          awayTeamId: f.awayTeamId
        });
      }
    }
    
    return { conflicts };
  } catch (e) {
    console.error('[check-conflicts]', e);
    throw e;
  }
}
