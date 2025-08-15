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
  if (!m) return "";
  const d = m[0];
  return d.length === 10 ? `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`
                         : `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
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
const STOP_RE = /(이메일|메일|전화|번호|이름|주소|끝|입니다|이에요|다시 말|재질문|재설정)/i;

export function extractPassword(raw: string): { value: string; status: PwStatus } {
  // 1) 트리거(비밀번호/비번/암호/password) 뒤의 최대 100자만 비번 후보로 캡처, 다음 항목(STOP_RE) 앞에서 멈춤
  const trig = /(비\s*밀\s*번\s*호|비\s*번|암호|password)\s*(은|는|:)?\s*/i;
  const m = raw.match(new RegExp(trig.source + '([\\s\\S]{0,100}?)' + '(?=' + STOP_RE.source + '|$)', 'i'));
  let s = m ? m[3] ?? m[1] : "";

  // 2) 후보가 비었으면 마지막 트리거 이후를 통째로 시도(보수적 폴백)
  if (!s) {
    const idx = raw.search(trig);
    if (idx >= 0) s = raw.slice(idx);
  }

  // 3) 한국어 알파벳/숫자 단어를 실제 문자로 치환
  s = s.replace(new RegExp(Object.keys(KO_LETTER).join("|"), "g"), w => KO_LETTER[w]);
  s = s.replace(new RegExp(Object.keys(KO_NUM).join("|"), "g"), w => KO_NUM[w]);

  // 4) 흔한 구어 요소/구두점 정리 (점, 쉼, "다시 말할게" 등)
  s = s.replace(/다시 말할게|못 알아듣|입니다|요\./g, " ");
  s = s.replace(/[·ㆍ·•∙‧・·]/g, "."); // 이종 점 → 점
  s = s.replace(/\s+/g, " ");
  s = s.replace(/\./g, " ");         // "A. B. C. 1 2 3 4" → "A B C 1 2 3 4"

  // 5) 허용 문자만 남기고 토큰 병합
  const tokens = (s.match(/[A-Za-z0-9!@#$%^&*_\-+=]+/g) || []);
  const joined = tokens.join("");

  if (joined.length >= 8) return { value: joined, status: "ok" };
  if (joined.length >= 6) return { value: joined, status: "weak" };
  return { value: "", status: "missing" };
} 