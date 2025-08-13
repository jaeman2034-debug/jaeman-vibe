/* -------------------------------------------------------
 * VIBE NLU (ko-KR) — voice signup 최종본
 * - 정정 패턴(아니고/아니라/말고…)
 * - 노이즈 컷(잡담/의문형/짧은 발화)
 * - 한글 이름 추출(2~6자)
 * - 철자 모드(이-재-만 / 이 재 만)
 * - 재랭킹(마지막 음절 힌트: 구/우/호/희)
 * - 편집거리/자모거리 보정(우↔구 등 1글자 차이)
 * - 화자 유지 규칙(같은 화자 + 정정일 때만 교체)
 * ----------------------------------------------------- */

export type Intent =
  | "START" | "STOP" | "NEXT" | "BACK" | "REPEAT" | "CANCEL"
  | "SET_NAME" | "SET_EMAIL" | "SET_PASSWORD"
  | "NOISE" | "UNKNOWN";

export type Slots = { name?: string; email?: string; password?: string };

export type ParseResult = {
  intent: Intent;
  slot?: Slots;
  _debug?: { normalized?: string; picked?: string; candidates?: string[] };
};

/* =============== 공통 헬퍼 =============== */
const toLowerTrim = (s: string) => (s ?? "").toLowerCase().trim();
const onlyKr = (s: string) => s.replace(/[^\uAC00-\uD7A3\s]/g, " ");
const squeeze = (s: string) => s.replace(/\s+/g, " ").trim();

/** 이름 전처리: 한글만, 중복음절 축약, 공백 제거, 길이 2~6 */
export const normalizeName = (s: string) => {
  let t = squeeze(onlyKr(s));
  t = t.replace(/([가-힣])\s*\1{1,}/g, "$1");
  t = t.replace(/\s/g, "");
  if (t.length < 2 || t.length > 6) return "";
  return t;
};

/* =============== 노이즈/블랙리스트 =============== */
const NAME_BLACKLIST = [
  "다음","뒤로","반복","시작","중지","정지","취소","로그","인식","초기화",
  "성함을","전자우편","비밀번호","확정","전형","제만","진행","확인","안내","질문"
];

const noisePatterns: RegExp[] = [
  /안녕하세요/, /이러한/, /어떻게/, /잡아/, /시작합니다/, /진행/,
  /^다음$/, /^뒤로$/, /말고\?/, /\?$/, /입니다\?$/
];

/* =============== 이메일/비밀번호 =============== */
const normalizeEmailSpeech = (u: string) => {
  let s = (u || "").toLowerCase();

  // 0) 한글 불용어 제거
  s = s.replace(/(이메일|전자우편|주소는|주소가|주소|입니다|이에요|예요|제것|내것|내꺼|제꺼|은|는|이|가)/g, "");

  // 1) 공백 제거
  s = s.replace(/\s+/g, "");

  // 2) amp/앰프 계열 노이즈 제거
  s = s.replace(/amp|&amp;|앰프|에이엠피/gi, "");

  // 3) '골뱅이/앳/에이티/싸/사' -> '@'
  s = s.replace(/골뱅이|앳|에이티|\bat\b|싸|사/gi, "@");

  // 4) '점/닷' -> '.', '콤' -> 'com'
  s = s.replace(/점|닷/gi, ".");
  s = s.replace(/콤/gi, "com");

  // 5) 중복 @ 정리 + 한글 쉼표 제거
  s = s.replace(/@{2,}/g, "@").replace(/[，、]/g, "");

  return s;
};

// 이메일 철자 모드 (제이-와이 / 제이 와이)
const parseEmailSpell = (s: string) => {
  if (!/(철자|스펠|하이픈|-)/i.test(s)) return "";
  const parts = s.split(/[\s,-]+/).map(w => w.trim()).filter(Boolean);
  if (parts.length < 2) return "";
  
  // 첫 번째 부분을 ID로, 나머지를 도메인으로 처리
  const id = parts[0];
  const domain = parts.slice(1).join(".");
  
  // 도메인에 .com 등이 없으면 추가
  const finalDomain = domain.includes(".") ? domain : domain + ".com";
  return `${id}@${finalDomain}`;
};

