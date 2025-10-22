import fs from 'node:fs/promises';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import QRCode from 'qrcode';

const OUT = process.env.OG_OUTPUT || '/data/public/og';

async function font() {
  try { 
    return { 
      name: 'NotoSansKR', 
      data: await fs.readFile(process.env.OG_FONT_NOTO || '/app/assets/fonts/NotoSansKR-Regular.ttf'), 
      weight: 400, 
      style: 'normal' 
    }; 
  } catch { 
    return null; 
  }
}

export async function ensureDir(dir) { 
  await fs.mkdir(dir, { recursive: true }); 
}

export async function renderOG({ title, subtitle, dateText, location, sport = 'all', club = 'YAGO', badges = [], url, theme = 'dark' }) {
  const f = await font();
  const qrDataUrl = url ? await QRCode.toDataURL(url, { margin: 0 }) : null;

  const svg = await satori(
    {
      type: 'div', 
      props: {
        style: { 
          width: 1200, 
          height: 630, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          padding: '48px', 
          background: theme === 'dark' ? 'linear-gradient(135deg,#0b0b0f,#111827)' : 'linear-gradient(135deg,#eef2ff,#f8fafc)', 
          color: theme === 'dark' ? '#ffffff' : '#0b0b0f', 
          fontFamily: f ? 'NotoSansKR' : 'sans-serif' 
        },
        children: [
          { 
            type: 'div', 
            props: { 
              style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, 
              children: [
                { 
                  type: 'div', 
                  props: { 
                    style: { fontSize: 56, fontWeight: 800, lineHeight: 1.1, maxWidth: 900 }, 
                    children: title 
                  } 
                },
                { 
                  type: 'img', 
                  props: { 
                    src: process.env.CLUB_LOGO_URL || '', 
                    width: 96, 
                    height: 96, 
                    style: { borderRadius: 16, objectFit: 'cover' } 
                  } 
                }
              ]
            }
          },
          { 
            type: 'div', 
            props: { 
              style: { fontSize: 28, opacity: 0.9 }, 
              children: subtitle || '' 
            }
          },
          { 
            type: 'div', 
            props: { 
              style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }, 
              children: [
                { 
                  type: 'div', 
                  props: { 
                    style: { display: 'flex', flexDirection: 'column', gap: 8 }, 
                    children: [
                      dateText ? { 
                        type: 'div', 
                        props: { 
                          style: { fontSize: 28, opacity: 0.95 }, 
                          children: dateText 
                        } 
                      } : null,
                      location ? { 
                        type: 'div', 
                        props: { 
                          style: { fontSize: 24, opacity: 0.8 }, 
                          children: location 
                        } 
                      } : null,
                      badges?.length ? { 
                        type: 'div', 
                        props: { 
                          style: { display: 'flex', gap: 10, marginTop: 10 }, 
                          children: badges.map(b => ({ 
                            type: 'div', 
                            props: { 
                              style: { 
                                fontSize: 20, 
                                padding: '6px 12px', 
                                borderRadius: 999, 
                                background: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' 
                              }, 
                              children: String(b).toUpperCase() 
                            } 
                          })) 
                        } 
                      } : null,
                    ]
                  }
                },
                qrDataUrl ? { 
                  type: 'img', 
                  props: { 
                    src: qrDataUrl, 
                    width: 160, 
                    height: 160, 
                    style: { background: '#fff', padding: 10, borderRadius: 16 } 
                  } 
                } : { 
                  type: 'div', 
                  props: { children: '' } 
                }
              ]
            }
          }
        ]
      }
    },
    { width: 1200, height: 630, fonts: f ? [f] : [] }
  );

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return png;
}

export async function saveMeetupOG(meetup, { variants = ['main'], theme = 'dark', linkUrl } = {}) {
  const dir = path.join(OUT, 'meetups', meetup.id);
  await ensureDir(dir);
  
  const base = {
    title: meetup.title,
    subtitle: meetup.subtitle || meetup.sport?.toUpperCase() || '',
    dateText: meetup.dateText || new Date(meetup.dateStart).toLocaleString('ko-KR'),
    location: meetup.location?.name || '',
    badges: meetup.badges || [],
    url: linkUrl,
    theme
  };
  
  const outs = [];
  for (const v of variants) {
    const png = await renderOG(base);
    const file = path.join(dir, `${v}.png`);
    await fs.writeFile(file, png);
    outs.push({ 
      variant: v, 
      file, 
      publicUrl: `${process.env.SITE_BASE || ''}/og/meetups/${meetup.id}/${v}.png` 
    });
  }
  return outs;
}
