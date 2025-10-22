import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_PUBLIC = process.env.DATA_PUBLIC || '/data/public';
const MEETUPS_FILE = path.join(DATA_PUBLIC, 'meetups.json'); // 또는 DB 조회로 대체

export async function generateSitemap(base) {
  let items = [];
  try { 
    items = JSON.parse(await fs.readFile(MEETUPS_FILE, 'utf8')); 
  } catch {}
  
  const urls = [
    '/', 
    '/meetups', 
    '/market', 
    '/clubs', 
    '/jobs',
    ...items.map(m => `/meetups/${m.id}`)
  ];
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${base}${u}</loc></url>`).join('\n')}
</urlset>`;
  
  return xml;
}
