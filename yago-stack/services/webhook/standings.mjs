import admin from 'firebase-admin';

const db = admin.firestore();

const K = Number(process.env.ELO_K || 20);
const BASE = Number(process.env.ELO_BASE || 1500);

export async function updateStandingsAndRatings({ clubId, fixtureId }) {
  try {
    // 경기 정보 조회
    const fref = db.doc(`clubs/${clubId}/fixtures/${fixtureId}`);
    const f = (await fref.get()).data();
    if (!f) return;

    // 리포트 정보 조회
    const rref = db.doc(`clubs/${clubId}/fixtures/${fixtureId}/report`);
    const rep = (await rref.get()).data();
    if (!rep) return;

    // 1) Standings aggregate
    const div = f.divisionId || 'default';
    const tcol = db.collection(`clubs/${clubId}/divisions/${div}/table`);
    
    async function getRow(teamId) {
      const d = await tcol.doc(teamId).get();
      return d.exists ? d.data() : {
        teamId,
        played: 0,
        win: 0,
        draw: 0,
        loss: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0
      };
    }

    const home = await getRow(f.homeTeamId);
    const away = await getRow(f.awayTeamId);
    const sH = Number(rep.score?.home || 0);
    const sA = Number(rep.score?.away || 0);

    // 중복 적용 방지: 마커 확인
    const mark = await tcol.doc(`__applied_${fixtureId}`).get();
    if (!mark.exists) {
      home.played++;
      away.played++;
      home.gf += sH;
      home.ga += sA;
      home.gd = home.gf - home.ga;
      away.gf += sA;
      away.ga += sH;
      away.gd = away.gf - away.ga;

      if (sH > sA) {
        home.win++;
        home.pts += 3;
        away.loss++;
      } else if (sH < sA) {
        away.win++;
        away.pts += 3;
        home.loss++;
      } else {
        home.draw++;
        away.draw++;
        home.pts++;
        away.pts++;
      }

      await tcol.doc(home.teamId).set(home);
      await tcol.doc(away.teamId).set(away);
      await tcol.doc(`__applied_${fixtureId}`).set({ at: Date.now() });
    }

    // 2) Elo ratings
    const rcol = db.collection(`clubs/${clubId}/divisions/${div}/ratings`);
    
    async function getRating(team) {
      const d = await rcol.doc(team).get();
      return d.exists ? d.data().rating : BASE;
    }

    let Ra = await getRating(f.homeTeamId);
    let Rb = await getRating(f.awayTeamId);
    
    const Ea = 1 / (1 + Math.pow(10, (Rb - Ra) / 400));
    const Eb = 1 - Ea;
    
    let Sa = 0.5, Sb = 0.5;
    if (sH > sA) {
      Sa = 1;
      Sb = 0;
    } else if (sH < sA) {
      Sa = 0;
      Sb = 1;
    }

    Ra = Ra + K * (Sa - Ea);
    Rb = Rb + K * (Sb - Eb);

    await rcol.doc(f.homeTeamId).set({
      rating: Math.round(Ra),
      updatedAt: Date.now()
    });
    await rcol.doc(f.awayTeamId).set({
      rating: Math.round(Rb),
      updatedAt: Date.now()
    });

  } catch (e) {
    console.error('[standings-update]', e);
    throw e;
  }
}

export async function getTable({ clubId, divisionId }) {
  try {
    const col = await db.collection(`clubs/${clubId}/divisions/${divisionId}/table`).get();
    const rows = col.docs
      .filter(d => !d.id.startsWith('__applied_'))
      .map(d => d.data());
    
    rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    return rows;
  } catch (e) {
    console.error('[table-get]', e);
    return [];
  }
}

export async function getRatings({ clubId, divisionId }) {
  try {
    const col = await db.collection(`clubs/${clubId}/divisions/${divisionId}/ratings`).get();
    return col.docs.map(d => ({
      teamId: d.id,
      rating: d.data().rating,
      updatedAt: d.data().updatedAt
    }));
  } catch (e) {
    console.error('[ratings-get]', e);
    return [];
  }
}

// 순위 초기화 (디비전별)
export async function resetTable({ clubId, divisionId }) {
  try {
    const col = db.collection(`clubs/${clubId}/divisions/${divisionId}/table`);
    const snapshot = await col.get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return { ok: true };
  } catch (e) {
    console.error('[table-reset]', e);
    throw e;
  }
}

// Elo 초기화 (디비전별)
export async function resetRatings({ clubId, divisionId }) {
  try {
    const col = db.collection(`clubs/${clubId}/divisions/${divisionId}/ratings`);
    const snapshot = await col.get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return { ok: true };
  } catch (e) {
    console.error('[ratings-reset]', e);
    throw e;
  }
}
