export type VerifyResult = { ok: boolean; score: number };

let baselineRms: number | null = null;

function rms(buf: Float32Array) {
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / (buf.length || 1));
}

/** 오디오 청크(PCM float) 받아 간단히 게이트 통과/실패 판단(초보용 Mock) */
export async function verifyChunkMock(pcm: Float32Array): Promise<VerifyResult> {
  const cur = rms(buf);
  if (baselineRms == null) baselineRms = cur;
  if (cur < 0.003) return { ok: false, score: 0.1 }; // 너무 작음(소음)
  if (cur > 0.3) return { ok: false, score: 0.2 }; // 너무 큼(환경잡음)
  const ratio = cur / (baselineRms || 0.01);
  const score = Math.max(0, Math.min(1, 1 - Math.abs(1 - ratio)));
  return { ok: score > 0.4, score };
}

export async function enrollMock() {
  baselineRms = null; // 등록(리셋). 실제 서버 버전에서 임베딩 저장 예정
} 