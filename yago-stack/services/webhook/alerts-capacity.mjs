import fetch from 'node-fetch';
import { emit } from './metrics-bus.mjs';

const seen = new Map();
const pct = () => Number(process.env.ALERTS_CAPACITY_WARN || 0.9);

export function startCapacityAlerts() {
  if (!/^true$/i.test(String(process.env.ALERTS_ENABLE || ''))) return;
  setInterval(tick, 60 * 1000);
}

async function tick() {
  try {
    // 관리되는 meetupId 목록을 어디서 얻을지에 따라 다르다.
    // 간단히 최근 이벤트에서 본 meetupId를 메모리에 유지하거나 관리자가 지정.
    const ids = Array.from(globalThis._yago_recent_meetups || []);
    for (const id of ids) {
      const r = await fetch(`${process.env.DOMAIN || ''}/api/meetups/${id}/capacity`);
      const j = await r.json();
      const totalCap = Object.values(j.capacity || {}).reduce((a, b) => a + Number(b || 0), 0);
      const used = Object.keys(j.capacity || {}).reduce((a, k) => a + (Number(j.paid?.[k] || 0) + Number(j.pending?.[k] || 0)), 0);
      if (!totalCap || totalCap === Infinity) continue;
      const p = used / totalCap; 
      const key = `${id}:${Math.floor(p * 10)}`; // 10% 단위 dedup
      if (p >= pct() && !seen.has(key)) {
        seen.set(key, Date.now());
        emit('alert', { kind: 'capacity_warn', meetupId: id, pct: p });
        await post(`정원 경고`, `*Meetup:* ${id}\n정원 사용률: ${(p * 100).toFixed(0)}%`);
      }
    }
  } catch (error) {
    console.error('[capacity-alert]', error);
  }
}

async function post(title, text) {
  const url = process.env.SLACK_WEBHOOK_URL_ALERTS; 
  if (!url) return;
  
  try {
    await fetch(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ text: `*${title}*\n${text}` }) 
    });
  } catch (error) {
    console.error('[slack-post]', error);
  }
}
