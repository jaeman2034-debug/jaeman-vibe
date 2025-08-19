// src/lib/nlu/ko/extractors.ts
// 한글 이름/이메일 간이 추출기 (콘솔에서도 재사용)

function sanitize(s: string) {
    return s
      .replace(/(?:^|\s)[•\-–—]\s+(?=[“”"‘’'A-Za-z가-힣])/g, ' ')
      .replace(/[•\-–—]/g, ' ')
      .replace(/[“”"‘’'«»「」『』]/g, ' ')
      .replace(/[(){}\[\]<>]/g, ' ')
      .replace(/[!！?？]/g, '.')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  function pickHangulName(seg: string) {
    seg = seg.replace(/([가-힣])\s+(?=[가-힣])/g, '$1'); // 이 재 만 → 이재만
    const tokens = seg.match(/[가-힣]{2,6}/g) || [];
    tokens.sort((a, b) => b.length - a.length);
    return (tokens[0] || '').replace(/씨$/, '');
  }
  
  export function extractName(raw: string) {
    const text = sanitize(raw);
    const TRIG = /(?:제\s*)?이름\s*(?:은|이|:)?\s*/i;
    const STOP = /(?!^)[\n,.\-!?”"'’)\]} ]|입니다|이에요|이라고|라고|라구요|이라구)/i; // 멈춤 지점
    const re = new RegExp(TRIG.source + '([\\s\\S]{0,30}?)' + STOP.source, 'i');
    const m = text.match(re);
    const seg = m ? m[1] : '';
    const value = pickHangulName(seg);
    return { value, ok: !!value, text, seg };
  }
  
  function normalizeEmailTokens(s: string) {
    const PROVIDER_KO: Record<string, string> = {
      '지메일':'gmail','지 메일':'gmail','g메일':'gmail','gmail':'gmail',
      '네이버':'naver','네이벌':'naver','naver':'naver','다음':'daum','한메일':'hanmail',
      '카카오':'kakao','카카오메일':'kakao','야후':'yahoo','핫메일':'hotmail','핫 메일':'hotmail',
      'outlook':'outlook'
    };
    const TLD_KO: Record<string, string> = {
      '컴':'com','콤':'com','닷컴':'com','com':'com','넷':'net','org':'org','오알지':'org','오지알':'org',
      '케이알':'kr','kr':'kr','코':'co','씨오':'co'
    };
  
    s = s
      .replace(/골\s*뱅\s*이|골뱅이|앳|at/gi, ' @ ')
      .replace(/점|닷|도트|dot/gi, ' . ')
      .replace(/(이\s*메\s*(?:이|에)?\s*(?:일|이|르|믈)|이\s*멜|이멜|메\s*일|메일)/gi, ' 이메일 ')
      .replace(/이메일|메일|주소|은|는|입니다|이에요|말할게|다시/gi, ' ');
  
    for (const [k, v] of Object.entries(PROVIDER_KO)) s = s.replace(new RegExp(k, 'gi'), ' ' + v + ' ');
    for (const [k, v] of Object.entries(TLD_KO)) s = s.replace(new RegExp(k, 'gi'), ' ' + v + ' ');
  
    return s.replace(/\s+/g, ' ').trim();
  }
  
  export function extractEmail(raw: string) {
    const STOP = /(전화|번호|비밀번호|비번|이름|끝|입니다|이에요|다시 말|재질문)/i;
    const TRIG = '(?:이\\s*메\\s*(?:이|에)?\\s*(?:일|이|르|믈)|이\\s*멜|이멜|메\\s*일|메일)\\s*(?:은|는|이|:)?\\s*';
    const re = new RegExp(TRIG + '([\\s\\S]{0,120}?)(?=' + STOP.source + '|$)', 'i');
    const m = raw.match(re);
    const seg = m?.[1] ?? raw;
  
    const s = normalizeEmailTokens(seg);
    const em = s.match(/([A-Za-z0-9._\-\s]+)\s*@\s*([A-Za-z0-9\-]+)\s*\.\s*([A-Za-z]{2,})/);
    if (!em) return { value: '', ok: false, s };
    const id = em[1].replace(/[\s.]/g, '').toLowerCase();
    return { value: `${id}@${em[2].toLowerCase()}.${em[3].toLowerCase()}`, ok: true, s };
  }
  