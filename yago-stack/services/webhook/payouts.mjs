import admin from 'firebase-admin';
import { Parser as CsvParser } from 'json2csv';

const db = admin.firestore();

async function getRates(clubId) {
  const doc = await db.doc(`clubs/${clubId}/payoutRules/roles`).get();
  const items = doc.exists ? (doc.data()?.items || []) : [
    { role: 'referee', amountKRW: 50000 },
    { role: 'ar1', amountKRW: 30000 },
    { role: 'ar2', amountKRW: 30000 },
    { role: 'table', amountKRW: 20000 },
    { role: 'umpire', amountKRW: 25000 }
  ];
  const map = new Map(items.map(x => [x.role, Number(x.amountKRW || 0)]));
  return map;
}

export async function aggregatePayouts({ clubId, from, to }) {
  try {
    const rates = await getRates(clubId);
    const fx = await db.collection(`clubs/${clubId}/fixtures`)
      .where('startAt', '>=', from)
      .where('startAt', '<=', to)
      .get();
    
    const lines = [];
    
    for (const d of fx.docs) {
      const f = d.data();
      const rep = (await db.doc(`clubs/${clubId}/fixtures/${f.id}/report`).get()).data();
      if (!rep || !rep.locked) continue; // 확정된 경기만 정산
      
      const asg = await db.collection(`clubs/${clubId}/fixtures/${f.id}/assignments`).get();
      for (const a of asg.docs) {
        const it = a.data();
        const amt = rates.get(it.role) || 0;
        lines.push({
          uid: it.uid,
          role: it.role,
          fixtureId: f.id,
          when: f.startAt,
          amount: amt,
          homeTeamId: f.homeTeamId,
          awayTeamId: f.awayTeamId
        });
      }
    }
    
    // 집계
    const by = new Map();
    for (const l of lines) {
      const k = l.uid;
      if (!by.has(k)) {
        by.set(k, { uid: k, total: 0, matches: 0, roles: {} });
      }
      const r = by.get(k);
      r.total += l.amount;
      r.matches++;
      r.roles[l.role] = (r.roles[l.role] || 0) + 1;
    }
    
    return { lines, summary: Array.from(by.values()) };
  } catch (e) {
    console.error('[aggregate-payouts]', e);
    throw e;
  }
}

export async function payoutCsv({ clubId, from, to }) {
  try {
    const { lines } = await aggregatePayouts({ clubId, from, to });
    const csv = new CsvParser({
      fields: ['uid', 'role', 'fixtureId', 'when', 'amount', 'homeTeamId', 'awayTeamId']
    }).parse(lines);
    return csv;
  } catch (e) {
    console.error('[payout-csv]', e);
    throw e;
  }
}

// 수당 규칙 설정
export async function setPayoutRules({ clubId, rules }) {
  try {
    const ref = db.doc(`clubs/${clubId}/payoutRules/roles`);
    await ref.set({ items: rules }, { merge: true });
    return { ok: true };
  } catch (e) {
    console.error('[set-payout-rules]', e);
    throw e;
  }
}

// 수당 규칙 조회
export async function getPayoutRules({ clubId }) {
  try {
    const doc = await db.doc(`clubs/${clubId}/payoutRules/roles`).get();
    const items = doc.exists ? (doc.data()?.items || []) : [
      { role: 'referee', amountKRW: 50000 },
      { role: 'ar1', amountKRW: 30000 },
      { role: 'ar2', amountKRW: 30000 },
      { role: 'table', amountKRW: 20000 },
      { role: 'umpire', amountKRW: 25000 }
    ];
    return { items };
  } catch (e) {
    console.error('[get-payout-rules]', e);
    throw e;
  }
}

// 월별 수당 요약
export async function monthlyPayoutSummary({ clubId, year, month }) {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const { summary } = await aggregatePayouts({
      clubId,
      from: startDate.getTime(),
      to: endDate.getTime()
    });
    
    const totalAmount = summary.reduce((sum, s) => sum + s.total, 0);
    const totalMatches = summary.reduce((sum, s) => sum + s.matches, 0);
    
    return {
      year,
      month,
      totalAmount,
      totalMatches,
      officials: summary.length,
      summary
    };
  } catch (e) {
    console.error('[monthly-summary]', e);
    throw e;
  }
}
