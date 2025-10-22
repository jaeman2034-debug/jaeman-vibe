import fs from 'node:fs/promises';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { aggregateROI } from './reports.mjs';

const OUT = process.env.REPORTS_PUBLIC || '/data/public/reports';

async function ensure(p) {
  await fs.mkdir(p, { recursive: true });
}

export async function renderRoiCard({ meetupId, fromTs, toTs, title = '채널 ROI' }) {
  const items = await aggregateROI({ meetupId, fromTs, toTs });
  const top = items.slice(0, 5);
  
  const rows = top.map(r => 
    `${r.source.padEnd(8, ' ')}  ₩${(r.revenue || 0).toLocaleString()}  비용 ₩${(r.cost || 0).toLocaleString()}  ROAS ${r.roas ? r.roas.toFixed(2) : '-'}  결제 ${r.paid}`
  );
  
  const svg = await satori({
    type: 'div',
    props: {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        padding: '48px',
        background: 'linear-gradient(135deg,#0b0b0f,#111827)',
        color: '#fff',
        fontFamily: 'sans-serif'
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              fontSize: 44,
              fontWeight: 800,
              marginBottom: 8
            },
            children: title
          }
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 20,
              opacity: 0.8,
              marginBottom: 20
            },
            children: `${new Date(fromTs).toLocaleDateString('ko-KR')} – ${new Date(toTs).toLocaleDateString('ko-KR')}`
          }
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'grid',
              gap: 10
            },
            children: rows.map(t => ({
              type: 'div',
              props: {
                style: {
                  fontSize: 28,
                  fontFamily: 'monospace'
                },
                children: t
              }
            }))
          }
        }
      ]
    }
  }, { width: 1200, height: 630 });
  
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  const dir = path.join(OUT, 'meetups', meetupId);
  await ensure(dir);
  const file = path.join(dir, `roi-${Date.now()}.png`);
  await fs.writeFile(file, png);
  const publicUrl = `${process.env.SITE_BASE}/reports/meetups/${meetupId}/${path.basename(file)}`;
  return { file, publicUrl };
}
