// src/lib/parse.ts

// ===== 숫자 파서 (토큰 기반) =====
const DIGIT_MAP: Record<string,string> = {
  "0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9",
  "공":"0","영":"0","빵":"0",
  "일":"1","이":"2","삼":"3","사":"4","오":"5","육":"6","륙":"6","칠":"7","팔":"8","구":"9",
};
const MULTI_REPL: [RegExp,string][] = [
  [/여섯/g, "6"], [/일곱/g, "7"], [/여덟/g, "8"], [/아홉/g, "9"],
  [/에이트|에잇/g, "8"],  // 영어 발음 보정
];

function tokenToDigits(tok: string): string {
  // 순수 숫자면 그대로
  if (/^\d+$/.test(tok)) return tok;

  // 다 한글이면만 변환 시도
  if (!/^[가-힣]+$/.test(tok)) return "";

  // 복합 음절 먼저 치환
  for (const [re, rep] of MULTI_REPL) tok = tok.replace(re, rep);

  // 허용 문자로만 구성된 경우에만 1:1 매핑
  for (const ch of tok) {
    if (!(ch in DIGIT_MAP)) return "";
  }
  return [...tok].map(ch => DIGIT_MAP[ch]).join("");
}

export function digitsFromSpeech(text: string) {
  let s = text.normalize("NFC").toLowerCase();
  // 구두점/구분어를 공백으로
  s = s.replace(/\b(하이픈|빼기|대시|dash|점|dot|쉼표|콤마|comma|마침표|전화번호는?|번호는?)\b/g, " ");
  s = s.replace(/[~_=+.,/\\(){}[\]:;'"`!?@#%^&*<>|]/g, " ");
  s = s.replace(/\s+/g, " ").trim();

  const tokens = s.split(" ");
  let out = "";
  for (const t of tokens) out += tokenToDigits(t);
  return out;
}

function pick01xBlock(ds: string): string | null {
  const full = ds.match(/01[016789]\d{7,8}/);
  if (full) return full[0];
  const near = ds.match(/01[016789]\d{6,8}/); // 한 자리 모자람 허용
  return near?.[0] ?? null;
}

export function extractPhone(text: string) {
  const ds = digitsFromSpeech(text);
  const all = pick01xBlock(ds);
  if (!all) return null;

  const head = all.slice(0, 3);
  const remain = all.slice(3);
  let midLen = (all.length === 10) ? 3 : 4; // 010-3-4 또는 010-4-4
  if (all.length === 9) midLen = Math.max(2, remain.length - 4); // 모자람 임시표기

  const mid = remain.slice(0, midLen);
  const tail = remain.slice(midLen);
  return { digits: head + remain, display: `${head}-${mid}-${tail}` };
}

export function extractName(raw: string) {
  // 전처리: 공백/구두점 정리 + 띄어진 이름 붙이기(이 재 만 → 이재만)
  let t = raw
    .normalize("NFC")
    .replace(/[.,!?;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/([가-힣])\s(?=[가-힣](?:\s[가-힣])?)/g, "$1");

  // 이름 뒤에 올 수 있는 종결/전환 키워드
  const END  = String.raw`(?:입니다|입\s*니?다|이에요|이\s*에\s*요|예요|예\s*요|요)`;
  const NEXT = String.raw`(?:전화|전화번호|전화\s*번호|연락처|핸드폰|휴대폰|번호)`;

  // 이름처럼 보여도 절대 이름이 아닌 단어
  const STOP = /^(전화번호|전화|연락처|번호|이름|성함)$/;

  const clean = (s: string) =>
    s.replace(/\s+/g, "").replace(/(입|릅|름|늠)$/u, "").replace(/(선생님?|님|씨|군|양)$/u, "");

  const tryPick = (re: RegExp) => {
    const m = t.match(re);
    if (!m?.[1]) return null;
    const name = clean(m[1]);
    if (STOP.test(name)) return null;
    return name.length >= 2 && name.length <= 4 ? name : null;
  };

  // ① "제/내 이름은 이재만 (…)"
  const p1 = new RegExp(String.raw`(?:제|내)\s*이름(?:은|:)?\s*([가-힣]{2,4})(?=\s*(?:${END}|${NEXT}|[^가-힣]|$))`, "u");
  // ② "이름은 이재만 (…)"  ← ★ 새로 추가: '제/내' 없이도 매칭
  const p1b = new RegExp(String.raw`이름(?:은|:)?\s*([가-힣]{2,4})(?=\s*(?:${END}|${NEXT}|[^가-힣]|$))`, "u");
  // ③ "저는/나는 이재만 (…)"
  const p2 = new RegExp(String.raw`(?:저는|나는)\s*([가-힣]{2,4})(?=\s*(?:${END}|${NEXT}|[^가-힣]|$))`, "u");
  // ④ 오인 보정: 이름+입/름/늠이 붙은 경우(이재만입/이재만름)
  const p3 = new RegExp(String.raw`([가-힣]{2,4})(?=\s*(?:이?름|릅|름|늠|입)\b)`, "u");
  // ⑤ 일반: 종결어가 뒤에 붙는 경우에만(문장 끝 포함)
  const p4 = new RegExp(String.raw`([가-힣]{2,4})(?=\s*${END}\b|$)`, "u");

  return tryPick(p1) ?? tryPick(p1b) ?? tryPick(p2) ?? tryPick(p3) ?? tryPick(p4);
} 