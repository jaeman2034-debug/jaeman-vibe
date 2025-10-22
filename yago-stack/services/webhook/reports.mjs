import path from 'node:path';
import fs from 'node:fs/promises';
import { startOfDay, endOfDay } from './utils/tz.mjs';
import { TICKETS_DIR } from './utils/tickets.mjs';
import { listCosts } from './roi-costs.mjs';

const ATTR_DIR = process.env.ATTR_DIR || '/data/public/attribution';

export async function listMeetupTickets(meetupId) {
  const files = await fs.readdir(TICKETS_DIR);
  const out = [];
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    const j = JSON.parse(await fs.readFile(path.join(TICKETS_DIR, f), 'utf8'));
    if (j.meetupId === meetupId) out.push(j);
  }
  return out;
}

export async function readVisits(meetupId, fromTs, toTs) {
  try {
    const file = path.join(ATTR_DIR, 'visits', `${meetupId}.ndjson`);
    const raw = await fs.readFile(file, 'utf8');
    const lines = raw.trim().split(/\n+/);
    const rows = [];
    for (const ln of lines) {
      try {
        const j = JSON.parse(ln);
        if ((fromTs == null || j.ts >= fromTs) && (toTs == null || j.ts <= toTs)) {
          rows.push(j);
        }
      } catch {}
    }
    return rows;
  } catch {
    return [];
  }
}

export async function aggregateROI({ meetupId, fromTs, toTs }) {
  const from = fromTs ?? startOfDay();
  const to = toTs ?? endOfDay();
  const tickets = await listMeetupTickets(meetupId);
  const visits = await readVisits(meetupId, from, to);

  const groups = new Map();
  function acc(key) {
    if (!groups.has(key)) {
      groups.set(key, { 
        source: key, 
        visits: 0, 
        rsvp: 0, 
        checkout: 0, 
        paid: 0, 
        revenue: 0, 
        cost: 0,
        arpu: 0,
        cac: 0,
        roas: null
      });
    }
    return groups.get(key);
  }

  // 방문 집계
  for (const v of visits) {
    acc(v.source).visits++;
  }

  // 티켓 집계
  for (const t of tickets) {
    const src = t?.utm?.source || 'unknown';
    const g = acc(src);
    g.rsvp += 1;
    
    if (t.state === 'paid') {
      g.paid += 1;
      g.revenue += Number(t.amount || 0);
    }
    
    // checkout 추정: 티켓에 결제 시도 흔적이 있으면 1
    if (t.payment || t.state === 'pending') {
      g.checkout += 1;
    }
  }

  // 비용 합산
  const costs = await listCosts(meetupId, { from, to });
  for (const c of costs) {
    acc(c.source).cost += Number(c.cost || 0);
  }

  // ARPU, CAC, ROAS 계산
  for (const g of groups.values()) {
    g.arpu = g.visits ? (g.revenue / g.visits) : 0;
    g.cac = g.paid ? (g.cost / g.paid) : (g.cost > 0 ? Infinity : 0);
    g.roas = g.cost > 0 ? (g.revenue / g.cost) : null;
  }

  return Array.from(groups.values()).sort((a, b) => (b.revenue - a.revenue));
}
