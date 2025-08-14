import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { EmailVoiceField } from "../utils/speechEmail";

/**
 * ✅ 이 파일 하나로 끝(통복)
 * - Web Speech API: 클릭 시 즉시 start (권한/UX 안정화)
 * - 정규화/검증: 이름/이메일/비번
 * - Firebase Auth 연동: 이메일/비번 회원 생성
 * - TTS 안내: 단계마다 음성 피드백
 * - HTTPS 가드: http 환경 경고
 *
 * 사용법:
 * 1) .env에 VITE_FB_* 채우기
 * 2) 라우터 or App.tsx에서 <VoiceSignUpFull /> 렌더
 */

// -------------------- SR 타입 보강 --------------------
declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

// === TTS 에코 차단 설정 ===
const TTS_ECHO_WINDOW_MS = 1800; // 기존 800ms → 1.8s로 늘림
const TTS_BLOCKLIST = [
  /이름을\s*확인했습니다\.?$/i,
  /확인합니다\.?$/i,
  /전자우편/i,
];

// 이메일 ID 누적 시 버릴 잡음(영어 STT 흔들림, & → amp, 'cj', 'jj' 등)
const JUNK_TOKENS = new Set([
  "email", "이메일", "메일",
  "처럼", "같이", "같은",
  "amp", "&", "and",
  "cj", "jj", "jje"
]);

// --- Email STT helpers -------------------------------------------------
const AT_WORDS = /(골뱅이|앳|\bat\b)/gi;         // -> '@'
const DOT_WORDS = /(점|닷|쩜)/gi;                 // -> '.'
const PROVIDER_RE = /(gmail|g메일|지메일|naver|네이버|daum|다음|hanmail|한메일|kakao|카카오)/i;
const EMAIL_ID_ALLOWED = /[a-z0-9._-]/;

// === 오인식 보정 ===
function normalizeEmailMishear(s: string) {
  return (s || "")
    .toLowerCase()
    // '골뱅이/앳/at' -> '@'
    .replace(/\b(골뱅이|앳|\bat\b)\b/g, "@")
    // '점/닷/쩜' -> '.'
    .replace(/\b(점|닷|쩜)\b/g, ".")
    // 'g 메일/지 메일/지메일/g mail' -> 'gmail'
    .replace(/\bg\s*메일\b/g, "gmail")
    .replace(/\bg\s*mail\b/g, "gmail")
    .replace(/\b지\s*메일\b/g, "gmail")
    .replace(/\b지메일\b/g, "gmail")
    // '네이버/다음/한메일/카카오' -> 영문 도메인 루트
    .replace(/\b네이버\b/g, "naver")
    .replace(/\b다음\b/g, "daum")
    .replace(/\b한메일\b/g, "hanmail")
    .replace(/\b카카오\b/g, "kakao")
    // 'cj' 가 'j'로 붙는 케이스 보정
    .replace(/\bcj(?=\s*[a-z])/g, "j")
    .replace(/\bjj(?=\s*[a-z])/g, "j")
    // 공백/특문 정리
    .replace(/[，、]/g, ",");
}

const sanitizeDomain = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(DOT_WORDS, ".")
    .replace(/[^\w.-]+/g, "")   // 한글/불필요 기호 제거
    .replace(/^\.+/, "")
    .replace(/\.+$/, "")
    .replace(/\.{2,}/g, ".");

function fixCommonDomain(dom: string) {
  if (!dom) return dom;
  const d = dom.replace(/\.(?:com|net)?$/, ""); // 뒤에 com/net 유무 섞여 들어온 케이스 보정
  if (/^(gmail|g메일|지메일)$/.test(d)) return "gmail.com";
  if (/^(naver|네이버)$/.test(d))       return "naver.com";
  if (/^(daum|다음)$/.test(d))          return "daum.net";
  if (/^(hanmail|한메일)$/.test(d))     return "hanmail.net";
  if (/^(kakao|카카오)$/.test(d))       return "kakao.com";
  return dom;
}

// 한글 스펠링(에이/비/씨…), 숫자(영/공/빵…)를 ascii로
const DIGIT_KO: Record<string,string> = { "영":"0","공":"0","빵":"0","일":"1","이":"2","삼":"3","사":"4","오":"5","육":"6","륙":"6","칠":"7","팔":"8","구":"9" };
const ALPHA_KO: Record<string,string> = { "에이":"a","비":"b","씨":"c","디":"d","이":"e","에프":"f","지":"g","에이치":"h","아이":"i","제이":"j","케이":"k","엘":"l","엠":"m","엔":"n","오":"o","피":"p","큐":"q","아르":"r","에스":"s","티":"t","유":"u","브이":"v","더블유":"w","엑스":"x","와이":"y","제트":"z","지드":"z" };

