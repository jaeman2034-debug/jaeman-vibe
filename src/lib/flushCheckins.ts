import { getFunctions, httpsCallable } from 'firebase/functions';
import { oqTake, oqRemove, oqBumpAttempts, oqCount } from './offlineQueue';

function isNetworkish(e: any) {
  const m = String(e?.message || e || '');
  return /Failed to fetch|network|unavailable|timeout/i.test(m);
}

export async function flushCheckinsOnce(limit = 10): Promise<{sent: number; left: number}> {
  const items = await oqTake(limit);
  if (!items.length) return { sent: 0, left: 0 };
  const fn = httpsCallable(getFunctions(), 'scanCheckin');

  const done: string[] = [];
  for (const it of items) {
    try { await fn({ token: it.token }); done.push(it.id); }
    catch (e:any) {
      if (isNetworkish(e)) { await oqBumpAttempts(it.id, e?.message); }
      else { done.push(it.id); } // 서명/만료/권한 등 서버 거절 → 삭제
    }
  }
  await oqRemove(done);
  const left = await oqCount();
  return { sent: done.length, left };
}

export async function flushCheckinsMax(rounds = 5, batch = 10) {
  for (let i = 0; i < rounds; i++) {
    const r = await flushCheckinsOnce(batch);
    if (r.left === 0) return r;
    await new Promise(r => setTimeout(r, 400 * (i + 1)));
  }
  const left = await oqCount();
  return { sent: 0, left };
}