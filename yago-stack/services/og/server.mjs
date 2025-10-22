import express from 'express';
import { readFile } from 'node:fs/promises';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const app = express();
const PORT = 3000;

// 한글 폰트 로드 (원한다면 다른 폰트도 추가)
let fontData;
try {
  fontData = await readFile(new URL('./fonts/NotoSansKR-Regular.otf', import.meta.url));
  console.log('[OG] 폰트 파일 로드 성공');
} catch (err) {
  console.warn('[OG] 폰트 파일을 찾을 수 없습니다. 기본 폰트를 사용합니다.');
  fontData = null;
}

function ogSvg({ title, subtitle, site = process.env.SITE_NAME || 'YAGO VIBE' }) {
  const w = 1200, h = 630;
  return satori(
    {
      type: 'div',
      props: {
        style: {
          width: `${w}px`, 
          height: `${h}px`, 
          display: 'flex',
          flexDirection: 'column', 
          justifyContent: 'space-between',
          background: '#0f172a', 
          color: '#e5e7eb', 
          padding: '48px'
        },
        children: [
          { 
            type: 'div', 
            props: { 
              style: { fontSize: 40, opacity: 0.8 }, 
              children: site 
            } 
          },
          { 
            type: 'div', 
            props: { 
              style: { fontSize: 64, fontWeight: 700, lineHeight: 1.15 }, 
              children: title 
            } 
          },
          subtitle ? { 
            type: 'div', 
            props: { 
              style: { fontSize: 34, opacity: 0.9 }, 
              children: subtitle 
            } 
          } : null,
          { 
            type: 'div', 
            props: { 
              style: { fontSize: 28, alignSelf: 'flex-end', opacity: 0.6 }, 
              children: new Date().toISOString().slice(0,10) 
            } 
          }
        ]
      }
    },
    {
      width: w,
      height: h,
      fonts: fontData ? [{ name: 'NotoSansKR', data: fontData, weight: 400, style: 'normal' }] : []
    }
  );
}

app.get('/og', async (req, res) => {
  try {
    const title = (req.query.title || 'YAGO VIBE').toString();
    const subtitle = req.query.subtitle ? req.query.subtitle.toString() : '';
    const svg = await ogSvg({ title, subtitle });
    const png = new Resvg(svg, { background: 'rgba(0,0,0,0)' }).render().asPng();
    res.setHeader('Content-Type', 'image/png');
    res.send(Buffer.from(png));
  } catch (err) {
    console.error('[OG] error', err);
    res.status(500).send('OG render error');
  }
});

app.get('/healthz', (req, res) => {
  res.json({ ok: true, service: 'og' });
});

app.listen(PORT, () => console.log(`[OG] http://0.0.0.0:${PORT}`));
