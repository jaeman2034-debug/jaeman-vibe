// ==== Natural Signup Parser (drop-in) ====

// 숫자 한국어 → 숫자
const DIGIT_KO: Record<string, string> = {
  "영":"0","공":"0","빵":"0",
  "일":"1","둘":"2","이":"2","삼":"3","사":"4","오":"5","육":"6","륙":"6","칠":"7","팔":"8","구":"9",
};
const DIGIT_TOKENS = Object.keys(DIGIT_KO).sort((a,b)=>b.length-a.length);

// 알파벳 한국어 스펠링(간단 버전)
const ALPHA_KO: Record<string, string> = {
  "에이":"a","비":"b","씨":"c","디":"d","이":"e","에프":"f","지":"g","에이치":"h","아이":"i",
  "제이":"j","케이":"k","엘":"l","엠":"m","엔":"n","오":"o","피":"p","큐":"q","아르":"r",
  "에스":"s","티":"t","유":"u","브이":"v","더블유":"w","엑스":"x","와이":"y","제트":"z","지드":"z",
};

// 이메일 제공자/최상위도메인 한글 → 영문
const PROVIDER_KO: Record<string,string> = {
  "지메일":"gmail","g메일":"gmail","g 메일":"gmail","gmail":"gmail",
  "네이버":"naver","다음":"daum","한메일":"hanmail","카카오":"kakao","카카오메일":"kakao",
};
const TLD_KO: Record<string,string> = {
  "컴":"com","콤":"com","컴마":"com","컴퓨터":"com","넷":"net","네트":"net",
};

// 구두어 → 기호
const SYM_RULES: Array<[RegExp,string]> = [
  [/(골뱅이|앳|\bat\b)/g, " @ "],
  [/(점|닷|쩜)/g, " . "],
];

// 공백 정리
const squish = (s:string) => s.replace(/\s+/g," ").trim();

// 한국어 숫자/알파 스펠링을 영/숫자로 바꾸는 가벼운 정규화
function koTokensToAscii(s: string) {
  let out = s;
  // 심볼 치환
  for (const [re,rep] of SYM_RULES) out = out.replace(re, rep);
  // 토큰 단위 치환
  out = out.split(/\s+/).map(t=>{
    if (ALPHA_KO[t]) return ALPHA_KO[t];
    if (DIGIT_KO[t]) return DIGIT_KO[t];
    return t;
  }).join(" ");
  return out;
}

// 전화 추출: 01x로 시작하는 10~11자리 우선
function extractPhone(raw: string): string {
  // 한국어 숫자 단어를 숫자로 바꾼 뒤 모두 숫자만 남김
  const ko = raw.replace(new RegExp(DIGIT_TOKENS.join("|"),"g"), (m)=>DIGIT_KO[m] ?? m);
  const onlyDigits = ko.replace(/[^\d]/g,"");
  // 후보: 010 ~ 019 로 시작, 10~11자리
  const candidates: string[] = [];
  for (let i=0;i<onlyDigits.length-9;i++){
    for (let len of [11,10]){
      const sub = onlyDigits.slice(i,i+len);
      if (/^01\d/.test(sub) && (len===10 || len===11)) candidates.push(sub);
    }
  }
  // 가장 앞에서 잡힌 걸 우선 반환
  const picked = candidates[0] || "";
  return picked ? picked.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3") : "";
}

// 이메일 추출(관용어 허용: "아이디 골뱅이 지메일 점 컴" / "id gmail com" 등)
function extractEmail(rawInput: string): string {
  let s = rawInput.toLowerCase();
  s = koTokensToAscii(s);
  s = squish(s);

  // 제공자/도메인 한글 → 영문
  Object.entries(PROVIDER_KO).forEach(([k,v])=>{
    s = s.replace(new RegExp(`\\b${k}\\b`, "g"), ` ${v} `);
  });
  Object.entries(TLD_KO).forEach(([k,v])=>{
    s = s.replace(new RegExp(`\\b${k}\\b`, "g"), ` ${v} `);
  });

  // 흔한 오인식 잡소 제거
  s = s.replace(/\b(처럼|그리고|입니다|이에요|이메일은|이메일은요|이메일이|메일은|주소는|이름은|전화번호는|번호는)\b/g, " ");
  s = squish(s);

  // 1) 이미 완성형 이메일이 있으면 그대로 사용
  const emailRe = /([a-z0-9._%+-]{1,64})@([a-z0-9-]{1,63})\.([a-z.]{2,10})/i;
  const m = s.match(emailRe);
  if (m) return `${m[1]}@${m[2]}.${m[3]}`;

  // 2) 토큰을 보면서 i d / @ / provider / tld 조합 재구성
  const tokens = s.split(/\s+/);
  let id = "", hasAt = false, domLeft = "", tld = "";
  for (let i=0;i<tokens.length;i++){
    const tk = tokens[i];

    if (tk === "@") { hasAt = true; continue; }
    if (tk === ".") { /* skip lone dots */ continue; }

    // provider 또는 tld
    if (["gmail","naver","daum","hanmail","kakao"].includes(tk)) {
      domLeft = tk; continue;
    }
    if (["com","net","co.kr","kr"].includes(tk)) { tld = tk; continue; }

    // 알파넘만 id에 누적
    if (/^[a-z0-9._-]+$/.test(tk)) {
      if (!hasAt) id += tk;
      else if (!domLeft) domLeft = tk; // '@' 이후라면 도메인 왼쪽
      else if (!tld) tld = tk;         // 혹시 'gmail com' 같이 연속
    }
  }

  // 누적 조합
  if (id && (hasAt || domLeft)) {
    const dom = domLeft ? `${domLeft}.${tld || "com"}` : "";
    const email = `${id}@${dom}`.replace(/\.+/g,".").replace(/@\./,"@");
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return email;
  }

  return ""; // 못 찾으면 빈 값
}

// 이름 추출(가장 긴 '한글만' 2~6자 구간)
function extractName(raw: string): string {
  const hangulChunks = raw.replace(/[^가-힣\s]/g," ").split(/\s+/).filter(Boolean);
  // 의미 있어 보이는(2~6자) 후보 중 가장 긴 것을 선택
  const cands = hangulChunks.filter(w => w.length >= 2 && w.length <= 6);
  // "제 이름은 …" 패턴 우선
  const m = raw.match(/(제\s*이름은|저는)\s*([가-힣]{2,6})/);
  if (m) return m[2];
  if (cands.length) return cands.sort((a,b)=>b.length-a.length)[0];
  return "";
}

// 비밀번호 추출("비밀번호는 …" 뒤쪽 알파넘/기호 8+ 우선)
function extractPassword(raw:string): string {
  const after = raw.split(/비밀번호(는|는요)?/)[2] || "";
  if (after) {
    const t = koTokensToAscii(after.toLowerCase()).replace(/\s+/g,"");
    const m = t.match(/[a-z0-9!@#$%^&*()_+\-=\[\]{};':",.<>/?]{8,}/i);
    if (m) return m[0].slice(0,32); // 안전하게 32자 제한
  }
  // 못 찾으면 비워둠
  return "";
}

export function parseNaturalSignup(raw: string) {
  const text = squish(raw || "");
  const name  = extractName(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const password = extractPassword(text);
  return { name, email, phone, password };
} 