// src/services/aiService.ts

/** 공통 타입 */
export type VisionResult = { text: string; raw?: any };

/** 에러 메시지 정규화 */
export function getErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/** 이미지 파일 유효성 검사 */
export function validateImageFile(
  file: File,
  opts?: { maxMB?: number; accept?: string[] }
): { ok: true } | { ok: false; error: string } {
  const maxMB = opts?.maxMB ?? 10; // 기본 10MB
  const allow = (opts?.accept ?? ['image/jpeg', 'image/png', 'image/webp']).map(s => s.toLowerCase());

  if (!allow.includes(file.type.toLowerCase())) {
    return { ok: false, error: `지원하지 않는 형식입니다 (${file.type}). 허용: ${allow.join(', ')}` };
  }
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxMB) {
    return { ok: false, error: `파일이 너무 큽니다 (${sizeMB.toFixed(2)}MB > ${maxMB}MB)` };
  }
  return { ok: true };
}

/** 파일을 base64(헤더 제거)로 변환 */
export async function fileToBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || '');
      resolve(s.includes(',') ? s.split(',')[1] : s);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** (옵션) 일반 텍스트 분석 프록시 */
export async function analyzeText(prompt: string): Promise<VisionResult> {
  const r = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!r.ok) {
    return { text: '[stub] chat endpoint not found; returning dummy.', raw: await r.text() };
  }
  const data = await r.json();
  const text = data.text ?? data.choices?.[0]?.message?.content ?? JSON.stringify(data);
  return { text, raw: data };
}

/** 이미지(base64) 분석 – 서버의 비전 엔드포인트로 프록시 호출 */
export async function analyzeImageBase64(
  imageBase64: string,
  prompt = 'Describe the image.'
): Promise<VisionResult> {
  const r = await fetch('/api/ai/vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, prompt }),
  });
  if (!r.ok) {
    // 서버 라우트가 아직 없다면 더미 응답 반환
    return { text: '[stub] vision endpoint not found; returning dummy.', raw: await r.text() };
  }
  const data = await r.json();
  const text =
    data.text ??
    data.result ??
    data.choices?.[0]?.message?.content ??
    JSON.stringify(data);
  return { text, raw: data };
}

/** 단일 파일 분석(유효성 검사 포함) */
export async function analyzeProductImage(
  file: File,
  prompt = '상품 이미지를 분석해 핵심 특징을 요약해줘.'
): Promise<VisionResult> {
  const v = validateImageFile(file);
  if (!v.ok) return { text: v.error };
  const b64 = await fileToBase64(file);
  return analyzeImageBase64(b64, prompt);
}

/** 여러 장 이미지 분석 */
export async function analyzeMultipleImages(
  files: File[],
  prompt = '여러 상품 이미지를 함께 보고 대표 특징을 요약해줘.'
): Promise<VisionResult[]> {
  const tasks = files.map(async (f) => {
    const v = validateImageFile(f);
    if (!v.ok) return { text: v.error };
    const b64 = await fileToBase64(f);
    return analyzeImageBase64(b64, prompt);
  });
  return Promise.all(tasks);
} 