function koSpellToAscii(chunk: string) {
  const tokens = (chunk || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
  let out = "";
  for (let tk of tokens) {
    if (JUNK_TOKENS.has(tk)) continue;      // 🔴 이런 토큰은 버린다
    if (ALPHA_KO[tk]) { out += ALPHA_KO[tk]; continue; }
    if (tk in DIGIT_KO) { out += DIGIT_KO[tk]; continue; }
    if (tk === "점" || tk === "닷" || tk === "쩜") { out += "."; continue; }
    if (/^[a-z0-9._-]+$/.test(tk)) { out += tk; continue; }
  }
  return out;
}

// ID 누적: 한글 스펠링/숫자 지원 + 점(.)은 양옆이 영숫자일 때만 허용
function accumulateId(prevId: string, rawChunk: string) {
  let s = (rawChunk || "").toLowerCase();
  if (/\s/.test(s) || /[가-힣]/.test(s)) s = koSpellToAscii(s);
  else s = s.replace(/\s+/g, "");

  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === ".") {
      const prevChar = (prevId + out).slice(-1);
      const nextChar = s[i + 1] || "";
      if (/[a-z0-9]/.test(prevChar) && /[a-z0-9]/.test(nextChar)) out += ".";
      continue;
    }
    if (EMAIL_ID_ALLOWED.test(ch)) out += ch;
  }
  let merged = prevId + out;
  merged = merged.replace(/j{2,}/g, "j");   // jj → j (선택)
  merged = merged.replace(/\.{2,}/g, ".");  // .. → .
  return merged;
}

function isLikelyEmail(id: string, dom: string) {
  if (!id || !dom) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(`${id}@${dom}`);
}

