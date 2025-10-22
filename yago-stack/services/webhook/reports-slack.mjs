import fetch from 'node-fetch';
import { aggregateROI } from './reports.mjs';
import { startOfDay } from './utils/tz.mjs';
import { renderRoiCard } from './reports-card.mjs';

const HOOK = process.env.SLACK_WEBHOOK_URL_ALERTS;

async function post(text) {
  if (!HOOK) return;
  await fetch(HOOK, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ text }) 
  });
}

export async function slackDaily({ meetupIds }) {
  const to = Date.now();
  const from = startOfDay(to - 24 * 60 * 60 * 1000);
  
  for (const id of meetupIds) {
    const card = await renderRoiCard({ 
      meetupId: id, 
      fromTs: from, 
      toTs: to, 
      title: `${id} — 어제 채널 ROI` 
    });
    await post(`*${id}* — 어제 채널 ROI\n${card.publicUrl}`);
  }
}

export async function slackWeekly({ meetupIds }) {
  const to = Date.now();
  const from = to - 7 * 24 * 60 * 60 * 1000;
  
  for (const id of meetupIds) {
    const card = await renderRoiCard({ 
      meetupId: id, 
      fromTs: from, 
      toTs: to, 
      title: `${id} — 최근 7일 ROI` 
    });
    await post(`*${id}* — 최근 7일 채널 ROI\n${card.publicUrl}`);
  }
}
