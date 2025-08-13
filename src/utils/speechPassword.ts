// File: src/utils/speechPassword.ts
// 음성으로 말한 비밀번호를 안전하게 텍스트로 변환

const DIGIT: Record<string, string> = {
  "영": "0", "공": "0", "빵": "0",
  "일": "1", "이": "2", "삼": "3", "사": "4",
  "오": "5", "육": "6", "륙": "6", "칠": "7", "팔": "8", "구": "9",
};

const ALPHA: Record<string, string> = {
  "에이":"a","비":"b","씨":"c","디":"d","이":"e","에프":"f","지":"g",
  "에이치":"h","아이":"i","제이":"j","케이":"k","엘":"l","엠":"m","엔":"n",
  "오":"o","피":"p","큐":"q","아르":"r","에스":"s","티":"t","유":"u",
  "브이":"v","더블유":"w","엑스":"x","와이":"y","제트":"z","지드":"z"
};

const REPL: Array<[string,string]> = [
  ["스페이스", ""], ["띄어쓰기", ""],
  ["점","."], ["쩜","."], ["닷","."],
  ["하이픈","-"], ["대시","-"], ["빼기","-"],
  ["언더바","_"], ["밑줄","_"],
  ["별","*"], ["별표","*"], // 필요 시 허용
];

// 허용 문자(영문 대/소, 숫자, 선택 특수문자)
const ALLOWED = /^[a-zA-Z0-9._\-*!@#$%^&+=?]+$/;

function normalizeKoreanDigits(s: string) {
  return s.replace(/[영공빵일이삼사오육륙칠팔구]+/g, (chunk) =>
    chunk.split("").map(ch => DIGIT[ch] ?? ch).join("")
  );
}

export function speechToPassword(raw: string, opts?: { spellMode?: boolean }) {
  let s = (raw || "").trim().toLowerCase();

  // 단어 치환
  for (const [k, v] of REPL) s = s.split(k).join(v);

  // 한글 숫자→숫자
  s = normalizeKoreanDigits(s);

  if (opts?.spellMode) {
    // 글자 단위 합성(제이 에이 ... / 일이삼 ...)
    const tokens = s.split(/\s+/).filter(Boolean);
    let out = "";
    for (const tk of tokens) {
      if (ALPHA[tk]) { out += ALPHA[tk]; continue; }
      if (tk in DIGIT) { out += DIGIT[tk]; continue; }
      if (/^[a-z0-9._\-*!@#$%^&+=?]+$/.test(tk)) { out += tk; continue; }
    }
    s = out;
  } else {
    // 일반 모드: 공백 제거
    s = s.replace(/\s+/g, "");
  }

  // 문장부호성 말끝 점 제거
  s = s.replace(/\.$/, "");

  // 허용 문자만 남김
  s = Array.from(s).filter(ch => ALLOWED.test(ch)).join("");

  return s;
}

export function validatePassword(pw: string) {
  const len = pw.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasSpecial = /[._\-*!@#$%^&+=?]/.test(pw);
  const ok = len && hasLetter && hasNumber; // 요구사항: 문자+숫자(특수문자 선택)
  let score = 0;
  if (len) score++;
  if (hasLetter) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;
  const level = score >= 4 ? "강함" : score === 3 ? "보통" : "약함";
  return { ok, len, hasLetter, hasNumber, hasSpecial, score, level };
} 