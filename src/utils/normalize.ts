export function normalizeEmail(spoken: string) {
    let s = (spoken || "").toLowerCase().trim();
  
    // 한글 표현 → 기호/영문 치환
    const replacements: Array<[RegExp, string]> = [
      [/골뱅이|앳|at\b/gi, "@"],
      [/닷컴|점컴|점 콤/gi, ".com"],
      [/점|닷/gi, "."],
      [/스페이스|공백/gi, ""],
      [/지\s*메일/gi, "gmail"],
      [/네이버/gi, "naver"],
      [/다음|카카오/gi, "daum"],
    ];
    replacements.forEach(([r, rep]) => (s = s.replace(r, rep)));
  
    // 공백 제거
    s = s.replace(/\s+/g, "");
    return s;
  }
  
  export function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  export const cleanName = (t: string) => (t || "").trim().replace(/[\"']/g, "");
  export const isStrongPassword = (p: string) => typeof p === "string" && p.length >= 8;
  