const EMAIL_RE = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
const tryEmail = (u: string) => {
  // 1) 철자 모드 우선 시도
  const spelled = parseEmailSpell(u);
  if (spelled && EMAIL_RE.test(spelled)) return spelled;
  
  // 2) 일반 이메일 패턴 시도
  return EMAIL_RE.exec(normalizeEmailSpeech(u))?.[0] || "";
};

const tryPassword = (u: string) => {
  if (!/(비밀번호|패스워드|password)/i.test(u)) return "";
  const pw = u.replace(/(비밀번호|패스워드|password|은|는|:)/gi, " ").trim().replace(/\s/g, "");
  return pw.length >= 8 ? pw : "";
};

/* =============== 철자 모드 =============== */
export const parseSpell = (s: string) => {
  if (!/(철자|스펠|하이픈|-)/i.test(s)) return "";
  const joined = s.split(/[\s,-]+/).map(w => w.replace(/[^\uAC00-\uD7A3]/g, "")).join("");
  return normalizeName(joined);
};

/* =============== 이름 후보 추출/정정 =============== */
const KNAME = /[가-힣]{2,6}(?:\s*[가-힣]{0,4})?/g;
export const extractNames = (u: string): string[] =>
  (u.match(KNAME) || [])
    .map(x => normalizeName(x))
    .filter(n => n && n.length >= 2 && n.length <= 6);

// 정정 토큰(다양한 변형)
const CORR_RE = /(아니고|아니라|아니며|말고|말씀이\s*아니고|아닌|아니구|아니고요|말고요)/;
export const isCorrectionUtter = (u: string) => CORR_RE.test(u);

/* =============== 거리/스코어 =============== */
export const editDistance = (a: string, b: string) => {
  const dp = Array(a.length + 1).fill(0).map(() => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1] + (a[i-1]===b[i-1]?0:1));
  return dp[a.length][b.length];
};

const UNI_BASE = 0xAC00;
const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
const JONG = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const decomposeKR = (ch:string) => {
  const c = ch.charCodeAt(0);
  if (c < 0xAC00 || c > 0xD7A3) return {cho:"", jung:"", jong:""};
  const idx = c - UNI_BASE;
  return { cho: CHO[Math.floor(idx/588)], jung: JUNG[Math.floor((idx%588)/28)], jong: JONG[idx%28] };
};
export const jamoDistance = (a:string,b:string) => {
  if (!a || !b) return 9;
  const A = decomposeKR(a), B = decomposeKR(b);
  let d = 0;
  if (A.cho !== B.cho) d++;
  if (A.jung !== B.jung) d++;
  if (A.jong !== B.jong) d++;
  return d;
};

export const scoreName = (raw: string) => {
  const n = normalizeName(raw);
  if (!n) return { n: "", score: -1, cho: "" };
  const len = n.length;
  const lenScore = 1 - Math.abs(len - 3) / 3;
  const krRatio = n.length / (raw.length || 1);
  const cho = (() => {
    let r = ""; for (const ch of n) {
      const c = ch.charCodeAt(0);
      if (c >= 0xAC00 && c <= 0xD7A3) r += CHO[Math.floor((c - 0xAC00)/588)];
    } return r;
  })();
  const choLenScore = Math.min(cho.length / 3, 1);
  return { n, cho, score: lenScore * 0.5 + krRatio * 0.3 + choLenScore * 0.2 };
};

