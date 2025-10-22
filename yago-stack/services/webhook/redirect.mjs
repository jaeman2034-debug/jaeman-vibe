import { c_visit } from './metrics-bus.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

const ATTR_DIR = process.env.ATTR_DIR || '/data/public/attribution';

async function appendVisit({ id, s, m, c, ua, ip }) {
  const dir = path.join(ATTR_DIR, 'visits');
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${id}.ndjson`);
  const rec = JSON.stringify({ ts: Date.now(), source: s, medium: m, campaign: c, ua, ip }) + '\n';
  await fs.appendFile(file, rec);
}

export async function meetRedirect(req, res) {
  const id = req.params.id;
  const s = (req.query.s || '').toString() || 'direct';
  const m = (req.query.m || '').toString() || 'social';
  const c = (req.query.c || '').toString() || 'meetup';
  
  // visit 카운트 & 쿠키 저장(90일)
  c_visit.inc({ meetup: id, source: s, medium: m, campaign: c });
  try {
    await appendVisit({ 
      id, s, m, c, 
      ua: req.headers['user-agent'] || '', 
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '' 
    });
  } catch {}
  res.setHeader('Set-Cookie', `utm_src=${encodeURIComponent(s)}; Max-Age=${60 * 60 * 24 * 90}; Path=/; SameSite=Lax`);
  res.redirect(302, `/meetups/${id}`);
}
