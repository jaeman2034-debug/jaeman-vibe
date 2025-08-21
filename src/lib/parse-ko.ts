export function normalizeEmail(raw: string) {
  const koNum: Record<string,string> = { 공:"0",영:"0",일:"1",이:"2",삼:"3",사:"4",오:"5",육:"6",칠:"7",팔:"8",구:"9" };
  const m = raw.match(/([A-Za-z0-9._%+\- ]+)\s*([공영일이삼사오육칠팔구])?\s*@\s*([A-Za-z0-9.\-]+)\s*\.\s*([A-Za-z]{2,})/i);
  if (!m) return null;
  const local = m[1].replace(/[ \.]/g, "").toLowerCase();
  const hangul = m[2] ? (koNum[m[2]] ?? "") : "";
  const domain = (m[3] + "." + m[4]).replace(/\s+/g, "").toLowerCase();
  const local2 = /\d$/.test(local) ? local + hangul : local;
  return `${local2}@${domain}`;
}

export function extractPhone(raw: string) {
  const rep = (s: string) => s
    .replace(/공|영/g,"0").replace(/일/g,"1").replace(/이/g,"2").replace(/삼/g,"3").replace(/사/g,"4")
    .replace(/오/g,"5").replace(/육/g,"6").replace(/칠/g,"7").replace(/팔/g,"8").replace(/구/g,"9")
    .replace(/[^\d]/g,"");
  const digits = rep(raw);
  const m = digits.match(/01[016789]\d{7,8}/);
  if (!m) return null;
  const d = m[0];
  const display = d.length === 10 ? `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`
                                   : `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
  return { display, digits: d };
}

export type PwStatus = "ok" | "weak" | "missing";

/** 한글로 말한 알파벳/숫자/구두점 정규화 사전 */
const KO_LETTER: Record<string, string> = {
  에이:"A", 비:"B", 씨:"C", 디:"D", 이:"E", 에프:"F", 지:"G", 에이치:"H", 에취:"H",
  아이:"I", 제이:"J", 케이:"K", 엘:"L", 엠:"M", 엔:"N", 오:"O", 피:"P", 큐:"Q",
  알:"R", 에스:"S", 티:"T", 유:"U", 브이:"V", 더블유:"W", 엑스:"X", 와이:"Y", 지드:"Z"
};
const KO_NUM: Record<string,string> = { 공:"0", 영:"0", 일:"1", 이:"2", 삼:"3", 사:"4", 오:"5", 육:"6", 칠:"7", 팔:"8", 구:"9" };

/** 후행 문장(이메일/전화/이름/끝맺음) 앞에서 멈추도록 경계 지정 */
const PASSWORD_STOP_RE = /(이메일|메일|전화|번호|이름|주소|끝|입니다|이에요|다시 말|재질문|재설정)/i;

// ✅ 트리거를 '비캡처 그룹'으로 정의해 캡처 인덱스 혼선 제거
const TRIGGER = '(?:비\\s*밀\\s*번\\s*호|비\\s*번|암호|password)(?:\\s*(?:은|는|:))?\\s*';

export function extractPassword(raw: string): { value: string; status: PwStatus } {
  // 트리거 뒤 최대 100자를 캡처, 다음 항목(PASSWORD_STOP_RE) 앞에서 멈춤
  const re = new RegExp(TRIGGER + '([\\s\\S]{0,100}?)(?=' + PASSWORD_STOP_RE.source + '|$)', 'i');
  let s = "";
  const m = raw.match(re);
  if (m && m[1]) s = m[1];
  else {
    // 폴백: 트리거 위치부터 끝까지
    const idx = raw.search(new RegExp(TRIGGER, 'i'));
    if (idx >= 0) s = raw.slice(idx);
  }

  // 한국어 알파벳/숫자 치환
  s = s.replace(new RegExp(Object.keys(KO_LETTER).join("|"), "g"), w => KO_LETTER[w]);
  s = s.replace(new RegExp(Object.keys(KO_NUM).join("|"), "g"), w => KO_NUM[w]);

  // 잡단어/구두점 정리
  s = s.replace(/다시 말할게|못 알아듣|입니다|요\./g, " ");
  s = s.replace(/[·ㆍ•∙‧・]/g, ".").replace(/\s+/g, " ").replace(/\./g, " ");

  // 토큰 병합 후 길이 판정
  const tokens = s.match(/[A-Za-z0-9!@#$%^&*_\-+=]+/g) || [];
  const joined = tokens.join("");

  if (joined.length >= 8) return { value: joined, status: "ok" };
  if (joined.length >= 6) return { value: joined, status: "weak" };
  return { value: "", status: "missing" };
}

// 이메일 파서 보강
const PROVIDER_KO: Record<string, string> = {
  '지메일':'gmail','지 메일':'gmail','g메일':'gmail','gmail':'gmail',
  '네이버':'naver','네이벌':'naver','naver':'naver',
  '다음':'daum','한메일':'hanmail','카카오':'kakao','카카오메일':'kakao',
  '야후':'yahoo','핫메일':'hotmail','핫 메일':'hotmail','outlook':'outlook'
};

const TLD_KO: Record<string, string> = {
  '컴':'com','콤':'com','닷컴':'com','com':'com',
  '넷':'net','org':'org','오알지':'org','오지알':'org',
  '케이알':'kr','kr':'kr','코':'co','씨오':'co'
};

// 자주 나오는 오타/변형 정규화
function normalizeEmailTokens(s: string) {
  // '골뱅이/at' → '@', '점/닷/dot' → '.'
  s = s
    .replace(/골\s*뱅\s*이|앳|at/gi, ' @ ')
    .replace(/점|닷|도트|dot/gi, ' . ');

  // '이메일' 오타/변형을 하나로 통일 (이메믈/이멜/메 일 등)
  s = s.replace(
    /(이\s*메\s*(?:이|에)?\s*(?:일|이|르|믈)|이\s*멜|이멜|메\s*일|메일)/gi,
    ' 이메일 '
  );

  // 한글 provider/tld → ascii
  for (const [k, v] of Object.entries(PROVIDER_KO)) {
    s = s.replace(new RegExp(k, 'gi'), ` ${v} `);
  }
  for (const [k, v] of Object.entries(TLD_KO)) {
    s = s.replace(new RegExp(k, 'gi'), ` ${v} `);
  }

  // 군더더기 제거
  s = s.replace(/이메일|메일|주소|은|는|입니다|이에요|말할게|다시|요\./gi, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

// 이메일 트리거: '이메일/오타' 이후 ~ STOP 키워드 전까지
const EMAIL_TRIGGER = '(?:이\\s*메\\s*(?:이|에)?\\s*(?:일|이|르|믈)|이\\s*멜|이멜|메\\s*일|메일)\\s*(?:은|는|이|:)?\\s*';
const STOP_RE = /(전화|번호|비밀번호|비번|이름|끝|입니다|이에요|다시 말|재질문)/i;

function _testEmail(raw: string): { value: string; ok: boolean } {
  // 우선 트리거 구간을 잘라보고, 실패 시 전체에서 패턴 검색
  const re = new RegExp(EMAIL_TRIGGER + '([\\s\\S]{0,120}?)(?=' + STOP_RE.source + '|$)', 'i');
  let seg = '';
  const m = raw.match(re);
  seg = m?.[1] ? m[1] : raw;

  // 정규화
  let s = normalizeEmailTokens(seg);

  // id @ provider . tld
  const A = 'A-Za-z0-9';
  const emailRe = new RegExp(`([${A}._\\-\\s]+)\\s*@\\s*([${A}\\-]+)\\s*\\.\\s*([A-Za-z]{2,})`);
  let mm = s.match(emailRe);

  // 트리거-기반이 실패하면 원문 전체도 한번 더 시도(폴백)
  if (!mm) {
    const whole = normalizeEmailTokens(raw);
    mm = whole.match(emailRe);
  }
  if (!mm) return { value: '', ok: false };

  let id = mm[1].replace(/[\s.]/g, '');  // STT가 찍은 점/공백 제거
  const provider = mm[2].toLowerCase();
  const tld = mm[3].toLowerCase();

  return { value: `${id.toLowerCase()}@${provider}.${tld}`, ok: true };
}

function sanitizeText(s: string) {
  return s
    // 문장 어디서든 나오는 불릿/대시 + 공백 + (따옴표/한글/영문) 앞을 제거
    // 예) ' - "제 이름은…', ' • '이름은…', ' — 제 이름은…'
    .replace(/(?:^|\s)[•\-–—]\s+(?=[""'A-Za-z가-힣])/g, ' ')
    // 남아있는 단독 불릿/대시도 일괄 정리
    .replace(/[•\-–—]/g, ' ')
    // 한/영 따옴표류
    .replace(/[""'«»「」『』]/g, ' ')
    // 괄호류
    .replace(/[(){}\[\]<>]/g, ' ')
    // 마침표/느낌표/물음표를 문장 경계로 통일
    .replace(/[!！?？]/g, '.')
    // 공백 정리
    .replace(/\s+/g, ' ')
    .trim();
}

const NAME_TRIGGER = /(제\s*)?이름\s*(?:은|이|:)?\s*/i;
// STOP에 따옴표/괄호/대시 포함
// 공백 제거: 이름 뒤의 공백에서 멈추지 않도록!
const NAME_STOP = /(?=$|[\n.,!?…""'()\[\]{}\-]|입니다|이에요|이라고|라구요|라고)/i;

function pickHangulName(seg: string, min=2, max=6) {
  // 한글 글자 사이 공백 제거: 이 재 만 → 이재만
  seg = seg.replace(/([가-힣])\s+(?=[가-힣])/g, '$1');
  const tokens = seg.match(/[가-힣]{2,6}/g) ?? [];
  if (!tokens.length) return '';
  // 길이 우선(동일 길이면 앞선 것)
  tokens.sort((a,b) => b.length - a.length);
  return tokens[0] ?? '';
}

function _testName(t: string){
  const text = sanitizeText(t);
  const TRIG = /(?:제\s*)?이름\s*(?:은|이|:)?\s*/i;

  // ← 여기 한 줄만 정확히 교체하세요
  const STOP = /(?=$|[\n.,!?…""'()\[\]{}\-]|입니다|이에요|이라고|라구요|라고)/i;

  const re = new RegExp(TRIG.source + '([\\s\\S]{0,30}?)' + STOP.source, 'i');
  const m = text.match(re);
  const seg = m ? m[1] : '';
  const name = pickHangulName(seg, 2, 6).replace(/씨$/, '');
  return { value: name, ok: !!name, text, seg };
}

 

// === export & dev-console hooks ===
export function extractName(t: string) {
  const result = _testName(t);
  return result.ok ? result.value : null;
}
export function extractEmail(t: string) {
  return _testEmail(t);
}

// 개발 중 콘솔에서 바로 테스트할 수 있도록 전역 훅 노출
declare global {
  interface Window {
    __testName?: (t: string) => { value: string; ok: boolean };
    __testEmail?: (t: string) => { value: string; ok: boolean };
  }
}
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__testName = extractName;
  window.__testEmail = extractEmail;
} 