/* =============== 재랭킹(마지막 음절 힌트 반영) =============== */
export function reRankNameCandidates(finals: string[], raw: string): string {
  const items = finals
    .map(s => s.trim())
    .flatMap(s => extractNames(s))
    .filter(Boolean);

  if (items.length === 0) return finals[0] || "";

  const u = (raw || "").toLowerCase();
  const wantGu = /(구)\s*(입니다|요|에요|야|다)?\b/.test(u) || /\b구\b/.test(u);
  const wantU  = /(우)\s*(입니다|요|에요|야|다)?\b/.test(u) || /\b우\b/.test(u);
  const wantHo = /(호)\s*(입니다|요|에요|야|다)?\b/.test(u) || /\b호\b/.test(u);
  const wantHee= /(희)\s*(입니다|요|에요|야|다)?\b/.test(u) || /\b희\b/.test(u);

  const scored = items.map(n => {
    const base = scoreName(n).score;
    const last = n.at(-1) || "";
    let bonus = 0;
    if (wantGu && last === "구") bonus += 0.8;
    if (wantU  && last === "우") bonus += 0.8;
    if (wantHo && last === "호") bonus += 0.8;
    if (wantHee&& last === "희") bonus += 0.8;
    // stem 보정(예: 박병*)
    if (/^[가-힣]{1,2}병/.test(n)) bonus += 0.1;
    return { n, score: base + bonus };
  });

  scored.sort((a,b) => b.score - a.score);
  return scored[0].n;
}

