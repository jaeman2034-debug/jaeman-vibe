export function normalizeKoSpeech(raw: string) {
  let s = (raw ?? "").trim();

  // 한글 표현 → 기호/영문
  s = s
    .replace(/골\s*뱅이|앳|에이트/gi, "@")
    .replace(/지\s*메일/gi, "gmail")
    .replace(/점/gi, "."); // "점 com" 등

  // "닷컴/닷넷/닷오알지" 형태 지원
  s = s.replace(/닷\s*컴/gi, ".com")
       .replace(/닷\s*넷/gi, ".net")
       .replace(/닷\s*오?\s*알?\s*지/gi, ".org");

  // ".컴 / .콤 / .검" 오인식 교정
  s = s.replace(/\.(?:컴|콤|검)\b/gi, ".com");

  // 숫자 한글 → 숫자
  const numMap: Record<string, string> = {
    "공": "0", "영": "0", "제로": "0",
    "하나": "1", "일": "1",
    "둘": "2", "이": "2",
    "셋": "3", "삼": "3",
    "넷": "4", "사": "4",
    "다섯": "5", "오": "5",
    "여섯": "6", "육": "6",
    "일곱": "7", "칠": "7",
    "여덟": "8", "팔": "8",
    "아홉": "9", "구": "9"
  };
  s = s.replace(new RegExp(Object.keys(numMap).join("|"), "g"), m => numMap[m] ?? m);

  // @, . 주변 공백 제거
  s = s.replace(/\s*@\s*/g, "@").replace(/\s*\.\s*/g, ".");

  // ✅ 이메일 전체(로컬/도메인/TLD)에 끼어든 공백 압축
  // 예: "k i m @ n a v e r . c o m" → "kim@naver.com"
  s = s.replace(
    /([a-z0-9._%+\-\s]+)@([a-z0-9.\-\s]+)\.([a-z\s]{2,})(?:\.([a-z\s]{2,}))?/gi,
    (_m, local, dom, tld1, tld2) => {
      const clean = (x: string) => x.replace(/\s+/g, "");
      return `${clean(local)}@${clean(dom)}.${clean(tld1)}${tld2 ? "." + clean(tld2) : ""}`;
    }
  );

  // 마무리 공백 정리
  s = s.replace(/\s+/g, " ").trim();
  return s;
} 