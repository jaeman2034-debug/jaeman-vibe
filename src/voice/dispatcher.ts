import { intents } from './intentRegistry';

export function dispatchVoice(text: string, ctx: { navigate: (p:string)=>void; jobId?: string }) {
  const t = (text||'').trim();
  for (const it of intents) {
    for (const p of it.patterns) {
      if (typeof p === 'string') {
        if (t.includes(p)) return it.action(ctx);
      } else if (p.test(t)) {
        return it.action(ctx);
      }
    }
  }
  // fallback: 힌트 제공
  ctx.navigate('/help/voice');
}
