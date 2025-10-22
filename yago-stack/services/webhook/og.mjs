import fs from 'node:fs/promises';
import path from 'node:path';
import fetch from 'node-fetch';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const CACHE_DIR = process.env.DATA_CACHE || '/data/cache';
const FONT_DIR = path.join(CACHE_DIR, 'fonts');
await fs.mkdir(FONT_DIR, { recursive: true });

async function loadFont(name = 'NotoSansKR-Regular.otf') {
  const p = path.join(FONT_DIR, name);
  try { 
    return await fs.readFile(p); 
  } catch {}
  
  // Google Fonts mirror (변경 가능)
  const url = 'https://fonts.gstatic.com/s/notosanskr/v2/NotoSansKR-Regular.otf';
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(p, buf);
  return buf;
}

export async function renderOg({ title, subtitle, sport, club, date, bg = 'brand', badges }) {
  const fontData = await loadFont();
  const width = 1200, height = 630;
  const pad = 56;
  
  const gradients = {
    brand: ['#0ea5e9', '#2563eb'],
    sport: ['#16a34a', '#065f46'],
    night: ['#111827', '#1f2937']
  };
  const [c1, c2] = gradients[bg] || gradients.brand;

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: width + 'px', 
          height: height + 'px', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})`, 
          color: 'white', 
          fontFamily: 'NotoSansKR',
          padding: pad + 'px', 
          justifyContent: 'space-between'
        },
        children: [
          {
            type: 'div', 
            props: {
              style: { 
                display: 'flex', 
                gap: '14px', 
                alignItems: 'center', 
                opacity: 0.9, 
                fontSize: '22px', 
                letterSpacing: '1px' 
              },
              children: [ 
                sport ? `${sport.toUpperCase()}` : 'MEETUP', 
                '•', 
                club || 'YAGO SPORTS' 
              ]
            }
          },
          {
            type: 'div', 
            props: {
              style: { display: 'flex', flexDirection: 'column', gap: '18px' },
              children: [
                { 
                  type: 'div', 
                  props: { 
                    style: { 
                      fontSize: '68px', 
                      fontWeight: 800, 
                      lineHeight: 1.1 
                    }, 
                    children: title || '제목을 입력하세요' 
                  } 
                },
                subtitle ? { 
                  type: 'div', 
                  props: { 
                    style: { 
                      fontSize: '28px', 
                      opacity: 0.9 
                    }, 
                    children: subtitle 
                  } 
                } : null,
              ].filter(Boolean)
            }
          },
          {
            type: 'div', 
            props: {
              style: { 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-end' 
              },
              children: [
                date ? { 
                  type: 'div', 
                  props: { 
                    style: { 
                      fontSize: '22px', 
                      opacity: 0.95 
                    }, 
                    children: date 
                  } 
                } : { type: 'div', props: { children: '' } },
                { 
                  type: 'div', 
                  props: { 
                    style: { 
                      display: 'flex', 
                      gap: '8px' 
                    }, 
                    children: (badges || '').split(',').filter(Boolean).map((b) => ({ 
                      type: 'div', 
                      props: { 
                        style: { 
                          fontSize: '16px', 
                          padding: '6px 10px', 
                          background: 'rgba(255,255,255,0.15)', 
                          borderRadius: '999px' 
                        }, 
                        children: b.trim().toUpperCase() 
                      } 
                    })) 
                  } 
                }
              ]
            }
          }
        ]
      }
    },
    {
      width, 
      height,
      fonts: [ 
        { 
          name: 'NotoSansKR', 
          data: fontData, 
          weight: 400, 
          style: 'normal' 
        } 
      ]
    }
  );

  const png = new Resvg(svg, { background: 'transparent' }).render().asPng();
  return png;
}
