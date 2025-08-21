import { normalizeKoSpeech } from "./koSpeechNormalizer";
export type Parsed = { name?: string; email?: string; phone?: string; password?: string; };

// ====== 정교한 파서 구현 ======

// 한글 숫자/영문 음차 → 실제 문자
const KO_NUM = { 공: "0", 영: "0", 빵: "0", 일: "1", 이: "2", 삼: "3", 사: "4", 오: "5", 육: "6", 륙: "6", 칠: "7", 팔: "8", 구: "9" };
const KO_ABC = { 에이:"a", 비:"b", 씨:"c", 디:"d", 이:"e", 에프:"f", 지:"g", 에이치:"h", 아이:"i", 제이:"j",
  케이:"k", 엘:"l", 엠:"m", 엔:"n", 오:"o", 피:"p", 큐:"q", 아르:"r", 에스:"s", 티:"t", 유:"u",
  브이:"v", 더블유:"w", 엑스:"x", 와이:"y", 지드:"z" }; // 필요한 항목만 써도 됨

const collapseHangul = (s:string) =>
  s.replace(/([가-힣])\s+(?=[가-힣])/g, "$1"); // 한글 글자 사이 불필요한 공백 제거

const toDigits = (s:string) =>
  collapseHangul(s)
    .replace(/[^\d가-힣]/g, "")
    .replace(/[가-힣]/g, ch => KO_NUM[ch as keyof typeof KO_NUM] ?? "")
    .replace(/\D/g, "");

const normalizePassword = (s:string) => {
  const tokens = s.trim()
    .replace(/[.,，]/g, " ")
    .split(/\s+/)
    .map(t => KO_ABC[t as keyof typeof KO_ABC] ?? t);
  // 띄어읽기 처리: a b c 1 2 3 4 → abc1234
  return collapseHangul(tokens.join(""));
};

export function parseSignupUtterance(raw: string) {
  const text = raw.trim();

  // 1) 이름: "이름은 …", "저는 …이고/입니다" 패턴 + 후처리
  let name: string | undefined;
  const reNameA = /(?:이름\s*(?:은|이)?|내\s*이름\s*(?:은|이)?|저는)\s*([가-힣\s]{2,6})(?:(?:이|가)?고|입니다|이에요|요)?/;
  const mA = text.match(reNameA);
  if (mA) {
    name = collapseHangul(mA[1])
      .replace(/(?:이|가)?고$|(?:입니다|이에요|요)$|씨$|님$/g, "") // 접미 제거
      .trim();
    if (!/^[가-힣]{2,4}$/.test(name)) name = undefined; // 과도 추출 방지
  }

  // 2) 이메일: 가장 긴 이메일 하나
  const emails = [...text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map(x=>x[0]);
  const email = emails.sort((a,b)=>b.length-a.length)[0];

  // 3) 전화번호: 10~11자리 최장치
  const digits = toDigits(text);
  let phone: string | undefined;
  const phoneCandidates = [...digits.matchAll(/\d{10,11}/g)].map(m=>m[0]);
  const best = phoneCandidates.sort((a,b)=>b.length-a.length)[0];
  if (best) phone = best.length===11 ? `${best.slice(0,3)}-${best.slice(3,7)}-${best.slice(7)}` :
                                      `${best.slice(0,3)}-${best.slice(3,6)}-${best.slice(6)}`;

  // 4) 비밀번호: "비밀번호는 …" 이후 토큰 해석
  let password: string | undefined;
  const mPw = text.match(/비밀번호\s*(?:는|:)?\s*([^\n\r]+)/);
  if (mPw) {
    const rawPw = mPw[1].replace(/^(은|이)\s*/, "");
    const normalized = normalizePassword(rawPw).replace(/\s+/g, "");
    if (normalized) password = normalized;
  }

  return { name, email, phone, password };
} 