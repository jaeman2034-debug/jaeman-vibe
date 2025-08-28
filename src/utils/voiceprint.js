let baselineRms = null;
function rms(buf) { let s = 0; for (let i = 0; i < buf.length; i++)
    s += buf[i] * buf[i]; return Math.sqrt(s / (buf.length || 1)); } /** ?�디??�?��(PCM float) 받아 간단??게이???�과/?�패 ?�단(초보??Mock) */
export async function verifyChunkMock(pcm) { const cur = rms(buf); if (baselineRms == null)
    baselineRms = cur; if (cur < 0.003)
    return { ok: false, score: 0.1 }; } // ?�무 ?�음(?�음)  if (cur > 0.3) return { ok: false, score: 0.2 }; // ?�무 ???�경?�음)  const ratio = cur / (baselineRms || 0.01);  const score = Math.max(0, Math.min(1, 1 - Math.abs(1 - ratio)));  return { ok: score > 0.4, score };}export async function enrollMock() {  baselineRms = null; // ?�록(리셋). ?�제 ?�버 버전?�서 ?�베???�???�정} 