/* =============== 메인 파서 =============== */
export function parseUtterance(utter: string): ParseResult {
  const raw = utter ?? "";
  const u = toLowerTrim(raw);

  // control intents
  if (/(시작|스타트|\bstart\b|\bgo\b)/.test(u)) return { intent: "START" };
  if (/(정지|스탑|\bstop\b|그만)/.test(u)) return { intent: "STOP" };
  if (/(다음|\bnext\b|넘겨)/.test(u)) return { intent: "NEXT" };
  if (/(뒤로|이전|\bback\b)/.test(u)) return { intent: "BACK" };
  if (/(취소|캔슬|\bcancel\b)/.test(u)) return { intent: "CANCEL" };
  if (/(다시|\brepeat\b|반복)/.test(u)) return { intent: "REPEAT" };

  // noise cuts
  if (noisePatterns.some(p => p.test(u))) return { intent: "NOISE" };
  if (NAME_BLACKLIST.some(w => u.includes(w))) return { intent: "NOISE" };

  // email / password
  const email = tryEmail(u);
  if (email) return { intent: "SET_EMAIL", slot: { email }, _debug: { normalized: email } };
  const pw = tryPassword(u);
  if (pw) return { intent: "SET_PASSWORD", slot: { password: pw } };

  // spelled
  const spelled = parseSpell(raw);
  if (spelled) return { intent: "SET_NAME", slot: { name: spelled }, _debug: { picked: spelled } };

  // correction: 정정토큰 이후에서 마지막 이름만 선택
  if (CORR_RE.test(u)) {
    const after = raw.split(CORR_RE).pop() || "";
    const cands = extractNames(after);
    if (cands.length > 0) {
      const last = cands[cands.length - 1];
      return { intent: "SET_NAME", slot: { name: last }, _debug: { candidates: cands, picked: last } };
    }
    const all = extractNames(raw);
    if (all.length > 0) {
      const last = all[all.length - 1];
      return { intent: "SET_NAME", slot: { name: last }, _debug: { candidates: all, picked: last } };
    }
  }

  // "제 이름은 ..." 패턴
  const m1 = u.match(/(제\s*이름은|내\s*이름은|i am|my name is)\s*([a-z가-힣\s.'-]{2,})/i);
  if (m1) {
    const cleaned = normalizeName(m1[2]);
    if (cleaned) return { intent: "SET_NAME", slot: { name: cleaned }, _debug: { picked: cleaned } };
  }

  // 보수적: 문장 전체에서 단일 이름 인식
  const kr = normalizeName(raw);
  if (/^[가-힣]{2,6}$/.test(kr)) {
    return { intent: "SET_NAME", slot: { name: kr }, _debug: { picked: kr } };
  }

  return { intent: "UNKNOWN" };
}

/* =============== 화자 유지 규칙(업데이트 여부 판단) =============== */
/** 업데이트 판단 컨텍스트 */
export type UpdateCtx = {
  /** 같은 화자라고 판단(voiceprint/diarization 결과) */
  sameSpeaker?: boolean;
  /** 발화가 정정(아니고/아니라/말고…)인지 */
  isCorrection?: boolean;
  /** 마지막 음절 힌트(구/우/호/희 등)를 원문에서 감지한 문자열 */
  hintText?: string;
};

/** 이전 이름(prev)과 새 후보(next) 중 어떤 걸 채택할지 결정 */
export function shouldUpdateName(prev: string, next: string, ctx: UpdateCtx = {}) {
  const p = normalizeName(prev);
  const n = normalizeName(next);
  if (!n) return { update: false, reason: "invalid_next" };
  if (!p) return { update: true, reason: "no_prev" };

  // 기본: 같은 화자 + (정정이거나 충분히 유사)일 때만 교체
  const same = !!ctx.sameSpeaker;
  const corr = !!ctx.isCorrection;

  // 유사도(편집거리/자모거리)
  const ed = editDistance(p, n);
  const jd = jamoDistance(p.at(-1) || "", n.at(-1) || "");

  // 정정인 경우 완화(한 글자 차이면 무조건 교체)
  if (corr && (ed <= 1 || jd <= 1)) return { update: true, reason: "correction_close" };

  // 같은 화자 + 한 글자 차이면 교체 허용
  if (same && (ed <= 1 || jd <= 1)) return { update: true, reason: "same_speaker_close" };

  // 완전히 달라 보이면 유지
  if (ed >= 2 && jd > 1) return { update: false, reason: "too_diff" };

  // 힌트 텍스트가 마지막 음절과 일치하면 교체 쪽 가점
  if (ctx.hintText) {
    const last = n.at(-1);
    if (last && ctx.hintText.includes(last)) return { update: true, reason: "hint_bonus" };
  }

  // 그 외: 같은 화자일 때만 교체
  return { update: same, reason: same ? "same_speaker" : "not_same_speaker" };
}

/* =============== 고수준 리듀서(한 줄로 처리) =============== */
/** 한 번의 발화를 받아 이름을 갱신할지 결정 */
export function reduceName(prev: string, rawUtter: string, ctx: UpdateCtx = {}) {
  const isCorr = isCorrectionUtter(rawUtter.toLowerCase());
  const processed = reRankNameCandidates([rawUtter], rawUtter); // 마지막 음절 힌트 반영
  const { intent, slot } = parseUtterance(processed);
  if (intent !== "SET_NAME" || !slot?.name) {
    return { next: prev, updated: false, reason: "no_name_intent" };
  }
  const next = slot.name;
  const judge = shouldUpdateName(prev, next, { ...ctx, isCorrection: isCorr, hintText: rawUtter });
  return { next: judge.update ? next : prev, updated: judge.update, reason: judge.reason };
}

// ===== NLU Helpers for email accumulation =====

// 반복 패턴 축약: 2~6글자 블록이 연속 2회 이상 반복되면 1회로 축약
function compressRepeats(s: string): string {
  return s.replace(/(.{2,6})\1{1,}/g, "$1");
}

// 두 문자열의 최장 접합(뒤-앞) 겹침 길이
function longestOverlap(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  for (let k = max; k > 0; k--) {
    if (a.slice(-k) === b.slice(0, k)) return k;
  }
  return 0;
}

// 부분 ID 정규화: 공백/한글 제거, 소문자, 안전문자만 유지
export function normalizeEmailId(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\w.+-]/g, "") // 영문/숫자/_ . + - 만 남김
    .replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣\s]/g, "");
}

// 도메인 정규화: 한글 발화 정규화 + 소문자 + 점/영문만
export function normalizeDomain(raw: string): string {
  const m = raw
    .toLowerCase()
    // 한글 발화 보정
    .replace(/\b지 ?메일\b/g, "gmail")
    .replace(/\b네이버\b/g, "naver")
    .replace(/\b다음\b/g, "daum")
    .replace(/\b아웃룩\b/g, "outlook")
    .replace(/\b점\b/g, ".")
    .replace(/\s+/g, "");
  return m.replace(/[^a-z0-9.-]/g, "");
}