// -------------------- 이름 추출 함수 추가 --------------------
function extractLikelyKoreanName(t: string) {
  const onlyKo = (t || "")
    .replace(/[^\uAC00-\uD7A3\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const cleaned = onlyKo
    .replace(/\b(안녕하세요|안녕|반갑습니다|저는|제\s*이름은)\b/g, " ")
    .replace(/\b(입니다|이에요|예|네|요|입니다요)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length === 0) return "";
  const cand = parts.length >= 2
    ? (parts[parts.length - 2] + parts[parts.length - 1]).trim()
    : parts[0];

  if (cand.length < 2 || cand.length > 6) return "";
  return cand;
}

// -------------------- 정규화/검증 --------------------
function cleanName(raw: string): string {
  return (raw || "")
    .replace(/[^a-zA-Z가-힣\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function normalizeEmail(raw: string): string {
  let t = (raw || "").toLowerCase().trim();
  t = t
    .replace(/\s+/g, " ")
    .replace(/골뱅이|앳|에이티/g, "@")
    .replace(/점\s?/g, ".")
    .replace(/닷컴|닷 컴|닷 콤/g, ".com")
    .replace(/\s+/g, "");
  t = t
    .replace(/지메일|gmail\.?com/g, "gmail.com")
    .replace(/네이버|naver\.?com/g, "naver.com")
    .replace(/다음|daum\.?net/g, "daum.net")
    .replace(/야후|yahoo\.?com/g, "yahoo.com");
  return t;
}
function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");
}
function isStrongPassword(v: string) {
  return (v || "").length >= 8;
}

// -------------------- TTS (간단 헬퍼) --------------------
function speak(text: string, lang = "ko-KR") {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

// TTS 중 STT 완전 정지를 위한 보호 함수
async function speakAsync(text: string, lang = "ko-KR"): Promise<void> {
  return new Promise((resolve) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      resolve();
    }
  });
}

// TTS 에코 차단 함수
function isEchoFromTTS(heard: string, last: string, lastEndAt: number, windowMs: number = 800): boolean {
  if (!heard || !last) return false;
  
  const now = Date.now();
  const timeDiff = now - lastEndAt;
  
  // 시간 창 내에서만 체크
  if (timeDiff > windowMs) return false;
  
  // 유사도 체크 (간단한 포함 관계)
  const heardLower = heard.toLowerCase();
  const lastLower = last.toLowerCase();
  
  // 한쪽이 다른 쪽을 포함하거나, 유사한 단어가 많으면 에코로 판단
  if (heardLower.includes(lastLower) || lastLower.includes(heardLower)) return true;
  
  // 공통 단어가 2개 이상이면 에코로 판단
  const heardWords = heardLower.split(/\s+/).filter(Boolean);
  const lastWords = lastLower.split(/\s+/).filter(Boolean);
  const commonWords = heardWords.filter(word => lastWords.includes(word));
  
  return commonWords.length >= 2;
}

// -------------------- 컴포넌트 --------------------
type Step = 0 | 1 | 2 | 3;

export default function VoiceSignUpFull() {
  const nav = useNavigate();
  const locationHook = useLocation();
  const locale = "ko-KR"; // 필요 시 i18n 연결
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sttMuted, setSttMuted] = useState(false);

  // 이메일 파트 상태 추가
  const [emailId, setEmailId] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [emailMode, setEmailMode] = useState<"id" | "domain">("id"); // 현재 듣는 대상
  const domainSwitchedRef = useRef(false); // 중복 전환 방지

  // 이름 전용 STT 상태
  const [nameListening, setNameListening] = useState(false);
  const nameRecRef = useRef<any>(null);
  
  // 이름 캡처 중 상태 (전역 STT 차단용)
  const isCapturingNameRef = useRef(false);

  // STT 로그 상태/함수 추가
  const [sttLog, setSttLog] = useState<string[]>([]);
  const sttLogRef = useRef<string[]>([]);
  const appendStt = (line: string) => setSttLog(prev => {
    const out = [...prev, `${new Date().toLocaleTimeString()} ${line}`].slice(-300);
    sttLogRef.current = out;
    return out;
  });

  // TTS 중 STT 완전 정지를 위한 ref
  const forceStopRef = React.useRef<null | (() => void)>(null);

  // "최종결과 없음" 안내 타이머 누적 버그 수정을 위한 ref
  const noFinalTimerRef = React.useRef<number | null>(null);

  // TTS 에코 차단을 위한 ref들
  const lastTextRef = useRef<string>("");
  const lastEndAtRef = useRef<number>(0);



  // TTS 중 STT 완전 정지를 위한 보호 함수
  const speakGuarded = async (msg: string, opts: { restart?: boolean } = { restart: true }) => {
    setUserStop(true);      // 의도적 중지 플래그
    // 🔴 TTS 전에 STT 완전 종료
    try { forceStopRef.current?.(); } catch {}
    try { stop(); } catch {}
    setSttMuted(true);

    await speakAsync(msg);  // TTS

    setSttMuted(false);
    setUserStop(false);

    if (opts.restart !== false) {
      // 에코 여운 대비 살짝 여유(800~1000ms) 후 재시작
      setTimeout(() => start(), 900);
    }
  };

  // 이메일 완성 시 자동으로 비밀번호 단계로 이동
  const maybeAutoNext = React.useCallback(() => {
    const id = emailId.trim();
    const dom = fixCommonDomain(emailDomain.trim());
    if (isLikelyEmail(id, dom)) {
      const finalEmail = `${id}@${dom}`;
      setEmail(finalEmail);
      
      // draft/모드 리셋
      setEmailMode("id");
      domainSwitchedRef.current = false;
      setEmailId("");
      setEmailDomain("");

      // 다음 단계로 자동 이동 + 안내 한번
      setStep(3);
      speakGuarded("비밀번호를 입력해 주세요.", { restart: false });
    }
  }, [emailId, emailDomain, setEmail, setEmailMode, setStep, speakGuarded]);

  const [srLog, setSrLog] = useState<string[]>([]);
  const log = (m: string) => setSrLog((xs) => [...xs.slice(-80), m]);

  // 이메일 음성 누적 함수 (기존 로직 유지)
  const onEmailSpeechFinal = (raw: string) => {
    // 공통 치환: 골뱅이/점
    let t = (raw || "").toLowerCase().trim();
    t = t.replace(AT_WORDS, "@").replace(DOT_WORDS, ".");

    // 1) '@'가 나오면 좌측은 ID에 누적, 우측은 도메인 모드로 전환
    if (t.includes("@")) {
      const [left, right = ""] = t.split("@");
      const idNew = accumulateId(emailId, left);
      setEmailId(idNew);
      setEmailMode("domain");
      const domNew = sanitizeDomain(emailDomain + right);
      setEmailDomain(fixCommonDomain(domNew));
      return;
    }

    // 2) provider(지메일/네이버/다음/한메일/카카오) 키워드가 감지되면 도메인 모드로 전환
    if (PROVIDER_RE.test(t)) {
      setEmailMode("domain");
      setEmailDomain(prev => {
        const merged = sanitizeDomain(prev + t);
        return fixCommonDomain(merged);
      });
      return;
    }

    // 3) 현재 모드에 따라 누적
    if (emailMode === "id") {
      setEmailId(prev => accumulateId(prev, t));
    } else {
      setEmailDomain(prev => fixCommonDomain(sanitizeDomain(prev + t)));
    }
  };

  // 이름 전용 STT 생성
  const ensureNameRec = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;
    if (!nameRecRef.current) {
      const rec = new SR();
      rec.lang = "ko-KR";
      rec.interimResults = false; // 이름은 최종 결과만 필요
      rec.maxAlternatives = 1;
      nameRecRef.current = rec;
    }
    return nameRecRef.current;
  }, []);

  // TTS 잔향 차단
  const stopTTSForName = useCallback(() => {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }, []);

  // ✅ 이름 인식 최종 처리
  const onNameFinal = useCallback((transcript: string) => {
    const cand = extractLikelyKoreanName(transcript);
    if (!cand) {
      setError("이름만 또렷하게 말씀해 주세요. (예: 홍길동)");
      appendStt("ℹ 이름 후보 없음");
      return;
    }
    setName(cand);
    setError(null); // 에러 메시지 제거
    appendStt(`✅ 이름 인식: ${cand}`);
    // 자동 진행 금지: 사용자가 '다음' 클릭해서 단계 이동
  }, []);



  // ✅ "말하기"에서 올라온 최종 텍스트를 여기서 처리 (새로운 로직)
  const onEmailSpeechFinalLocal = useCallback((raw: string) => {
    appendStt(`📧 "${raw}"`);

    let t = normalizeEmailMishear(raw).trim();   // ✅ 보정 먼저
    t = t.replace(DOT_WORDS, ".").replace(AT_WORDS, "@");

    if (emailMode === "id") {
      if (t.includes("@")) {
        const [left, right = ""] = t.split("@");
        const newId = (left || "").replace(/\s+/g, "").replace(/[^a-z0-9._-]/g, "");
        setEmailId(prev => prev + newId);
        appendStt(`👤 ID += "${left}" → "${emailId + newId}"`);

        if (!domainSwitchedRef.current) {
          domainSwitchedRef.current = true;
          setEmailMode("domain");
        }
        const domSeed = fixCommonDomain(sanitizeDomain(right));
        if (domSeed) setEmailDomain(prev => prev || domSeed);
        appendStt(`🌐 DOMAIN seed: "${domSeed || right}"`);
        return;
      }
      // provider 키워드가 먼저 나왔으면 전환만
      if (!emailId && /(gmail|naver|daum|hanmail|kakao)/.test(t)) {
        if (!domainSwitchedRef.current) {
          domainSwitchedRef.current = true;
          setEmailMode("domain");
        }
        const domSeed = t.match(/(gmail|naver|daum|hanmail|kakao)/)?.[1] ?? "";
        if (domSeed) setEmailDomain(prev => prev || fixCommonDomain(domSeed));
        return;
      }
      // 일반 아이디 누적
      const idAcc = (t || "").replace(/\s+/g, "").replace(/[^a-z0-9._-]/g, "");
      if (idAcc) setEmailId(prev => prev + idAcc);
      appendStt(`👤 ID += "${t}" → "${emailId + idAcc}"`);
      return;
    }

    // mode === 'domain'
    const domAcc = fixCommonDomain(sanitizeDomain(emailDomain + t));
    setEmailDomain(domAcc);
    appendStt(`🌐 DOMAIN += "${t}" → "${domAcc}"`);

    // **화면의 입력칸에도 즉시 보이도록 미리보기 값 만들어주기**
    setEmail(prev => {
      const preview = emailId ? `${emailId}@${domAcc}` : prev;
      return preview;
    });
  }, [emailMode, emailId, emailDomain, appendStt]);

  // HTTPS 가드 (로컬 localhost는 허용)
  useEffect(() => {
    if (location.protocol !== "https:" && location.hostname !== "localhost") {
      setError("⚠️ 보안 경고: 마이크 사용을 위해 HTTPS가 필요합니다.");
    }
  }, []);

  useEffect(() => {
    // 단계 진입 시 간단 안내(음성)
    const lines = [
      "이름을 말씀해 주세요. 예: 안녕하세요 이재만입니다",
      "이메일을 말씀해 주세요. 예: jaefan 골뱅이 지메일 점 컴",
      "비밀번호를 말씀해 주세요. 공개 장소에서는 직접 입력을 권장합니다.",
      "입력 내용을 확인하고 가입하기 버튼을 누르세요.",
    ];
    speak(lines[step], locale);
    
    // 이메일 단계 진입 시 초기화
    if (step === 1) {
      setEmailId("");
      setEmailDomain("");
      setEmailMode("id");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      try { nameRecRef.current?.stop(); nameRecRef.current?.abort(); } catch {}
    };
  }, []);

  // useSTT 훅 정의
  function useSTT(
    onText: (txt: string, isFinal: boolean) => void,
    opts?: { onLog?: (s: string) => void }
  ) {
    const Recognition =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : undefined;

    const [listening, setListening] = useState(false);
    const [available, setAvailable] = useState(false);
    const recRef = useRef<any>(null);
    const backoffRef = useRef(0);
    const userStopRef = useRef(false);

    useEffect(() => {
      if (!Recognition) { setAvailable(false); return; }
      const rec = new Recognition();
      recRef.current = rec;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 3;
      rec.lang = "ko-KR";

      rec.onstart = () => { opts?.onLog?.("▶ onstart"); };

      rec.onresult = (e: any) => {
        backoffRef.current = 0;
        let final = "", interim = "";
        const finals: string[] = [];
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const alt = e.results[i];
          const best = alt[0]?.transcript || "";
          if (alt.isFinal) {
            for (let k = 0; k < alt.length; k++) finals.push(alt[k].transcript);
            final += best;
          } else {
            interim += best;
          }
        }
        if (interim) opts?.onLog?.(`… ${interim}`);
        if (finals.length > 0) {
          const joined = finals.join(" ");
          opts?.onLog?.(`🎤 "${joined}"`);
          onText(joined, true);
        } else if (final) {
          opts?.onLog?.(`🎤 "${final}"`);
          onText(final, true);
        } else if (interim) {
          onText(interim, false);
        }
      };

      rec.onerror = (e: any) => {
        const code = e?.error || "unknown";
        opts?.onLog?.(`⚠ onerror: ${code}`);
        setListening(false);
        if (!userStopRef.current && code !== "aborted") {
          setTimeout(() => {
            try { rec.start(); setListening(true); } catch {}
          }, 1000 + backoffRef.current * 1000);
          backoffRef.current = Math.min(backoffRef.current + 1, 5);
        }
      };

      rec.onend = () => {
        opts?.onLog?.("■ onend");
        setListening(false);
        if (!userStopRef.current) {
          setTimeout(() => {
            try { rec.start(); setListening(true); } catch {}
          }, 500);
        }
      };

      setAvailable(true);
    }, []);

    const start = useCallback(() => {
      if (!recRef.current || listening) return;
      userStopRef.current = false;
      try {
        recRef.current.start();
        setListening(true);
        opts?.onLog?.("🎙 start");
      } catch {}
    }, [listening, opts]);

    const stop = useCallback(() => {
      userStopRef.current = true;
      try { recRef.current?.stop(); } catch {}
      setListening(false);
      opts?.onLog?.("🛑 stop");
    }, [opts]);

    const setUserStop = useCallback((stop: boolean) => {
      userStopRef.current = stop;
    }, []);

    const forceStop = useCallback(() => {
      userStopRef.current = true;
      try { recRef.current?.abort(); } catch {}
      // 재시작 타이머 제거
      backoffRef.current = 0;
    }, []);

    return { start, stop, setUserStop, listening, available, forceStop };
  }

  // 현재 필드 상태 추가
  const [currentField, setCurrentField] = useState<"name" | "email" | "pw">("name");

  // useSTT 훅 사용
  const { start, stop, setUserStop, listening: sttListening, available: sttOK, forceStop } =
    useSTT(async (text, isFinal) => {
      // 이름 캡처 중엔 아무 것도 하지 않도록 가드
      if (isCapturingNameRef.current) return;
      
      // TTS 에코 차단: 블록리스트 + 시간창 늘리기
      const raw = (text || "").trim();
      if (TTS_BLOCKLIST.some((re) => re.test(raw))) {
        // TTS 안내 멘트는 즉시 무시
        return;
      }
      if (isEchoFromTTS(raw, lastTextRef.current, lastEndAtRef.current, TTS_ECHO_WINDOW_MS)) {
        return;
      }
      
      // 이름 단계에서 TTS 문장 오인식 방지
      if (step === 1 && isFinal) {
        const cleanKo = raw.replace(/[^\uAC00-\uD7A3]/g, "");
        if (cleanKo.length < 2) return; // 너무 짧음

        if (/합니다|확인했습니다/.test(raw)) return; // 안내 멘트 오인식 컷
      }
      
      if (!isFinal) return;
      
      // 필드별 처리 로직
      if (currentField === "name") {
        onNameFinal(text);
        // "이름을 확인했습니다" 중복 호출 제거 - TTS 루프 방지
      } else if (currentField === "email") {
        onEmailSpeechFinalLocal(text);
        const id = emailId.trim();
        const dom = fixCommonDomain(emailDomain.trim());
        if (isLikelyEmail(id, dom)) {
          setEmail(`${id}@${dom}`);
          appendStt(`✅ 이메일 완성: ${id}@${dom}`);
          lastTextRef.current = `이메일 ${id}@${dom} 확인했습니다.`;
          lastEndAtRef.current = Date.now();
          speak(`이메일 ${id}@${dom} 확인했습니다.`, locale);
              } else {
        const currentStatus = emailMode === "id" ? `ID: ${id}` : `도메인: ${dom}`;
        appendStt(`현재 ${currentStatus} 입력 중`);
        lastTextRef.current = `현재 ${currentStatus} 입력 중입니다.`;
        lastEndAtRef.current = Date.now();
        speak(`현재 ${currentStatus} 입력 중입니다.`, locale);
      }
      
      // 이메일 완성 시 자동 진행 체크
      maybeAutoNext();
      } else if (currentField === "pw") {
        const pw = text.trim();
        setPw(pw);
        if (!isStrongPassword(pw)) {
          setError("비밀번호는 8자 이상이어야 합니다.");
          lastTextRef.current = "비밀번호는 8자 이상이어야 합니다.";
          lastEndAtRef.current = Date.now();
          speak("비밀번호는 8자 이상이어야 합니다.", locale);
        } else {
          appendStt(`✅ 비밀번호 확인: ${pw.length}자`);
          lastTextRef.current = "비밀번호 확인했습니다.";
          lastEndAtRef.current = Date.now();
          speak("비밀번호 확인했습니다.", locale);
        }
      }

      // "최종결과 없음" 안내 타이머 누적 버그 수정
      if (noFinalTimerRef.current) {
        clearTimeout(noFinalTimerRef.current);
        noFinalTimerRef.current = null;
      }
      noFinalTimerRef.current = window.setTimeout(() => {
        if (sttListening) {
          speakGuarded("제 목소리가 잘 들리지 않는 것 같아요. 마이크 가까이에서 또렷하게 말씀해 주세요.", { restart: true });
        }
      }, 6000);
    }, { onLog: appendStt });

  // forceStop을 ref에 저장 (렌더 순서 문제 해결)
  React.useEffect(() => {
    forceStopRef.current = forceStop;
  }, [forceStop]);

  // 자연어 파싱 결과 프리셋 적용
  React.useEffect(() => {
    const q = new URLSearchParams(locationHook.search);
    if (q.get("from") === "nat") {
      try {
        const raw = localStorage.getItem("vibe:preset");
        if (raw) {
          const p = JSON.parse(raw);
          setName(p.name ?? "");
          setEmail(p.email ?? "");
          setPw(p.password ?? "");
          // 전화번호는 가입 폼에 없으면 저장만 (필드 있으면 추가)
          setStep(3); // 바로 "확인 후 가입" 단계로
          localStorage.removeItem("vibe:preset");
        }
      } catch {}
    }
  }, [locationHook.search]); // eslint-disable-line

  // ✅ 이름 전용 STT 시작 (useSTT 훅 이후에 정의)
  const startName = useCallback(() => {
    // 1) 전역 STT 완전 중단(재시작 타이머까지)
    isCapturingNameRef.current = true;
    setUserStop(true);
    forceStop?.();         // <= useSTT가 제공 (abort + restartTimer clear)
    setUserStop(false);

    // 2) TTS가 말하고 있으면 즉시 중지 (에코/루프 방지)
    try { window.speechSynthesis?.cancel(); } catch {}

    // 3) 잔향 방지로 살짝 늦게 이름 인식기 시작
    setTimeout(() => {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) { setError("브라우저가 STT를 지원하지 않아요(https/localhost 필요)"); isCapturingNameRef.current = false; return; }

      const rec = new SR();
      nameRecRef.current = rec;
      rec.lang = "ko-KR";
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 3;

      rec.onstart  = () => appendStt("▶ onstart(name)");
      rec.onresult = (e: any) => {
        const text = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
        appendStt(`🎤(name) "${text}"`);
        onNameFinal(text);                       // ← 이름 추출/반영 함수
      };
      rec.onnomatch = () => appendStt("ℹ onnomatch(name)");
      rec.onerror = (err: any) => { appendStt(`⚠ onerror(name): ${err?.error || err}`); setNameListening(false); };
      rec.onend   = () => { appendStt("■ onend(name)"); setNameListening(false); isCapturingNameRef.current = false; };

      try { rec.start(); setNameListening(true); } catch {}
    }, 300);
  }, [appendStt, onNameFinal, forceStop, setUserStop]);

  // ✅ 이름 인식 종료 함수
  const stopName = useCallback(() => {
    try { nameRecRef.current?.stop(); } catch {}
    isCapturingNameRef.current = false;
  }, []);

  // ✅ "완성 후보"일 때만 커밋 + 로그 (useSTT 훅 이후에 정의)
  const onTryNext = useCallback(() => {
    const domFixed = fixCommonDomain(emailDomain);
    if (isLikelyEmail(emailId, domFixed)) {
      const finalEmail = `${emailId}@${domFixed}`;
      setEmail(finalEmail);
      appendStt(`✅ EMAIL 확정: ${finalEmail}`);

      // 초기화 및 다음 단계
      setEmailMode("id");
      domainSwitchedRef.current = false;
      setEmailId(""); 
      setEmailDomain("");
      setStep(3);
    } else {
      appendStt("⚠ 아직 이메일 형식이 완성되지 않았습니다.");
    }
  }, [emailId, emailDomain, setEmail, appendStt, setEmailMode, setStep]);



  // 기존 doListen 함수 (호환성을 위해 유지)
  const doListen = (field: "name" | "email" | "pw") => {
    setCurrentField(field);
    if (sttListening) return;
    setError(null);
    start();

    try {
      const SR = window.webkitSpeechRecognition || window.SpeechRecognition;
      if (!SR) {
        setListening(false);
        setError("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome/Edge를 권장합니다.");
        return;
      }
      const r: any = new SR();
      r.lang = locale;
      r.interimResults = true;
      r.maxAlternatives = 2;
      r.continuous = false;

      let finalText = "";
      let interimText = "";

      r.onstart = () => log("▶ onstart");
      r.onresult = (e: any) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          const t = (res?.[0]?.transcript || "").trim();
          if (!t) continue;
          if (res.isFinal) finalText = t;
          else interimText = t;
        }
        log(`🎯 onresult: "${finalText || interimText}"`);
      };
      r.onerror = (e: any) => {
        const code = e?.error || "unknown";
        log(`❌ onerror: ${code}`);
        setError(
          code === "not-allowed"
            ? "마이크 권한이 거부되었습니다. 주소창 왼쪽 🔒에서 허용으로 변경해 주세요."
            : code === "audio-capture"
            ? "마이크 장치를 찾을 수 없습니다. OS의 입력 장치를 확인해 주세요."
            : code === "no-speech"
            ? "말소리가 감지되지 않았습니다. 조금 더 크게 또렷하게 말씀해 주세요."
            : "음성 인식 오류가 발생했습니다. 다시 시도해 주세요."
        );
      };
      r.onend = () => {
        log("■ onend");
        setListening(false);
        const text = (finalText || interimText || "").trim();
        if (!text) return;

        if (field === "name") {
              // 1단계: 이름 인식 (자동 진행 제거)
              if (!finalText) return;

              const cand = extractLikelyKoreanName(text);
              if (cand && cand.replace(/[^\uAC00-\uD7A3]/g, "").length >= 2) {
                setName(cand);
                log(`✅ 이름 인식: ${cand}`);
                speak(`이름 ${cand} 확인했습니다.`, locale);
                // 자동 진행 금지: 사용자가 '다음' 클릭해서 단계 이동
          } else {
                if (typeof log === "function") {
                  log("ℹ️ 두 글자 이상의 이름으로 말씀해 주세요.");
                }
                setError("이름을 인식하지 못했습니다. 다시 말씀해 주세요.");
                speak("이름을 인식하지 못했습니다. 다시 말씀해 주세요.", locale);
          }
        } else if (field === "email") {
          // 2단계: 이메일
          if (!finalText) return;

          onEmailSpeechFinal(text);

          // 누적 결과로 email 갱신(둘 다 준비되면)
          const id = emailId.trim();
          const dom = fixCommonDomain(emailDomain.trim());
          if (isLikelyEmail(id, dom)) {
            setEmail(`${id}@${dom}`);
            speak(`이메일 ${id}@${dom} 확인했습니다.`, locale);
          } else {
            // 현재 누적 상태 안내
            const currentStatus = emailMode === "id" ? `ID: ${id}` : `도메인: ${dom}`;
            speak(`현재 ${currentStatus} 입력 중입니다.`, locale);
          }
        } else {
          const v = text.replace(/\s+/g, "");
          setPw(v);
          if (!isStrongPassword(v)) {
            setError("비밀번호는 8자 이상이어야 합니다.");
            speak("비밀번호는 8자 이상이어야 합니다.", locale);
          } else {
            speak("비밀번호 확인했습니다.", locale);
          }
        }
      };

      r.start();
      log(`🎙 start(lang=${r.lang})`);
    } catch (err: any) {
      setListening(false);
      setError(err?.message || "음성 인식 초기화 실패");
    }
  };

  // 드래프트 이메일 완성도 확인
  const draftEmail = emailId && emailDomain ? `${emailId}@${fixCommonDomain(emailDomain)}` : "";

  const stepValid =
    (step === 0 && cleanName(name.trim()).length >= 2) ||
    (step === 1 && (isValidEmail(email.trim()) || isValidEmail(draftEmail))) ||
    (step === 2 && isStrongPassword(pw)) ||
    step === 3;

  const next = () => {
    if (!stepValid) return;
    
    // 2단계 -> 3단계 이동 직전 이메일 보정
    if (step === 1) {
      const finalEmail = email || draftEmail;
      if (isValidEmail(finalEmail)) {
        setEmail(finalEmail);
        // 드래프트 초기화
        setEmailId(""); 
        setEmailDomain(""); 
        setEmailMode("id"); 
        domainSwitchedRef.current = false;
      }
    }
    
    const nextStep = Math.min(3, step + 1) as Step;
    setStep(nextStep);
    
    // 단계별 TTS 안내 (STT는 잠깐 쉬게)
    if (nextStep === 1) {
      speakGuarded("이름을 입력해 주세요.", { restart: false });
    } else if (nextStep === 2) {
      speakGuarded("이메일 주소를 입력해 주세요.", { restart: false });
    } else if (nextStep === 3) {
      speakGuarded("비밀번호를 입력해 주세요.", { restart: false });
    }
  };
  const prev = () => setStep((s) => (Math.max(0, s - 1) as Step));

  // Firebase 가입 흐름
  async function submitSignUp() {
    if (!isValidEmail(email) || !isStrongPassword(pw)) return;
    setBusy(true);
    setError(null);
    try {
      // 중복 이메일 미리 확인(UX 친화)
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods && methods.length > 0) {
        setError("이미 가입된 이메일입니다. 다른 이메일을 사용해 주세요.");
        speak("이미 가입된 이메일입니다.", locale);
        setBusy(false);
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, pw);
      // (이름은 보통 updateProfile로 표시명 설정. 필요 시 추가)
      speak("회원가입이 완료되었습니다. 환영합니다!", locale);
      alert(`가입 완료! 환영합니다, ${name || "사용자"}님`);
      console.log("✅ user:", cred.user);
      // TODO: 라우팅 이동 등
    } catch (e: any) {
      const msg = e?.message || "가입 중 오류가 발생했습니다.";
      setError(msg);
      speak("가입 중 오류가 발생했습니다.", locale);
    } finally {
      setBusy(false);
    }
  }

  // -------------------- UI --------------------
  const wrap: React.CSSProperties = {
    maxWidth: 560,
    margin: "32px auto",
    padding: "0 16px",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  };
  const title: React.CSSProperties = { fontSize: 22, fontWeight: 800, margin: "12px 0 4px" };
  const sub: React.CSSProperties = { color: "#64748b", marginBottom: 16 };
  const row: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center" };
  const btn: React.CSSProperties = {
    border: 0,
    background: "#2563eb",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
  };
  const ghost: React.CSSProperties = {
    border: "2px solid #e2e8f0",
    background: "#fff",
    color: "#334155",
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
  };
  const input: React.CSSProperties = {
    flex: 1,
    border: "2px solid #e2e8f0",
    borderRadius: 10,
    padding: "10px 12px",
    outline: "none",
  };
  const danger: React.CSSProperties = { color: "#dc2626", marginTop: 8 };

  return (
    <div style={wrap}>
      <h2 style={title}>음성 회원가입</h2>
      <div style={sub}>
        언어: {locale}{" "}
        {location.protocol !== "https:" && location.hostname !== "localhost" && (
          <span style={{ color: "#b91c1c", marginLeft: 8 }}>
            (HTTP 환경: 마이크 제약 가능)
          </span>
        )}
      </div>

      {/* 진행 바 */}
      <div style={{ height: 8, background: "#e2e8f0", borderRadius: 6, overflow: "hidden", margin: "12px 0 24px" }}>
        <div
          style={{
            height: "100%",
            width: `${(step + 1) * 25}%`,
            background: "#2563eb",
            transition: "width .15s",
          }}
        />
      </div>

      {step === 0 && (
        <section>
          <h3 style={title}>1/4 이름 말하기</h3>
          <p style={sub}>예) "안녕하세요 이재만입니다" / "제 이름은 백승권이에요"</p>
          <div style={row}>
            <input
              style={input}
              aria-label="이름"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button 
              style={ghost} 
              onClick={() => (!nameListening ? startName() : stopName())}
            >
              {nameListening ? "듣기 종료" : "🎙 말하기"}
            </button>
          </div>
          {name && cleanName(name).length < 2 && <div style={danger}>이름이 너무 짧습니다.</div>}
        </section>
      )}

      {step === 1 && (
        <section>
          <h3 style={title}>2/4 이메일 말하기</h3>
          <p style={sub}>예) "이메일은 jaeman 골뱅이 지메일 점 컴"</p>
          
          {/* EmailVoiceField 사용 */}
          <EmailVoiceField
            emailId={emailId}
            emailDomain={emailDomain}
            mode={emailMode}
            setEmailId={setEmailId}
            setEmailDomain={setEmailDomain}
            setMode={setEmailMode}
            domainSwitchedRef={domainSwitchedRef}
            pushLog={log}
            onTryNext={() => {
              const finalEmail = email || (emailId && emailDomain ? `${emailId}@${fixCommonDomain(emailDomain)}` : "");
              if (isValidEmail(finalEmail)) {
                setEmail(finalEmail);
                // 드래프트 초기화
                setEmailId(""); 
                setEmailDomain(""); 
                setEmailMode("id");
                domainSwitchedRef.current = false;
                setStep(2); // 비밀번호 단계로 이동
              }
            }}
            onFinal={onEmailSpeechFinalLocal}
          />
          
          {/* 수동 입력 필드 */}
          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>수동 입력</label>
            <input
              style={input}
              aria-label="이메일"
              placeholder="이메일을 직접 입력하세요"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (e.target.value) { 
                  setEmailId(""); 
                  setEmailDomain(""); 
                  setEmailMode("id");
                  domainSwitchedRef.current = false;
                }
              }}
            />
          </div>
          
          {!isValidEmail(email) && email && <div style={danger}>올바른 이메일 형식이 아닙니다.</div>}
        </section>
      )}

      {step === 2 && (
        <section>
          <h3 style={title}>3/4 비밀번호 말하기</h3>
          <p style={sub}>8자 이상 권장. (공개 장소에서는 직접 입력 권장)</p>
          <div style={row}>
            <input
              style={input}
              type="password"
              aria-label="비밀번호"
              placeholder="비밀번호"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            <button style={ghost} onClick={() => doListen("pw")} disabled={listening}>
              {listening ? "듣는 중..." : "🎙 말하기"}
            </button>
          </div>
          {!isStrongPassword(pw) && pw && <div style={danger}>비밀번호는 8자 이상이어야 합니다.</div>}
        </section>
      )}

      {step === 3 && (
        <section>
          <h3 style={title}>4/4 확인 후 가입</h3>
          <ul style={{ lineHeight: 1.8, color: "#334155" }}>
            <li><b>이름</b>: {name || "-"}</li>
            <li><b>이메일</b>: {email || "-"}</li>
          </ul>
          <p style={{ color: "#64748b" }}>※ 비밀번호는 보안상 표시하지 않습니다.</p>
        </section>
      )}

      {/* 오류 */}
      {error && <div style={danger}>{error}</div>}

      {/* STT 로그 (디버그용) */}
      <div style={{ marginTop: 16, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>🎤 STT 로그</div>
        <div
          style={{
            height: 120,
            overflow: "auto",
            fontSize: 11,
            fontFamily: "monospace",
            background: "#0f172a",
            color: "#e2e8f0",
            padding: 8,
            borderRadius: 4,
          }}
        >
          {sttLog.length === 0
            ? <span style={{ color: "#64748b" }}>음성 인식을 시작하면 로그가 표시됩니다...</span>
            : sttLog.map((msg, i) => <div key={i} style={{ marginBottom: 2 }}>{msg}</div>)}
        </div>
      </div>

      {/* 내비게이션 */}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button style={ghost} onClick={prev} disabled={step === 0}>이전</button>
        {step < 3 ? (
          <button style={{ ...btn, opacity: stepValid ? 1 : 0.6 }} onClick={next} disabled={!stepValid}>
            다음
          </button>
        ) : (
          <button
            style={{ ...btn, opacity: stepValid && !busy ? 1 : 0.6 }}
            onClick={submitSignUp}
            disabled={!stepValid || busy}
          >
            {busy ? "가입 중..." : "가입하기"}
          </button>
        )}
      </div>
    </div>
  );
}
