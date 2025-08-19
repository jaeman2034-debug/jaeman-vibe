// src/lib/parse-ko-email.ts
export type ExtractEmailResult = {
    value: string;   // 정규화된 email (성공 시)
    ok: boolean;     // 파싱 성공 여부
    seg?: string;    // 잡아낸 구간 (디버그용)
    s?: string;      // 정규화 중간 문자열 (디버그용)
  };
  
  const PROVIDER_KO: Record<string, string> = {
    '지메일': 'gmail', '지 메일': 'gmail', 'g메일': 'gmail', 'gmail': 'gmail',
    '네이버': 'naver', '네이벌': 'naver', 'naver': 'naver',
    '다음': 'daum', '한메일': 'hanmail', 'daum': 'daum', 'hanmail': 'hanmail',
    '카카오': 'kakao', '카카오메일': 'kakao', 'kakao': 'kakao',
    '야후': 'yahoo', 'yahoo': 'yahoo',
    '핫메일': 'hotmail', '핫 메일': 'hotmail', 'hotmail': 'hotmail',
    '아웃룩': 'outlook', 'outlook': 'outlook',
  };
  
  const TLD_KO: Record<string, string> = {
    '닷컴': 'com', '컴': 'com', '콤': 'com', 'com': 'com',
    '넷': 'net', 'net': 'net',
    '오알지': 'org', '오지알': 'org', 'org': 'org',
    '케이알': 'kr', 'kr': 'kr',
    '코': 'co', '씨오': 'co', 'co': 'co',
  };
  
  /** 한국어 발화 정규화: “골뱅이/점/지메일/닷컴 …” → "@", ".", "gmail", "com" */
  function normalizeUtterance(s: string): string {
    s = s
      .replace(/골\s*뱅\s*이|앳|at/gi, ' @ ')
      .replace(/점|닷|도트|dot/gi, ' . ')
      // 메일 관련 잡단어 제거
      .replace(
        /(이\s*메\s*(?:이|에)?\s*(?:일|이|르|믈)|이\s*멜|이멜|메\s*일|메일|이메일|메일|주소|은|는|이|입니다|이에요|예요|말할게|다시|한번|그리고|그런데)/gi,
        ' ',
      );
  
    for (const [k, v] of Object.entries(PROVIDER_KO)) {
      s = s.replace(new RegExp(k, 'gi'), ` ${v} `);
    }
    for (const [k, v] of Object.entries(TLD_KO)) {
      s = s.replace(new RegExp(k, 'gi'), ` ${v} `);
    }
  
    return s.replace(/\s+/g, ' ').trim();
  }
  
  /** 이메일 한 덩어리 뽑기 */
  export function extractEmail(raw: string): ExtractEmailResult {
    // “이메일은/메일은/이멜은 … (여기부터)” 트리거
    const TRIG =
      /(?:이\s*메\s*(?:이|에)?\s*(?:일|이|르|믈)|이\s*멜|이멜|메\s*일|메일)\s*(?:은|는|이|:)?\s*/i;
  
    // 여기 나오면 이메일 설명 끝
    const STOP =
      /(전화|번호|비밀번호|비번|이름|끝|입니다|이에요|예요|다시 말|재질문|질문|주소 끝)/i;
  
    const m = raw.match(
      new RegExp(TRIG.source + '([\\s\\S]{0,120}?)(?=' + STOP.source + '|$)', 'i'),
    );
    const seg = m?.[1] ?? raw; // 트리거가 없으면 통째로 시도
    const s = normalizeUtterance(seg);
  
    // id @ provider . tld  (id 부분은 공백/점 허용 → 최종 정규화에서 제거)
    const em = s.match(/([A-Za-z0-9._\- ]+)\s*@\s*([A-Za-z0-9\-]+)\s*\.\s*([A-Za-z]{2,6})/);
    if (!em) return { value: '', ok: false, seg, s };
  
    const id = em[1].replace(/[\s.]/g, '').toLowerCase(); // “jae. man 2034” → “jaeman2034”
    const host = em[2].toLowerCase();
    const tld = em[3].toLowerCase();
  
    return { value: `${id}@${host}.${tld}`, ok: true, seg, s };
  }
  