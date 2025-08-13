// File: src/utils/speechName.ts
// 한국어 이름 음성 → 텍스트 정규화 + 짧은 토막 누적

const STOPWORDS = [
  "제이름은","제 이름은","저는","이름은","이라고","라고요","라고","입니다","이에요","합니다",
  "입니다.","이에요.","라고요.","라고.","이요","이요.","입니다요",".","-"
];
// 한 글자 필러(소리) — 단독으로 들어오면 버림
const FILLERS_1 = ["음","어","아","에","예","네","응","읍","읍니다","흠"];

function stripStopWords(s: string) {
  let x = s;
  for (const w of STOPWORDS) x = x.split(w).join("");
  return x;
}

function onlyHangul(s: string) {
  // 한글/띄어쓰기/하이픈만 남김
  return (s || "")
    .replace(/[^\uAC00-\uD7A3\s-]/g, "") // 한글 외 제거
    .replace(/\s+/g, "")                 // 공백 제거
    .replace(/[.-]+$/g, "");             // 끝의 점/하이픈 제거
}

export function normalizeName(raw: string) {
  let s = (raw || "").trim();
  s = s.replace(/\./g, "");       // 문장부호성 점 제거
  s = stripStopWords(s);
  s = onlyHangul(s);
  // 어미/호칭 제거
  s = s.replace(/(씨|님)$/g, "");
  return s;
}

/** prev에 새 토막을 누적. 2글자 이상 되면 확정 가능 */
export function appendNamePiece(prev: string, raw: string) {
  let piece = normalizeName(raw);
  if (!piece) return { name: prev, changed: false };

  // 단독 1글자 필러면 버림
  if (piece.length === 1 && FILLERS_1.includes(piece)) {
    return { name: prev, changed: false };
  }

  // 1글자면 누적(이전과 합쳐 2자 만들기)
  if (piece.length === 1) return { name: (prev + piece), changed: true };

  if (!prev) return { name: piece, changed: true };
  if (piece.includes(prev)) return { name: piece, changed: true };

  if (prev.length === 1 && piece.startsWith(prev)) return { name: piece, changed: true };

  const concat = prev + piece;
  return { name: concat.length <= 5 ? concat : piece, changed: true };
}

/** 유효성: 2자 이상(한국식 기본 규칙) */
export const isValidName = (s: string) => (normalizeName(s).length >= 2); 