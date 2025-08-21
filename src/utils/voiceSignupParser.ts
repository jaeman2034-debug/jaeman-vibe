// src/utils/voiceSignupParser.ts
export type ParsedSignup = {
    name: string | null;
    email: string | null;
    phone: string | null;
    password: string | null;
    debug?: {
      emailRaw?: string;
      phoneRaw?: string;
      nameCandidates?: string[];
      passwordRaw?: string;
      tokens?: string[];
    };
  };

// === NEW: 옵션 ===
export type ParseMode = "mixed" | "en_strict";
export interface ParseOptions {
  emailMode?: ParseMode;           // default: "mixed"
  passwordMode?: ParseMode;        // default: "mixed"
  emailPick?: "first" | "last";    // 유효 이메일 중 선택 기준 (mixed=last, en_strict=first 권장)
  passwordOrder?: "as_spoken" | "letters_first" | "digits_first"; // ★ NEW
}

// === 대화 큐 단서 확장 ===
// 자연어도 인식하여 대화체에서 안정적인 구간 파싱
// - 이메일: "메일주소는...", "이메일 주소는..." 등
// - 비밀번호: "암호는...", "패스워드는..." 등  
// - 전화: "휴대폰은...", "연락처는..." 등

// [ADD] 이메일 구간 토큰 프리필터: STT 잡음(amp/주소/이메일 등) 제거
function filterEmailNoiseToken(t: string) {
  const x = t.toLowerCase();
  // 흔한 STT 잡음
  if (x === "amp" || x === "&" || x === "주소" || x === "address") return "";
  if (x === "이메일" || x === "메일" || x === "email" || x === "e") return "";
  return t;
}

// 흔한 오타 보정
function fixEmailDomain(domain: string) {
  let d = domain.toLowerCase().replace(/[^\w.\-]/g, "").replace(/\.\.+/g, ".");
  const gmailLike = ["demail.com","gemail.com","qmail.com","gmai.com","gmaii.com","gmai1.com","gnail.com","gmall.com","gmail.co"];
  if (gmailLike.includes(d)) d = "gmail.com";
  if (d === "naver.co") d = "naver.com";
  if (d === "hotmail.co") d = "hotmail.com";
  return d;
}