// ID 머지: append 대신 '대체/확장' 규칙 적용
export function mergeId(prev: string, next: string): string {
  const p = normalizeEmailId(prev);
  const n = normalizeEmailId(next);
  if (!p) return n;
  if (!n) return p;

  if (n.startsWith(p)) return compressRepeats(n);   // 확장
  if (p.startsWith(n)) return compressRepeats(p);   // 더 짧은 토막 → 유지
  if (n.includes(p))   return compressRepeats(n);   // 중간 삽입/중복
  if (p.includes(n))   return compressRepeats(p);

  // 겹침 접합
  const ov = longestOverlap(p, n);
  if (ov > 0) return compressRepeats(p + n.slice(ov));

  // 마지막 안전장치: 더 긴 쪽 선택
  return compressRepeats(p.length >= n.length ? p : n);
}

// 도메인 머지:  sub + root(.com 등) 순서로 안정화
export function mergeDomain(prev: string, next: string): string {
  const p = normalizeDomain(prev);
  const n = normalizeDomain(next);
  if (!p) return n;
  if (!n) return p;
  if (n.startsWith(p)) return n;
  if (p.startsWith(n)) return p;

  // gmail + .com / gmail.com + com → gmail.com
  if (p.endsWith(".") && /^[a-z]{2,10}$/.test(n)) return p + n;
  if (n.endsWith(".") && /^[a-z]{2,10}$/.test(n)) return n + p;

  // 둘 다 루트 도메인이면 더 긴 쪽
  return p.length >= n.length ? p : n;
}

// 이메일 상태 관리 (작업 버퍼)
export const emailState = {
  idDraft: "",
  domDraft: "",
  committed: false,
  session: 0,
};

// 토큰이 이메일 ID 후보로 감지됐을 때
export function applyIdToken(piece: string) {
  const merged = mergeId(emailState.idDraft, piece);
  emailState.idDraft = merged;
  emitPreview(); // 미리보기 갱신 (UI에 'id@dom' 임시 표시)
}

// 토큰이 도메인 후보로 감지됐을 때
export function applyDomainToken(piece: string) {
  const merged = mergeDomain(emailState.domDraft, piece);
  emailState.domDraft = merged;
  emitPreview();
}

// 미리보기(디버그/화면)에 draft를 '대체'로 반영
function emitPreview() {
  const id = emailState.idDraft;
  const dom = emailState.domDraft;
  const draft = [id, dom].filter(Boolean).join("@");
  // 여기는 기존에 쓰시던 프리뷰 갱신 로깅/상태 세터로 교체
  // pushLog(`📧 draft: ${draft}`);
  // setEmailDraft(draft) 같은…
}

// 최종 커밋: id + dom 둘 다 확정됐을 때만 1회 커밋
export function commitEmailIfReady(onCommit: (finalEmail: string) => void) {
  const { idDraft, domDraft } = emailState;
  if (!idDraft || !domDraft) return;

  const finalEmail = `${normalizeEmailId(idDraft)}@${normalizeDomain(domDraft)}`;
  // 유효성 간단 체크
  if (!/^[a-z0-9._%+-]{1,64}$/.test(normalizeEmailId(idDraft))) return;
  if (!/^[a-z0-9.-]+\.[a-z]{2,10}$/.test(normalizeEmailId(domDraft))) return;

  onCommit(finalEmail);

  // ✅ 커밋 후 작업 버퍼 초기화 (여기가 매우 중요!)
  emailState.idDraft = "";
  emailState.domDraft = "";
  emailState.committed = true;
  emailState.session++;
  emitPreview();
}

// "이메일 입력 초기화" 같은 명령어가 들어왔을 때
export function resetEmailDraft() {
  emailState.idDraft = "";
  emailState.domDraft = "";
  emailState.committed = false;
  emitPreview();
}
