import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.env.ATTR_DIR || '/data/public/attribution';

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

function fcost(mid) {
  return path.join(ROOT, 'costs', `${mid}.ndjson`);
}

export async function addCosts(mid, items) {
  const file = fcost(mid);
  await ensureDir(path.dirname(file));
  const lines = items.map(x => JSON.stringify({ ts: Date.now(), ...x })).join('\n') + '\n';
  await fs.appendFile(file, lines);
  return { ok: true };
}

export async function listCosts(mid, { from, to } = {}) {
  try {
    const raw = await fs.readFile(fcost(mid), 'utf8');
    return raw.trim().split(/\n+/).map(l => JSON.parse(l)).filter(r => 
      (!from || r.ts >= from) && (!to || r.ts <= to)
    );
  } catch {
    return [];
  }
}