// ★ NEW: ga.com.gmail.com → gmail.com, abc.naver.co.kr → naver.co.kr
function normalizeDomain(d: string) {
  const labels = d.split(".").filter(Boolean);
  if (labels.length <= 2) return labels.join(".");
  const last = labels[labels.length - 1];
  const second = labels[labels.length - 2];
  const third = labels[labels.length - 3];
  const isCc = /^[a-z]{2}$/i.test(last);
  const slds = new Set(["co","or","ac","go","ne","re"]);
  if (isCc && slds.has(second)) return [third, second, last].join("."); // *.co.kr
  return [second, last].join("."); // 일반 도메인은 마지막 두 라벨만
}
  
  // ===== 공통 전처리 & 사전 =====
  
  const KO_SYMBOLS: Record<string, string> = {
    "골뱅이": "@",
    "앳": "@",
    "에드사인": "@",
    "점": ".",
    "닷": ".",
    "닷컴": ".com",
    "닷넷": ".net",
    "닷오알지": ".org",
  
    "느낌표": "!",
    "엑스클라메이션": "!",
    "샵": "#",
    "해시": "#",
    "달러": "$",
    "퍼센트": "%",
    "앤드": "&",
    "앤퍼센드": "&",
    "별표": "*",
    "플러스": "+",
    "하이픈": "-",
    "빼기": "-",
    "언더바": "_",
    "언더스코어": "_",
    "슬래시": "/",
    "역슬래시": "\\",
    "공백": " ",
    "스페이스": " ",
    "마침표": ".",
  };
  
  const PROVIDER_KO: Record<string, string> = {
    "지메일": "gmail",
    "지 메일": "gmail",
    "구글메일": "gmail",
    "네이버": "naver",
    "다음": "daum",
    "한메일": "hanmail",
    "네이트": "nate",
    "카카오": "kakao",
    "야후": "yahoo",
    "핫메일": "hotmail",
  };
  
  const TLD_KO: Record<string, string> = {
    "컴": "com",
    "넷": "net",
    "오알지": "org",
    "씨오": "co",
    "케이알": "kr",
    "코리아": "kr",
    "제이피": "jp",
    "유케이": "uk",
    "에듀": "edu",
  };
  
  // 이메일에서 자주 쓰는 영문자 한글 발음
  const KO_ALPHA: Record<string, string> = {
    "에이": "a", "비": "b", "씨": "c", "디": "d", "이이": "e",
    "에프": "f", "지": "g", "에이치": "h", "아이": "i", "제이": "j",
    "케이": "k", "엘": "l", "엠": "m", "엔": "n", "오": "o",
    "피": "p", "큐": "q", "아르": "r", "에스": "s", "티": "t",
    "유": "u", "브이": "v", "더블유": "w", "엑스": "x", "와이": "y", "제트": "z",
  };
  
  // 한국어 숫자 → 숫자
  const KO_NUM: Record<string, string> = {
    "공": "0", "영": "0", "제로": "0",
    "하나": "1", "한": "1", "일": "1",
    "둘": "2", "두": "2", "이": "2",
    "셋": "3", "세": "3", "삼": "3",
    "넷": "4", "네": "4", "사": "4",
    "다섯": "5", "오": "5",
    "여섯": "6", "육": "6",
    "일곱": "7", "칠": "7",
    "여덟": "8", "팔": "8",
    "아홉": "9", "구": "9",
  };
  
  const FILLERS = [
    "입니다", "입니다.", "이에요", "예요", "입니다요",
    "이고요", "이고", "이고,", "이고.", "이고 입니다",
    "입니다요.", "라고", "라고요", "라고 합니다",
  ];
  
  function normalizeSpaces(s: string) {
    return s.replace(/\s+/g, " ").trim();
  }
  
  function splitToTokens(s: string): string[] {
    const kept = /[@._\-+!#$/\\]/;
    const out: string[] = [];
    let cur = "";
    const pushCur = () => { if (cur) { out.push(cur); cur = ""; } };
  
    for (const ch of s) {
      if (/\s/.test(ch)) { pushCur(); continue; }
      if (kept.test(ch)) { pushCur(); out.push(ch); continue; }
      if (/[0-9A-Za-z\u3131-\uD79D]/.test(ch)) { cur += ch; }
      else { pushCur(); }
    }
    pushCur();
    return out;
  }
  
  // ===== 이메일 전용 헬퍼 =====
  // [REPLACE] 구간 추출 헬퍼
  function sliceWindow(tokens: string[], startCues: string[], endCues: string[]) {
    const lt = tokens.map(t => t.toLowerCase());
    let s = lt.findIndex(t =>
      startCues.some(c => t.includes(c)) || t === "@" || t === "골뱅이"
    );
    if (s < 0) return null;

    let e = tokens.length;
    for (let i = s + 1; i < tokens.length; i++) {
      const t = lt[i];
      // '입니다', '입니다.', '이에요' 등 포함되면 종료
      if (t.includes("입니다") || t.includes("이에요") || t.includes("예요") || t.includes("끝")) { e = i; break; }
      if (endCues.some(c => t.includes(c))) { e = i; break; }
    }
    return tokens.slice(s, e);
  }
  
  function looksLikePhoneDigits(t: string) {
    return /^01\d{8,9}$/.test(t); // 01x로 시작 10~11자리
  }

  // 점(.)으로 끊긴 스펠링 런을 마지막 것만 뽑아 붙이기 + 노이즈 컷
  function sanitizeEmailLocal(local: string) {
    let s = local.toLowerCase();

    // 전화 오염 제거
    s = s.replace(/01\d{6,}[a-z0-9-]*/g, "");
    s = s.replace(/(?:^|\.)01\d{6,}[a-z0-9-]*(?=\.|$)/g, "");

    // 허용 외 제거
    s = s.replace(/[^\w.\-]/g, "");

    // 점 기준 분할
    let parts = s.split(".").filter(Boolean);

    // 흔한 노이즈 조각 제거(amp, jje, mail/gmail 등)
    const NOISE = new Set(["amp", "jje", "mail", "email", "gmail"]);
    parts = parts.filter(p => !NOISE.has(p));

    // 전화처럼 긴 숫자 덩어리 제거
    parts = parts.filter(p => !/^\d{6,}$/.test(p));

    // --- 핵심: "스펠링 런" 탐지(한 글자 a~z 또는 한 자리 숫자가 '.'로 연속된 구간) ---
    type Run = { from: number; to: number; items: string[] };
    const runs: Run[] = [];
    let i = 0;
    while (i < parts.length) {
      const isSpellish = (x: string) => /^[a-z0-9]$/.test(x);
      if (!isSpellish(parts[i])) { i++; continue; }
      const start = i;
      const arr = [parts[i]];
      i++;
      while (i < parts.length && isSpellish(parts[i])) { arr.push(parts[i]); i++; }
      if (arr.length >= 3) runs.push({ from: start, to: i - 1, items: arr });
    }

    if (runs.length) {
      // 마지막 스펠링 런을 채택 → 말 끝부분을 신뢰
      const last = runs[runs.length - 1];
      const joined = last.items.join(""); // 예: j.a.e.m.a.n.2.0.3.4 → jaeman2034
      s = joined;
    } else {
      // 스펠링 런이 없으면 짧은 조각이 3개 이상이면 합치기(jae.man.2034 등)
      const allShort = parts.every(p => p.length <= 4);
      const hasDigitChunk = parts.some(p => /^\d{2,}$/.test(p));
      const alphaCount = parts.filter(p => /^[a-z]+$/.test(p)).length;
      s = (parts.length >= 3 && allShort && (hasDigitChunk || alphaCount >= 2))
        ? parts.join("")
        : parts.join(".");
    }

    // 끝쪽 TLD/잡음 제거(실수로 섞인 com/co/kr 등)
    s = s.replace(/\.(?:com|net|org|co|kr|jp|uk|edu)$/g, "");

    // 마무리
    s = s.replace(/\.+/g, ".").replace(/^\./, "").replace(/\.$/, "");
    if (!s) s = "id";
    return s;
  }



  // 이메일 최종 정리 + 유효성 검사 후 반환
  function finalizeEmail(buf: string): string | null {
    let b = buf
      .replace(/[^\w.@\-]+/g, "") // 한글 등 제거
      .replace(/@+/g, "@")
      .replace(/\.\.+/g, ".")
      .replace(/\.@/g, "@")
      .replace(/@\./g, "@");

    if (!b.includes("@")) return null;

    let [local, domain] = b.split("@");
    local = sanitizeEmailLocal(local);
    domain = (domain || "")
      .replace(/[^\w.\-]/g, "")
      .replace(/\.\.+/g, ".")
      .replace(/^\./, "")
      .replace(/\.$/, "");

    const email = `${local}@${domain}`;
    const re = /^[A-Za-z0-9._\-]+@[A-Za-z0-9._\-]+\.[A-Za-z]{2,}$/;
    return re.test(email) ? email : null;
  }
  
    // ===== 이메일 파싱(강화 버전) =====
  // 보조: '@' 이전에서 전화 냄새나는 영숫자 컷
  function phoneishAlnumPreAt(t: string) {
    return /01\d{5,}/.test(t); // 예: 0105689abc123456
  }

  // [REPLACE] tokensToEmail (Strict EN/혼합 모두에서 사용)
  function tokensToEmail(tokens: string[], mode: ParseMode = "mixed", pick: "first" | "last" = "last"): string | null {
    // 이메일 구간 큐 확장: 자연어도 인식
    const EMAIL_START = ["이메일", "메일", "이메일주소", "메일주소", "email", "e메일", "이 메 일"];
    const EMAIL_END   = ["전화", "전화번호", "번호", "핸드폰", "휴대폰", "연락처", "비밀번호", "비밀번호는", "패스워드", "암호"];
    
    const win = sliceWindow(
      tokens,
      EMAIL_START,
      EMAIL_END
    );
    const list = (win ?? tokens);

    let seenAt = false;
    const parts: string[] = [];

    for (const raw0 of list) {
      const raw = filterEmailNoiseToken(raw0);       // ★ 잡음 토큰 제거
      if (!raw) continue;

      const t = raw.toLowerCase();

      // 기호/사전
      if (t === "@" || t === "골뱅이") { parts.push("@"); seenAt = true; continue; }
      if (t === "." || t === "점" || t === "닷") { parts.push("."); continue; }
      if (PROVIDER_KO[t]) { if (!seenAt) { parts.push("@"); seenAt = true; } parts.push(PROVIDER_KO[t]); continue; }
      if (TLD_KO[t])      { if (seenAt) { if (parts[parts.length-1] !== ".") parts.push("."); parts.push(TLD_KO[t]); } continue; }
      if (KO_ALPHA[t])    { parts.push(KO_ALPHA[t]); continue; }

      // 모드별 필터
      if (mode === "en_strict") {
        if (/^[A-Za-z0-9._\-]+$/.test(raw)) parts.push(raw);
      } else {
        if (/^[A-Za-z0-9._\-]+$/.test(raw)) parts.push(raw);
      }
    }

    const s = parts.join("")
      .replace(/\s+/g, "")
      .replace(/\.@/g, "@")
      .replace(/@\./g, "@")
      .replace(/\.\.+/g, ".");

    const re = /[A-Za-z0-9._\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g;
    const matches = Array.from(s.matchAll(re)).map(m => m[0]);
    const chosen = matches.length ? (pick === "first" ? matches[0] : matches[matches.length - 1]) : null;
    if (!chosen) return null;

    let [local, domain] = chosen.split("@");
    local = sanitizeEmailLocal(local);
    domain = fixEmailDomain(domain);
    domain = normalizeDomain(domain);
    const email = `${local}@${domain}`;
    return /^[A-Za-z0-9._\-]+@[A-Za-z0-9._\-]+\.[A-Za-z]{2,}$/.test(email) ? email : null;
  }
  
  // ===== 전화번호 처리(기존 로직 유지) =====
  // 전화번호 구간 큐 확장: 자연어도 인식
  // const PHONE_START = ["전화", "전화번호", "번호", "핸드폰", "휴대폰", "연락처"];
  function tokensToPhone(tokens: string[]): string | null {
    const joined = tokens.join(" ");
    const rough = joined
      .replace(/[^\u3131-\uD79D0-9\- ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  
    if (!rough) return null;
  
    const parts = rough.split(" ");
    let digits = "";
    for (const p of parts) {
      const t = p.toLowerCase();
  
      if (/^\d+$/.test(t)) { digits += t; continue; }
      if (t === "-" || t === "빼기" || t === "하이픈") { continue; }
  
      if (KO_NUM[t]) { digits += KO_NUM[t]; continue; }
  
      const expanded = [...t].map(ch => KO_NUM[ch] ?? "").join("");
      if (expanded && /^[0-9]+$/.test(expanded)) {
        digits += expanded;
        continue;
      }
    }
  
    const m = digits.match(/01\d(\d{7,8})/);
    if (!m) return null;
  
    const start = digits.indexOf(m[0]);
    const candidate = digits.slice(start, start + m[0].length);
    if (candidate.length === 11) {
      return `${candidate.slice(0, 3)}-${candidate.slice(3, 7)}-${candidate.slice(7)}`;
    }
    if (candidate.length === 10) {
      return `${candidate.slice(0, 3)}-${candidate.slice(3, 6)}-${candidate.slice(6)}`;
    }
    return null;
  }
  
    // ===== 이름 처리(강화 버전) =====
  // [REPLACE] 이름 파서
  function extractName(s: string): { value: string | null; candidates: string[] } {
    const clean = s.replace(/\s+/g, " ");
    const ignoreExact = new Set([
      "안녕하세요","안녕","감사합니다","감사",
      "입니다","이에요","예요",
      "전화번호","이메일","비밀번호","번호","전화","비번",
      "저는","나는","제","내","이름은"
    ]);
    const isGreeting = (w: string) => /^안녕하/.test(w);
    const strip = (w: string) =>
      w.replace(/(님|씨)$/, "")
       .replace(/\s+/g, "")
       .replace(/입니다[다\s]*$/, "")
       .replace(/[.,]+$/, "");

    const cands: string[] = [];
    const m0 = clean.match(/([가-힣]{2,6})\s*입니다/);
    if (m0) cands.push(strip(m0[1]));
    const m1 = clean.match(/(?:제|내)?\s*이름은\s*([가-힣]{1,3}\s?[가-힣]{1,3})(?:님|씨)?/);
    if (m1) cands.push(strip(m1[1]));
    const m2 = clean.match(/(?:저는|나는)\s*([가-힣]{1,3}\s?[가-힣]{1,3})(?:님|씨)?\s*(?:입니다|이에요|예요|이고)?/);
    if (m2) cands.push(strip(m2[1]));

    const all = clean.match(/[가-힣]{2,7}/g) ?? [];
    for (let w of all) {
      const sw = strip(w);
      if (sw.length >= 2 && sw.length <= 6 && !ignoreExact.has(sw) && !isGreeting(sw)) cands.push(sw);
    }
    const uniq = Array.from(new Set(cands)).filter(w => !ignoreExact.has(w) && !isGreeting(w));
    const best = uniq.length ? uniq[0] : null;
    return { value: best, candidates: uniq };
  }
  
         // [REPLACE] 비밀번호 파서: 다양한 오인식 cue + 구두점/공백 제거 + 영문·숫자 포함 검사
   function tokensToPassword(
     tokens: string[],
     mode: ParseMode = "mixed",
     opts?: ParseOptions
   ): { value: string | null; raw: string } {
         // 1) cue(키워드) 넓게 허용: '비 밀 번 호', '비번', '비빌번호', '비밀 번호',
     //    영문 'password', 'pass word', 'pw' 등 + 자연어 변형
     const joined = tokens.join(" ");
     const PASS_CUE = /(비\s*밀\s*번\s*호|비\s*본|비\s*번|비빌번호|비밀번호|암호|패스워드|password|pass\s*word|pw)/i;
    const m = joined.match(PASS_CUE);
    if (!m) return { value: null, raw: "" };

    // 2) cue 이후부터 문장 경계(., 입니다, 끝 등)까지를 tail로
    const start = m.index! + m[0].length;
    let tail = joined.slice(start).trim();

    const stops = [".", "입니다", "끝", "이에요", "예요", "전화", "이메일"];
    let stop = tail.length;
    for (const s of stops) {
      const i = tail.indexOf(s);
      if (i >= 0) stop = Math.min(stop, i);
    }
    let raw = tail.slice(0, stop).trim();

    // 3) 앞/뒤 구두점 정리
    raw = raw.replace(/^[^\w!@#$%&*._\-\\/+]+/, "").replace(/[^\w!@#$%&*._\-\\/+]+$/, "");

    // 4) 토큰을 결합 (Strict EN이면 한글 단어 무시)
    const pwTokens = splitToTokens(raw);
    let buf = "";
    for (const tk of pwTokens) {
      const t = tk.toLowerCase();

      // 허용 기호/치환
      if (KO_SYMBOLS[t]) { buf += KO_SYMBOLS[t]; continue; }
      if (KO_ALPHA[t])   { buf += KO_ALPHA[t];   continue; }
      if (KO_NUM[t])     { buf += KO_NUM[t];     continue; }

      // 영문/숫자
      if (/^[A-Za-z0-9]+$/.test(tk)) { buf += tk; continue; }

      // 기호 그대로
      if (/[@._\-+!#$%&*\/\\]/.test(tk)) { buf += tk; continue; }

      // Strict EN 모드에선 한글/기타 버림
      if (mode === "en_strict") continue;
    }

         // 5) 최종 정화: 구분용 구두점/공백 제거 → "Abc. 1234567" => "Abc1234567"
     buf = buf.replace(/[.\s,·:;]+/g, "");

     // ★ 재정렬 옵션 적용
     buf = reorderPassword(buf, opts?.passwordOrder ?? "as_spoken");

     // 6) 검증: 8자 이상 + 영문/숫자각 1개 이상 포함
     const hasLetter = /[A-Za-z]/.test(buf);
     const hasDigit  = /\d/.test(buf);
     const value = buf.length >= 8 && hasLetter && hasDigit ? buf : null;

     return { value, raw };
}

// ★ NEW: 비밀번호 재정렬 도우미
function reorderPassword(buf: string, order: "as_spoken"|"letters_first"|"digits_first") {
  if (order === "as_spoken") return buf;
  const letters = buf.replace(/[^A-Za-z]/g, "");
  const digits  = buf.replace(/[^0-9]/g, "");
  const symbols = buf.replace(/[A-Za-z0-9]/g, ""); // 기호는 맨 뒤로
  if (order === "letters_first") return letters + digits + symbols;
  if (order === "digits_first")  return digits + letters + symbols;
  return buf;
}
  
  // ===== 파싱 fallback 추가 =====
// 원문 인라인에서 이메일 복구(점/띄어쓰기 섞여도)
function fallbackEmailFromRaw(s: string): string | null {
  let t = s.toLowerCase();

  // 한국어/영어 단서 치환
  t = t.replace(/골뱅이|at/gi, "@");
  t = t.replace(/점|닷|dot/gi, ".");
  // 기호 주위 공백 정리
  t = t.replace(/@\s+/g, "@")
       .replace(/\s+\./g, ".")
       .replace(/(\w)\s+\.(?=\w)/g, "$1.")
       .replace(/\.{2,}/g, ".");
  // 이메일 이외 문자 축소
  t = t.replace(/[^\w@.\-]+/g, " ");

  const re = /[a-z0-9._\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i;
  const m = t.match(re);
  return m ? m[0] : null;
}

// ====== 파서 보강 함수들 ======

// 1) 이메일: @ 앞 한글 숫자/잡음 정리
export function normalizeEmail(raw: string) {
  const koNum: Record<string,string> = { 공:"0",영:"0",일:"1",이:"2",삼:"3",사:"4",오:"5",육:"6",칠:"7",팔:"8",구:"9" };
  const m = raw.match(/([A-Za-z0-9._%+\- ]+)\s*([공영일이삼사오육칠팔구])?\s*@\s*([A-Za-z0-9.\-]+)\s*\.\s*([A-Za-z]{2,})/i);
  if (!m) return null;
  const local = m[1].replace(/[ \.]/g, "").toLowerCase();
  const hangul = m[2] ? (koNum[m[2]] ?? "") : "";
  const domain = (m[3] + "." + m[4]).replace(/\s+/g, "").toLowerCase();
  // 한글 숫자가 있더라도, 직전이 숫자일 때만 1자리 숫자로 채택(그 외는 잡음으로 무시)
  const local2 = /\d$/.test(local) ? local + hangul : local;
  return `${local2}@${domain}`;
}

// 2) 전화: 한국어 숫자 섞임 허용 + 덩어리 합치기
export function extractPhone(raw: string) {
  const rep = (s: string) => s
    .replace(/공/g,"0").replace(/영/g,"0")
    .replace(/일/g,"1").replace(/이/g,"2").replace(/삼/g,"3").replace(/사/g,"4")
    .replace(/오/g,"5").replace(/육/g,"6").replace(/칠/g,"7").replace(/팔/g,"8").replace(/구/g,"9")
    .replace(/[^\d]/g,"");
  const digits = rep(raw);
  const m = digits.match(/01[016789]\d{7,8}/); // 10~11자리만
  if (!m) return "";
  const d = m[0];
  return d.length === 10 ? `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`
                         : `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
}

// 3) 비밀번호: 철자 단위(A. B. C.), 한글 철자명, 잡음 제거 후 결합
export function extractPassword(raw: string) {
  // 비번 구간만 잘라오기(가장 마지막 "비밀번호" 이후 80자)
  const mm = raw.match(/(비\s*밀\s*번\s*호|비\s*번|암호|password)[^A-Za-z0-9가-힣]{0,10}([\s\S]{0,80})$/i);
  if (!mm) return { value:"", status:"missing" };
  let s = mm[2];

  // 잡음 제거
  s = s.replace(/다시 말할게|못 알아듣|영어|알파벳|그래|일본어|입니다|요\./g, " ");

  // 한글 철자명 → 영문
  const koLetter: Record<string,string> = { 에이:"A", 비:"B", 씨:"C", 디:"D", 이:"E", 에프:"F", 지:"G", 에이치:"H", 에취:"H", 아이:"I", 제이:"J", 케이:"K", 엘:"L", 엠:"M", 엔:"N", 오:"O", 피:"P", 큐:"Q", 알:"R", 에스:"S", 티:"T", 유:"U", 브이:"V", 더블유:"W", 엑스:"X", 와이:"Y", 지드:"Z" };
  s = s.replace(new RegExp(Object.keys(koLetter).join("|"),"g"), (m)=>koLetter[m]);

  // A. B. C. / A B C / Abc. 형태 모두 수용
  s = s.replace(/\./g," ").replace(/\s+/g," ");
  s = s.replace(/[^A-Za-z0-9!@#$%^&*_\-+= ]/g,"");
  const letters = s.match(/[A-Za-z0-9!@#$%^&*_\-+=]+/g) || [];
  const joined = letters.join("");

  if (joined.length >= 8) return { value: joined, status: "ok" };
  if (joined.length >= 6) return { value: joined, status: "weak" };
  return { value:"", status:"missing" };
}

// ===== 메인 엔트리 =====
export function parseSignupFromText(
    input: string,
    optOrDebug?: boolean | ParseOptions,
    debugMaybe?: boolean
  ): ParsedSignup {
    // 기존 호출(parseSignupFromText(text, true)) 호환
    let opts: ParseOptions = { emailMode: "mixed", passwordMode: "mixed", emailPick: "last" };
    let withDebug = false;
    if (typeof optOrDebug === "boolean") withDebug = optOrDebug;
    else if (typeof optOrDebug === "object" && optOrDebug) {
      opts = { ...opts, ...optOrDebug };
      withDebug = !!debugMaybe;
    }

    const pre = normalizeSpaces(
      input
        .replace(/\u200B/g, "")
        .replace(/[“”"']/g, " ")
    );
    const tokens = splitToTokens(pre);

    let email = tokensToEmail(tokens, opts.emailMode!, opts.emailPick!);
    if (!email) email = fallbackEmailFromRaw(pre);  // ✅ 추가

    const phone = tokensToPhone(tokens);
    const { value: name, candidates: nameCandidates } = extractName(pre);
         const pw = tokensToPassword(tokens, opts.passwordMode!, opts);

    const out: ParsedSignup = {
      name: name ?? null,
      email: email ?? null,
      phone: phone ?? null,
      password: pw.value ?? null,
    };
    if (withDebug) out.debug = { emailRaw: email ?? "", phoneRaw: phone ?? "", nameCandidates, passwordRaw: pw.raw, tokens };
    return out;
  }
  
  // ===== Node에서 빠른 수동 테스트(옵션) =====
  if (typeof window === "undefined") {
    const sample1 = "저는 이재만이고 이메일은 j a e m a n 2 0 3 4 골뱅이 지메일 점 컴 입니다. 전화번호는 공일공 팔팔팔 구구구구. 비밀번호는 a 1 2 3 4 5 6 7.";
    const sample2 = "제 이름은 박선희, 이메일은 id 골뱅이 네이버 점 컴, 번호는 010 1234 5678, 비밀번호는 qwer!234.";
    console.log(parseSignupFromText(sample1, true));
    console.log(parseSignupFromText(sample2, true));
  }
  