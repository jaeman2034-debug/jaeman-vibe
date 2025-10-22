import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';
import { wrapRun } from './sentry';
import { sendToTopic, topic } from './fcm';

const db = admin.firestore();

const SLACK = process.env.SLACK_WEBHOOK_URL || '';     // 설정 시 Slack 알림
const NO_SHOW_THRESH = 0.5;  // 노쇼율 50%↑
const PAY_FAIL_THRESH = 0.15; // 결제 실패율 15%↑

async function postSlack(text: string) {
  if (!SLACK) return;
  await fetch(SLACK, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ text }) 
  });
}

export const watchAnomalies = functions.pubsub
  .schedule('every 1 hours').timeZone('Asia/Seoul')
  .onRun(wrapRun('watchAnomalies', async () => {
    const evs = await db.collection('events').where('status', 'in', ['open', 'closed']).limit(50).get();
    
    for (const e of evs.docs) {
      const eventId = e.id; 
      const title = (e.data() as any).title || eventId;

      try {
        // 1) 최근 히스토리 집계에서 노쇼율
        const hist = await db.collection(`events/${eventId}/metrics/history`).orderBy('date', 'desc').limit(3).get();
        const ns = hist.docs.map(d => d.data() as any).map(h => {
          const a = h.attendees || 0, p = h.presence || 0; 
          return a ? (a - p) / a : 0;
        });
        const nsAvg = ns.length ? ns.reduce((x, y) => x + y, 0) / ns.length : 0;

        // 2) 결제 실패율 (최근 24h)
        const since = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
        const paid = await db.collection(`events/${eventId}/payments`).where('approvedAt', '>=', since).get().catch(() => ({ size: 0 } as any));
        const failed = await db.collection(`events/${eventId}/payments`).where('status', '==', 'failed').where('createdAt', '>=', since).get().catch(() => ({ size: 0 } as any));
        const failRate = (paid.size + failed.size) ? (failed.size / (paid.size + failed.size)) : 0;

        const notes: string[] = [];
        if (nsAvg >= NO_SHOW_THRESH) notes.push(`노쇼율 ${Math.round(nsAvg * 100)}%`);
        if (failRate >= PAY_FAIL_THRESH) notes.push(`결제실패율 ${Math.round(failRate * 100)}%`);

        if (notes.length) {
          const msg = `⚠️ [${title}] 이상치 감지: ${notes.join(', ')}`;
          await postSlack(msg);
          
          // 스태프 공지 토픽으로도 푸시(선택)
          try {
            await sendToTopic(topic(eventId, 'announce'), { 
              title: '이상치 감지', 
              body: notes.join(', ') 
            }, { 
              type: 'alert', 
              eventId 
            });
          } catch (error) {
            console.error('푸시 알림 발송 실패:', error);
          }
        }
      } catch (error) {
        console.error(`이벤트 ${eventId} 이상치 감지 실패:`, error);
      }
    }
    
    return null;
  }));
