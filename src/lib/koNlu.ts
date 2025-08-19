// src/lib/koNlu.ts
export type ExtractResult = { value: string; ok: boolean; s?: string; text?: string; seg?: string };

// -------------------- 공통 유틸 --------------------
const PROVIDER_KO: Record<string, string> = {
  '지메일': 'gmail', '지 메일': 'gmail', 'g메일': 'gmail', 'gmail': 'gmail',
  '네이버': 'naver', '네이벌': 'naver', 'naver': 'naver',
  '다음': 'daum', '한메일': 'hanmail',
  '카카오메일': 'kakao', '카카오': 'kakao',
  '야후': 'yahoo', '핫메일': 'hotmail', '핫 메일': 'hotmail',
  'outlook': 'outlook'
};

const TLD_KO: Record<string, string> = {
  '닷컴': 'com', '컴': 'com', '콤': 'com', 'com': 'com',
  '넷': 'net',
  'org': 'org', '오알지': 'org', '오지알': 'org',
  '케이알': 'kr', 'kr': 'kr',
  '코': 'co', '씨오': 'co'
};

// 기호/불릿/따옴표 등 일반 정리 (이름용)
function sanitizeText(s: string) {
  return s
    .replace(/(?:^|\s)[•\-–—]\s+(?=[“”"‘’'A-Za-z가-힣])/g, ' ') // 불릿/대시 다음 따옴표/문자 시작
    .replace(/[•\-–—]/g, ' ')
    .replace(/[“”"‘’'«»「」『』]/g, ' ')
    .replace(/[(){}\[\]<>]/g, ' ')
    .replace(/[!！?？]/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

// '이 재 만' → '이재만', 2~6자 최장 후보
function pickHangulName(seg: string) {
  const comp = seg.replace(/([가-힣])\s+(?=[가-힣])/g, '$1');
  const tokens = comp.match(/[가-힣]{2,6}/g) || [];
  tokens.sort((a, b) => b.length - a.length);
  return tokens[0] || '';
}

// -------------------- 이름 추출 --------------------
export function extractName(t: string): ExtractResult {
  const text = sanitizeText(t);
  const TRIG = /(?:제\s*)?이름\s*(?:은|이|:)?\s*/i;
  // “입니다/이에요/이라고/라구요/라고”·문장부호·공백·끝 등에서 스톱
  const STOP = /(?!^)(?=$|[\n,.\-!?”"'\)\]\} ]|입니다|이에요|이라고|라구요|라고)/i;

  const re = new RegExp(TRIG.source + '([\\s\\S]{0,30}?)' + STOP.source, 'i');
  const m = text.match(re);
  const seg = m ? m[1] : '';
  const name = pickHangulName(seg).replace(/씨$/, '');
  return { value: name, ok: !!name, text, seg };
}

// -------------------- 이메일 추출 --------------------
function normalizeEmailTokens(s: string) {
  // 1) 기호 치환
  s = s
    .replace(/골\s*뱅\s*이|골뱅이|앳|\bat\b/gi, ' @ ')
    .replace(/점|닷|도트|\bdot\b/gi, ' . ');

  // 2) 공급자/도메인(한글) → 영문 먼저
  for (const [k, v] of Object.entries(PROVIDER_KO)) {
    s = s.replace(new RegExp(k, 'gi'), ' ' + v + ' ');
  }
  for (const [k, v] of Object.entries(TLD_KO)) {
    s = s.replace(new RegExp(k, 'gi'), ' ' + v + ' ');
  }

  // 3) 일반 토큰 제거 (지메일 → gmail로 바뀐 뒤라 안전)
  s = s.replace(
    /(이\s*메\s*(?:이|에)?\s*(?:일|이|르|믈)|이\s*멜|이멜|메\s*일|메일|주소|은|는|이|입니다|이에요|말할게|다시|요\.)/gi,
    ' '
  );

  return s.replace(/\s+/g, ' ').trim();
}

export function extractEmail(raw: string): ExtractResult {
  const TRIG = /(?:이\s*메\s*(?:이|에)?\s*(?:일|이|르|믈)|이\s*멜|이멜|메\s*일|메일)\s*(?:은|는|이|:)?\s*/i;
  const STOP = /(전화|번호|비밀번호|비번|이름|끝|입니다|이에요|다시 말|재질문)/i;

  const m = raw.match(new RegExp(TRIG.source + '([\\s\\S]{0,120}?)(?=' + STOP.source + '|$)', 'i'));
  const seg = m ? m[1] : raw;
  const s = normalizeEmailTokens(seg);

  const em = s.match(/([A-Za-z0-9._\- ]+)\s*@\s*([A-Za-z0-9\-]+)\s*\.\s*([A-Za-z]{2,})/);
  if (!em) return { value: '', ok: false, s };

  const id = em[1].replace(/[\s.]/g, '').toLowerCase();
  const provider = em[2].toLowerCase();
  const tld = em[3].toLowerCase();
  return { value: `${id}@${provider}.${tld}`, ok: true, s };
}
