import fetch from 'node-fetch';
import { bus } from './metrics-bus.mjs';

const mem = { last: null, window: [] }; // 최근 시점값/윈도우 샘플
const dedup = new Map(); // key -> lastTs
const now = () => Date.now();

function rateDelta(cur, prev) { 
  return Math.max(0, cur - prev); 
}

function keepWindow(limitMs) { 
  const t = now(); 
  mem.window = mem.window.filter(x => t - x.t <= limitMs); 
}

function oncePer(key, ms) { 
  const t = now(); 
  const last = dedup.get(key) || 0; 
  if (t - last < ms) return false; 
  dedup.set(key, t); 
  return true; 
}

async function postSlack(blocks) {
  const url = process.env.SLACK_WEBHOOK_URL_ALERTS; 
  if (!url) return;
  
  try {
    await fetch(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ blocks }) 
    });
  } catch (error) {
    console.error('[slack-post]', error);
  }
}

function blocks(title, text) {
  return [
    { type: 'header', text: { type: 'plain_text', text: title } },
    { type: 'section', text: { type: 'mrkdwn', text } },
    { type: 'context', elements: [{ type: 'mrkdwn', text: `${new Date().toLocaleString()}` }] }
  ];
}

export function startAlerts() {
  if (!/^true$/i.test(String(process.env.ALERTS_ENABLE || ''))) return;
  
  const INTERVAL = (Number(process.env.ALERTS_INTERVAL_SEC) || 30) * 1000;
  setInterval(tick, INTERVAL);
  
  // 이벤트 버스에서 이벤트 수신하여 윈도우 업데이트
  ['rsvp', 'checkout', 'paid', 'checkin'].forEach(type => {
    bus.on('evt', (e) => { 
      if (e.type !== type) return; 
      mem.window.push({ t: now(), type, meetupId: e.meetupId }); 
      keepWindow(5 * 60 * 1000); 
    });
  });
}

async function tick() {
  keepWindow(5 * 60 * 1000); // 최근 5분
  const byMeet = new Map();
  
  for (const s of mem.window) {
    const k = s.meetupId; 
    if (!k) continue; 
    if (!byMeet.has(k)) byMeet.set(k, { rsvp: 0, checkout: 0, paid: 0, checkin: 0 });
    byMeet.get(k)[s.type]++;
  }

  for (const [meet, v] of byMeet) {
    // 1) 결제 실패율: (checkout - paid) / max(checkout,1)
    const failRate = v.checkout ? Math.max(0, (v.checkout - v.paid) / v.checkout) : 0;
    if (failRate >= Number(process.env.ALERTS_PAYFAIL_RATE || 0.35) && oncePer(`payfail:${meet}`, 10 * 60 * 1000)) {
      emit('alert', { kind: 'payfail', meetupId: meet, value: failRate });
      await postSlack(blocks('🚨 결제 실패율 급증', `*Meetup:* ${meet}\n*최근 5분* checkout=${v.checkout}, paid=${v.paid}, *failRate=${(failRate * 100).toFixed(0)}%*`));
    }

    // 2) 체크인 정체: 최근 ALERTS_CHECKIN_STALL_MIN 분 동안 checkin 0
    const min = Number(process.env.ALERTS_CHECKIN_STALL_MIN || 3);
    const tcut = now() - min * 60 * 1000;
    const hadCheckin = mem.window.some(x => x.meetupId === meet && x.type === 'checkin' && x.t >= tcut);
    if (!hadCheckin && oncePer(`stall:${meet}`, 10 * 60 * 1000)) {
      emit('alert', { kind: 'checkin_stall', meetupId: meet });
      await postSlack(blocks('⛔ 체크인 정체 감지', `*Meetup:* ${meet}\n최근 ${min}분 동안 체크인이 없습니다.`));
    }
  }
}
