import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.env.DATA_PUBLIC || '/data/public';
const C_DIR = path.join(ROOT, 'counters');
const W_DIR = path.join(ROOT, 'waitlist');

await fs.mkdir(C_DIR, { recursive: true });
await fs.mkdir(W_DIR, { recursive: true });

const DEF = { 
  capacity: { default: Infinity }, 
  paid: { default: 0 }, 
  pending: { default: 0 }, 
  holds: [], 
  waitlist: { default: 0 } 
};

const ensure = (obj) => {
  obj.capacity ||= { default: Infinity };
  obj.paid ||= {}; 
  obj.pending ||= {}; 
  obj.waitlist ||= {}; 
  obj.holds ||= [];
  for (const k of Object.keys(obj.capacity)) { 
    obj.paid[k] ||= 0; 
    obj.pending[k] ||= 0; 
    obj.waitlist[k] ||= 0; 
  }
  return obj;
};

export async function getCounters(meetupId) {
  try { 
    const j = JSON.parse(await fs.readFile(path.join(C_DIR, meetupId + '.json'), 'utf8')); 
    return ensure(j); 
  } catch { 
    return structuredClone(DEF); 
  }
}

export async function setCounters(meetupId, obj) { 
  await fs.writeFile(path.join(C_DIR, meetupId + '.json'), JSON.stringify(obj)); 
  return obj; 
}

export async function setBucketCaps(meetupId, caps) {
  const c = await getCounters(meetupId); 
  c.capacity = { ...c.capacity, ...caps };
  ensure(c); 
  await setCounters(meetupId, c); 
  return c.capacity;
}

export async function cleanupHolds(meetupId, now = Date.now()) {
  const c = await getCounters(meetupId);
  const before = c.holds.length;
  const removed = [];
  c.holds = c.holds.filter(h => { 
    const alive = (h.exp || 0) > now; 
    if (!alive) { 
      c.pending[h.bucket] = Math.max(0, (c.pending[h.bucket] || 0) - 1); 
      removed.push(h); 
    } 
    return alive; 
  });
  await setCounters(meetupId, c);
  return { counters: c, removed };
}

export async function addHold(meetupId, bucket, rid, ttlMs = 15 * 60 * 1000) {
  const c = await getCounters(meetupId);
  c.pending[bucket] = (c.pending[bucket] || 0) + 1;
  c.holds.push({ rid, bucket, exp: Date.now() + ttlMs });
  await setCounters(meetupId, c);
  return c;
}

export async function releaseHold(meetupId, rid) {
  const c = await getCounters(meetupId);
  const idx = c.holds.findIndex(h => h.rid === rid);
  if (idx >= 0) { 
    const b = c.holds[idx].bucket; 
    c.pending[b] = Math.max(0, (c.pending[b] || 0) - 1); 
    c.holds.splice(idx, 1); 
  }
  await setCounters(meetupId, c); 
  return c;
}

export async function incPaid(meetupId, bucket = 'default') { 
  const c = await getCounters(meetupId); 
  c.paid[bucket] = (c.paid[bucket] || 0) + 1; 
  await setCounters(meetupId, c); 
  return c; 
}

export async function decPaid(meetupId, bucket = 'default') { 
  const c = await getCounters(meetupId); 
  c.paid[bucket] = Math.max(0, (c.paid[bucket] || 0) - 1); 
  await setCounters(meetupId, c); 
  return c; 
}

const wfile = (meetupId, b) => path.join(W_DIR, `${meetupId}-${b}.json`);

export async function wlList(meetupId, b) { 
  try { 
    return JSON.parse(await fs.readFile(wfile(meetupId, b), 'utf8')); 
  } catch { 
    return []; 
  } 
}

export async function wlPush(meetupId, b, entry) { 
  const arr = await wlList(meetupId, b); 
  arr.push(entry); 
  await fs.writeFile(wfile(meetupId, b), JSON.stringify(arr)); 
  const c = await getCounters(meetupId); 
  c.waitlist[b] = (arr.length); 
  await setCounters(meetupId, c); 
  return arr.length; 
}

export async function wlShift(meetupId, b) { 
  const arr = await wlList(meetupId, b); 
  const head = arr.shift(); 
  await fs.writeFile(wfile(meetupId, b), JSON.stringify(arr)); 
  const c = await getCounters(meetupId); 
  c.waitlist[b] = (arr.length); 
  await setCounters(meetupId, c); 
  return head; 
}

export function isFull(counters, bucket) {
  const cap = (counters.capacity[bucket] ?? Infinity);
  const used = (counters.paid[bucket] || 0) + (counters.pending[bucket] || 0);
  return used >= cap;
}
