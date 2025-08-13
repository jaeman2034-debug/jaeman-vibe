// src/App.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase/firebase";
import { parseUtterance, reRankNameCandidates, reduceName } from "./utils/nluParser";
import { enrollMock } from "./utils/voiceprint";
// DOMAIN_WHITELIST는 제거 (사용하지 않음)
import { onEmailSpeechFinal, isLikelyEmail, EmailVoiceField } from "./utils/speechEmail";
import { speechToPassword, validatePassword } from "./utils/speechPassword";
import { normalizeName, appendNamePiece, isValidName } from "./utils/speechName";

// === domain cue 감지용 ===
const AT_WORDS = /(골뱅이|앳|\bat\b)/g;   // '@' 트리거
const DOT_WORDS = /(닷|점|쩜)/g;          // '.' 치환 전용

const PROVIDERS = ["gmail", "naver", "daum", "hanmail", "kakao"];
const PROVIDER_RE = /(gmail|naver|daum|hanmail|kakao)(?:\.?com|\.?net)?/;

// === 한글 -> 숫자/알파 매핑 ===
const DIGIT_KO: Record<string, string> = {
  "영":"0","공":"0","빵":"0","일":"1","이":"2","삼":"3","사":"4","오":"5","육":"6","륙":"6","칠":"7","팔":"8","구":"9",
};
const ALPHA_KO: Record<string, string> = {
  "에이":"a","비":"b","씨":"c","디":"d","이":"e","에프":"f","지":"g","에이치":"h","아이":"i","제이":"j","케이":"k","엘":"l","엠":"m","엔":"n","오":"o","피":"p","큐":"q","아르":"r","에스":"s","티":"t","유":"u","브이":"v","더블유":"w","엑스":"x","와이":"y","제트":"z","지드":"z",
};

const EMAIL_ID_ALLOWED = /[a-z0-9._-]/;

// 알파넘 판단
const _isAlnum = (c: string) => /[a-z0-9]/.test(c);

function koSpellToAscii(chunk: string) {
  const tokens = (chunk || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
  let out = "";
  for (const tk of tokens) {
    if (ALPHA_KO[tk]) { out += ALPHA_KO[tk]; continue; }
    if (tk in DIGIT_KO) { out += DIGIT_KO[tk]; continue; }
    if (tk === "점" || tk === "닷" || tk === "쩜") { out += "."; continue; }
    if (/^[a-z0-9._-]+$/.test(tk)) { out += tk; continue; }
  }
  return out;
}

/** 이전 ID에 음성 청크를 누적하면서, 의도된 점(.)만 보존 + 한글 스펠링 지원 */
function accumulateId(prevId: string, rawChunk: string) {
  let s = (rawChunk || "").toLowerCase();

  // 공백이 있거나 한글 스펠링일 수 있으면 토큰 단위 변환
  if (/\s/.test(s) || /[가-힣]/.test(s)) {
    s = koSpellToAscii(s);
  } else {
    s = s.replace(/\s+/g, "");
  }

  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (ch === ".") {
      // 점은 "알파넘 . 알파넘" 사이일 때만 보존
      const prevChar = (prevId + out).slice(-1);
      const nextChar = s[i + 1] || "";
      if (_isAlnum(prevChar) && _isAlnum(nextChar)) out += ".";
      continue;
    }

    if (EMAIL_ID_ALLOWED.test(ch)) out += ch;
  }
  return prevId + out;
}

const sanitizeDomain = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(DOT_WORDS, ".")
    .replace(/\s+/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^\./, "")
    .replace(/\.$/, "");

const fixDomainCommon = (dom: string) => {
  if (!dom) return dom;
  if (dom === "gmail") return "gmail.com";
  if (dom === "naver") return "naver.com";
  if (dom === "daum") return "daum.net";
  if (dom === "hanmail") return "hanmail.net";
  if (dom === "kakao") return "kakao.com";
  return dom;
};

// ID 끝에 말려들어간 'gmailcom/navercom/daumnet/...' 꼬리를 분리
function pullTrailingDomainFromId(id: string) {
  const tails = [
    ["gmailcom", "gmail.com"],
    ["gmail", "gmail.com"],
    ["navercom", "naver.com"],
    ["naver", "naver.com"],
    ["daumnet", "daum.net"],
    ["daum", "daum.net"],
    ["hanmailnet", "hanmail.net"],
    ["hanmail", "hanmail.net"],
    ["kakaocom", "kakao.com"],
    ["kakao", "kakao.com"],
  ];
  for (const [tail, dom] of tails) {
    if (id.endsWith(tail)) {
      return { id: id.slice(0, -tail.length), domainSeed: dom };
    }
  }
  return { id, domainSeed: "" };
}

const isLikelyEmailFull = (id: string, dom: string) =>
  !!id && !!dom && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(`${id}@${dom}`);

// ---- 비밀번호 음성 입력 컴포넌트 ----
function PasswordVoiceField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const [spellMode, setSpellMode] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [lastHeard, setLastHeard] = useState("");
  const recognitionRef = useRef<any>(null);

  const ensureRecognizer = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    if (!recognitionRef.current) {
      const rec = new SR();
      rec.lang = "ko-KR";
      rec.interimResults = false;
      rec.continuous = false;
      recognitionRef.current = rec;
    }
    return recognitionRef.current;
  }, []);

  const onSpeechFinal = useCallback((transcript: string) => {
    setLastHeard(transcript);
    const parsed = speechToPassword(transcript, { spellMode });
    onChange(parsed);

    const v = validatePassword(parsed);
    setHint(v.ok ? `✅ 규칙 충족 (${v.level})` : `ℹ️ 8자 이상, 문자+숫자 조합이 필요합니다. 현재: ${v.level}`);
  }, [onChange, spellMode]);

  const start = useCallback(() => {
    const rec = ensureRecognizer();
    if (!rec) {
      setHint("이 브라우저는 STT를 지원하지 않습니다(https/localhost 필요).");
      return;
    }
    rec.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
      onSpeechFinal(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    try { rec.start(); setListening(true); } catch {}
  }, [ensureRecognizer, onSpeechFinal]);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) rec.stop();
  }, []);

  const v = validatePassword(value);

  return (
    <div className="col" style={{ marginTop: 8 }}>
      <div className="row">
        <input
          type="password"
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="8자 이상, 문자+숫자"
        />
        <button type="button" className="btn" onClick={() => setSpellMode(s => !s)}>
          {spellMode ? "스펠링모드 ON" : "스펠링모드 OFF"}
        </button>
        {!listening ? (
          <button type="button" className="btn" onClick={start}>듣기 시작</button>
        ) : (
          <button type="button" className="btn" onClick={stop}>듣기 종료</button>
        )}
      </div>

      {/* 안전 표시: 실제 PW는 읽지 않고 길이/강도만 표기 */}
      <div className="note" style={{ marginTop: 8 }}>
        길이: {value.length} / 규칙: {v.ok ? "충족" : "미충족"} ({v.level})
      </div>

      {hint && <div className="note" style={{ marginTop: 8 }}>{hint}</div>}

      {lastHeard && (
        <div className="note" style={{ marginTop: 8, opacity: 0.8 }}>
          인식(미가공): <code className="codepill">{lastHeard}</code>
        </div>
      )}
    </div>
  );
}

// ---- STT/TTS 유틸 ----
declare global {
  interface Window { webkitSpeechRecognition: any; SpeechRecognition: any; }
}

// step은 1-5 숫자로 사용 (1:이름 2:이메일 3:비번 4:약관 5:완료)

// Form 타입은 App 컴포넌트 내부에서 정의

// 유효성 검사 함수
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const pwRe = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':",.<>/?]{8,}$/;

const vName = (s:string)=> s.trim().length >= 2;
const vEmail = (s:string)=> emailRe.test(s.trim());
const vPw = (s:string)=> pwRe.test(s);

// 가입 핸들러 (컴포넌트 내부로 이동 예정)

const validators = {
  name: (v: string) => v.trim().length >= 2,
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  password: (v: string) => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v), // 8자+영문+숫자
};





const pwStrength = (v:string) => {
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return Math.min(s,4);
};

function useTTS() {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  const lastTextRef = React.useRef<string>("");
  const lastEndAtRef = React.useRef<number>(0);

  const speakAsync = (text: string) =>
    new Promise<void>((resolve) => {
      if (!synth) return resolve();
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ko-KR";
      u.onend = () => {
        lastTextRef.current = text;
        lastEndAtRef.current = Date.now();
        resolve();
      };
      synth.speak(u);
    });

  return { speakAsync, cancel: () => synth?.cancel(), supported: !!synth, lastTextRef, lastEndAtRef };
}

function useSTT(onText: (txt: string, isFinal: boolean) => void) {
  const Recognition =
    typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : undefined;
  const recRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const [available, setAvailable] = useState<boolean>(!!Recognition);

  // 내부 상태/참조
  const userStopRef = useRef(false);           // 의도적 중지 중
  const isStartingRef = useRef(false);         // start() 중복 방지
  const restartTimerRef = useRef<number|null>(null);
  const lastErrRef = useRef<string>("");
  const backoffRef = useRef(0);
  const lastStartAtRef = useRef(0);
  const MIN_RESTART_INTERVAL = 2000;

  useEffect(() => {
    if (!Recognition) { setAvailable(false); return; }
    const rec = new Recognition();
    recRef.current = rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.lang = "ko-KR";


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
        } else interim += best;
      }
      if (finals.length > 0) onText(finals.join(" "), true);
      else if (final) onText(final, true);
      else if (interim) onText(interim, false);
    };
    rec.onerror = (e: any) => {
      const code = e?.error || "unknown";
      lastErrRef.current = code;
      if ((code === "aborted" || code === "no-speech") && userStopRef.current) {
        // 의도적 중지 동안의 aborted/no-speech는 무시
        return;
      }
      setListening(false);
      if (code !== "aborted") autoRestart();
    };
    rec.onend = () => {
      if (document.hidden) return;     // 탭 숨김 시 재시작 금지
      if (userStopRef.current) return; // 의도적 중지 시 재시작 금지
      if (lastErrRef.current === "aborted") { lastErrRef.current = ""; return; }
      setListening(false);
      autoRestart();
    };
  }, []); // eslint-disable-line

  const autoRestart = () => {
    if (userStopRef.current) return;
    const delay = Math.min(3000, (backoffRef.current || 0) + 600);
    backoffRef.current = delay;
    startSafe(delay);
  };

  // 안전 시작/중지
  const startSafe = (delay = 0) => {
    if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null; }
    restartTimerRef.current = window.setTimeout(() => {
      const now = Date.now();
      if (isStartingRef.current || listening) return;
      if (now - lastStartAtRef.current < MIN_RESTART_INTERVAL) return;
      try {
        isStartingRef.current = true;
        recRef.current?.start();
        setListening(true);
        lastStartAtRef.current = now;
        lastErrRef.current = "";
        // 외부 로그 호출은 훅 밖에서 해주세요(선택)
      } catch { /* InvalidStateError 등 무시 */ }
      finally { isStartingRef.current = false; }
    }, delay);
  };

  const stopSafe = () => {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  };

  // 강력한 마이크 중지 (초기화용)
  const forceStop = () => {
    try { 
      recRef.current?.stop(); 
      recRef.current?.abort(); // 강제 중단
    } catch {}
    setListening(false);
    setUserStop(true);
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  // 외부에서 TTS용 플래그 제어할 수 있게 노출
  const setUserStop = (v: boolean) => { userStopRef.current = v; };

  // 외부에 안전 API 제공
  return {
    start: (delay = 0) => startSafe(delay),
    stop: () => stopSafe(),
    forceStop: () => forceStop(), // 강력한 중지 함수 추가
    setUserStop,
    listening,
    available,
  };
}

// ---- 에코 가드 ----
const isEchoFromTTS = (heard:string, last:string, lastEndAt:number, windowMs=800) => {
  const within = Date.now() - lastEndAt < windowMs;
  if (!within) return false;
  const h = (heard||"").toLowerCase().replace(/\s+/g," ").replace(/[.,!?~""'']/g,"").trim();
  const l = (last||"").toLowerCase().replace(/\s+/g," ").replace(/[.,!?~""'']/g,"").trim();
  if (!h || !l) return false;
  if (h.includes(l.slice(0, Math.min(l.length, 12)))) return true;
  const hSet = new Set(h.split(" ")), lSet = new Set(l.split(" "));
  const inter = [...hSet].filter(w => lSet.has(w)).length;
  const union = new Set([...hSet, ...lSet]).size || 1;
  return inter / union >= 0.6;
};



// ---- App ----
export default function App() {
  // Sticky state 훅 (풀 리로드/크래시 후에도 상태 보존)
  function useStickyState<T>(key: string, initial: T) {
    const [value, setValue] = React.useState<T>(() => {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : initial; }
      catch { return initial; }
    });
    React.useEffect(() => {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }, [key, value]);
    return [value, setValue] as const;
  }

  // Form 타입 정의 (중복 제거)
  type Form = {
    name: string;
    email: string;
    password: string;
    termsRequired: boolean;   // 필수 약관
    termsMarketing: boolean;  // 선택 약관
  };

  const [step, setStep] = useStickyState<number>("vibe:step", 1); // 1:이름 2:이메일 3:비번 4:약관 5:완료
  const [form, setForm] = useStickyState<Form>("vibe:form", { 
    name: "", 
    email: "", 
    password: "", 
    termsRequired: false, 
    termsMarketing: false 
  });

  // 누적 파트(이미 있으면 유지)
  const [emailIdPart, setEmailIdPart] = useStickyState("vibe:email:id", "");
  const [emailDomainPart, setEmailDomainPart] = useStickyState("vibe:email:dom", "");

  // 커밋 이후 누적을 막는 잠금
  // emailLocked는 제거 (사용하지 않음)
  const committedRef = useRef(false);      // 중복 커밋 방지

  // === 이메일 STT 핫픽스 상태들 ===
  const [emailId, setEmailId] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [mode, setMode] = useState<"id" | "domain">("id");
  
  // UI 에러 상태 (중복 이메일 등)
  const [uiError, setUiError] = useState<{ code?: string; message?: string; email?: string } | null>(null);
  const [signupDone, setSignupDone] = useState(false); // 성공 배지 노출용(선택)

  // === 이름 STT 상태 ===
  const [fullName, setFullName] = useState("");
  const [nameHint, setNameHint] = useState<string | null>(null);
  const [nameListening, setNameListening] = useState(false);
  const nameRecRef = useRef<any>(null);

  // 전환 한번만 허용 가드
  const domainSwitchedRef = useRef(false);

  // 로그 헬퍼는 제거 (사용하지 않음)

  // --- refs (최신 step/id/dom을 STT 콜백에서 쓰기 위해) ---
  const stepRef = useRef(step);
  useEffect(() => { stepRef.current = step; }, [step]);

  const emailIdRef = useRef(emailIdPart);
  useEffect(() => { emailIdRef.current = emailIdPart; }, [emailIdPart]);

  const emailDomRef = useRef(emailDomainPart);
  useEffect(() => { emailDomRef.current = emailDomainPart; }, [emailIdPart]);

  // 이메일 단계 진입 시 초기화
  useEffect(() => {
    if (step === 2) {
      resetEmail();              // ✅ 단계 진입 시 초기화
      // 핫픽스 상태들도 초기화
      setEmailId("");
      setEmailDomain("");
      setMode("id");
      domainSwitchedRef.current = false;
    }
  }, [step]);

  // 크래시/예외를 디버그 로그에 찍기
  useEffect(() => {
    const onErr = (e: ErrorEvent) => pushLog(`❌ runtime error: ${e.message}`);
    const onRej = (e: PromiseRejectionEvent) => pushLog(`❌ unhandled rejection: ${String(e.reason)}`);
    const onCrash = (e: any) => pushLog(`🧯 boundary crash: ${e.detail?.error?.message ?? e.detail}`);

    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    window.addEventListener("app:crash", onCrash);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
      window.removeEventListener("app:crash", onCrash);
    };
  }, []);

  // 자동 커밋 타이밍 (ID와 domain이 모두 채워졌을 때)
  useEffect(() => {
    if (!committed && emailIdPart && emailDomainPart) commitEmail();
  }, [emailIdPart, emailDomainPart]); // 또는 [emailDraft]

  // 파생값
  const emailDraft = emailIdPart && emailDomainPart
    ? `${emailIdPart}@${emailDomainPart}`
    : "";
  const committed = !!form.email;

  // inputValue는 제거 (사용하지 않음)

  // 이메일 상태 초기화
  const resetEmail = () => {
    setEmailIdPart(""); setEmailDomainPart("");
    setForm(f => ({ ...f, email: "" }));
    // setEmailLocked는 제거 (사용하지 않음)
    committedRef.current = false;
    pushLog("♻️ 이메일 입력 초기화");
  };

  // 최종 반영("다음", "확인" 등에서 호출)
  const commitEmail = () => {
    if (committedRef.current) return;      // 중복 방지
    // canPreviewEmail은 제거 (speechEmail.tsx에서 처리)
    if (!emailDraft) {
      pushLog("⚠️ 이메일이 완성되지 않았어요. (아이디/도메인 확인)");
      return;
    }
    setForm(f => ({ ...f, email: emailDraft }));   // ✅ 확정 저장
    // setEmailLocked는 제거 (사용하지 않음)
    committedRef.current = true;
    pushLog(`✅ 이메일 확정: ${emailDraft}`);
    
    // ✅ 커밋 후 draft 초기화 (중복 누적 방지)
    setEmailIdPart("");
    setEmailDomainPart("");
  };
  
  const [logs, setLogs] = useStickyState<string[]>("vibe:logs", []);
  const [recognizingText, setRecognizingText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [userUid, setUserUid] = useState<string | null>(null);
  const [sttMuted, setSttMuted] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  


  const { speakAsync, cancel: stopTTS, supported: ttsOK, lastTextRef, lastEndAtRef } = useTTS();
  
  const pushLog = (m: string) => setLogs((prev) => [new Date().toLocaleTimeString(), m, ...prev]);
  
  // pickDomain은 제거 (EmailVoiceField에서 처리)
  
  // 서비스+TLD 조합 래치는 제거 (speechEmail.tsx에서 처리)
  
// emailBufRef와 pushEmailUtter는 제거 (speechEmail.tsx에서 처리)

// 가입 핸들러 (컴포넌트 내부)
const handleSignup = async () => {
  setError("");
  if (!vName(form.name)) return setError("이름을 2자 이상 입력해주세요.");
  if (!vEmail(form.email)) return setError("올바른 이메일 형식이 아닙니다.");
  if (!vPw(form.password)) return setError("비밀번호는 8자 이상, 문자+숫자 조합이어야 해요.");
  if (!form.termsRequired) return setError("필수 약관에 동의해 주세요.");

  try {
    setSubmitting(true);

    // 1) Auth 계정 생성
    const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
    await updateProfile(cred.user, { displayName: form.name.trim() });

    // 2) Firestore 프로필 문서
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      marketingConsent: !!form.termsMarketing,
      provider: "password",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // 3) 이메일 인증(선택) – 원하면 켜기
    try { await sendEmailVerification(cred.user); } catch {}

    // 4) 완료 화면으로
    setStep(5);
  } catch (e:any) {
    const msg = e?.code || e?.message || String(e);
    if (msg.includes("email-already-in-use")) setError("이미 가입된 이메일이에요.");
    else setError("가입 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    console.error("signup error:", e);
  } finally {
    setSubmitting(false);
  }
};
  


// stripEmailNoise는 제거 (speechEmail.tsx에서 처리)

// 한국어→영문/숫자 정규화는 제거 (speechEmail.tsx에서 처리)

// 도메인/아이디 구분 유틸은 제거 (speechEmail.tsx에서 처리)

// canPreviewEmail은 제거 (speechEmail.tsx에서 처리)

// normalizeEmailSpeech는 제거 (speechEmail.tsx에서 처리)

// contextualDisambig는 제거 (사용하지 않음)

// 겹침 병합: prev 뒤와 frag 앞의 최장 공통접미/접두를 찾아 한 번만 붙임
// mergeWithOverlap은 제거 (사용하지 않음)

// extractEmailParts는 제거 (speechEmail.tsx에서 처리)

// hasDomainCue와 DENY_SLD는 제거 (사용하지 않음)

// fixAmbiguousId는 제거 (사용하지 않음)

// stripDomainWords는 제거 (사용하지 않음)

// cleanChunkForId는 제거 (사용하지 않음)

// 철자/숫자 정규화 함수들은 제거 (speechEmail.tsx에서 처리)

// normalizeDomain은 제거 (speechEmail.tsx에서 처리)

// smartMergeId는 제거 (사용하지 않음)

// normEmailSpeech는 제거 (speechEmail.tsx에서 처리)





// isDomain과 isNumToken은 제거 (speechEmail.tsx에서 처리)







// normalizeNumbers는 제거 (사용하지 않음)

// 철자 단어 → 알파벳 (jay, kay, double u 등)


// accumulateEmailFromText는 제거 (speechEmail.tsx에서 처리)

// routeEmailToken은 제거 (speechEmail.tsx에서 처리)

// updateEmailPreview는 제거 (사용하지 않음)
  
// calcEmailDraft는 제거 (사용하지 않음)
  
useEffect(() => {
  // ✅ form.email 자동 설정 금지 - commitEmail()에서만 설정
  
  // 도메인 유효성 검사는 speechEmail.tsx에서 처리
}, [emailIdPart, emailDomainPart]);  // ⬅️ 오직 이 두 상태만 의존
  
  const { start, stop, setUserStop, listening, available: sttOK } = useSTT(async (text, isFinal) => {
    if (sttMuted) return;
    if (isEchoFromTTS(text, lastTextRef.current, lastEndAtRef.current)) return;

    setRecognizingText(text);

    // ✅ 이메일 단계면 새로운 핫픽스 로직 사용
    if (stepRef.current === 2 && isFinal) {
      onEmailSpeechFinalLocal(text);
      return;
    }

    // 이메일 관련 말이는 speechEmail.tsx에서 처리

    // 2글자 미만이 계속 들어오면 무시
    if (isFinal && (text.replace(/[^\uAC00-\uD7A3]/g,"").length < 2)) {
      // ✅ 이메일 단계 + (ID 또는 도메인이 비어 있으면) 짧아도 처리
      if (stepRef.current === 2 &&
          (!emailIdRef.current || !emailDomRef.current)) {
        // accumulateEmailFromText는 speechEmail.tsx에서 처리
      } else {
        pushLog("⏭️ too short, ignored");
      }
      return;
    }

    // 6초 동안 최종 결과가 없으면 안내 멘트
    let noFinalTimer: any;
    clearTimeout(noFinalTimer);
    noFinalTimer = setTimeout(() => {
      if (listening) speakGuarded("제 목소리가 잘 들리지 않는 것 같아요. 마이크 가까이에서 또렷하게 말씀해 주세요.");
    }, 6000);

    // 이름 단계 소프트 게이트: 영어/숫자/기호 위주거나 너무 짧으면 버림
    if (step === 1) {
      const raw = text || "";
      // 1) 영어/숫자 위주면 컷
      if (/[a-z0-9]/i.test(raw)) return;

      // 2) 한글만 추출하여 길이 확인 (2자 미만은 컷)
      const kr = raw.replace(/[^\uAC00-\uD7A3]/g, "");
      if (kr.length < 2) return;

      // 3) 흔한 잡음 단어 컷
      const noise = ["안녕하세요","테스트","반복","다음","뒤로","시작","정지","취소"];
      if (noise.some(w => raw.includes(w))) return;
    }

    if (!isFinal) return;

    // 이름 단계에서만 재순위를 먼저 돌린 뒤 NLU를 태운다
    let processed = text;
    if (step === 1 && isFinal) {
      // finals 배열이 없더라도 한 문장만 넣어 재랭킹 (마지막 음절 '구/우/호/희' 힌트 반영)
      const picked = reRankNameCandidates([text], text);
      if (picked) processed = picked;
    }

    // NLU 사용
    const { intent, slot } = parseUtterance(processed);

    if (intent === "NOISE") return;

    if (intent === "SET_NAME" && slot?.name) {
      // diarization/voiceprint로 얻은 sameSpeaker(없으면 false)
      const sameSpeaker = true; // 일단 기본값, 나중에 실제 값으로 대체
      
      const { next, updated, reason } = reduceName(form.name, text, { sameSpeaker });
      if (updated) {
        setForm(f => ({ ...f, name: next }));
        pushLog(`📝 이름 인식: ${next} (${reason})`);
      } else {
        // 업데이트 안 함: 다른 화자거나, 너무 달라서 보류 등
        pushLog(`ℹ️ 이름 유지 (${reason})`);
      }
      return;
    }

    if (intent === "SET_PASSWORD" && slot?.password) {
      const v = slot.password;
      setForm(f => ({ ...f, password: v }));
      pushLog("🔒 비밀번호 인식(내용 비공개)");
      if (validators.password(v)) {
        setTimeout(async () => {
          setStep(4);
          await speakGuarded("확인합니다. 성함과 전자우편 정보를 읽어드릴게요. 비밀번호는 보안을 위해 말하지 않겠습니다.");
        }, 250);
      } else {
        await speakGuarded("비밀번호는 8자 이상, 영문과 숫자를 포함해야 해요. 다시 말씀해 주세요.");
      }
      return;
    }

    if (intent === "NEXT") return void goNext();
    if (intent === "BACK") return void goBack();
    if (intent === "CANCEL") {
      setForm({ name: "", email: step === 2 ? form.email : "", password: "", termsRequired: false, termsMarketing: false });
      if (step !== 2) {
        setEmailIdPart(""); // 이메일 누적 상태도 초기화
        setEmailDomainPart("");
      }
      setStep(1);
      await speakGuarded("초기화했습니다. 처음부터 다시 진행합니다.");
      return;
    }
    if (intent === "REPEAT") {
      await speakGuarded(promptOf(step), { restart: false });
      return;
    }
    if (intent === "START") { await speakGuarded(promptOf(step)); return; }
    if (intent === "STOP") { stop(); await speakGuarded("음성 인식을 종료했습니다.", { restart:false }); return; }

    // 미매칭은 간단히 안내
    await speakGuarded("죄송해요, 이해하지 못했어요.", { restart: false });
  });

  // step은 1-5 숫자로 사용하므로 stepOrder 불필요
  const stepIndex = step - 1; // 1-based to 0-based index

  const promptOf = (s: number) =>
    ({
      1: "성함을 입력해 주세요. (2자 이상)",
      2: "이메일 주소를 입력해 주세요.",
      3: "비밀번호를 입력해 주세요. (8자 이상, 문자+숫자)",
      4: "약관에 동의해 주세요.",
      5: "회원가입이 완료되었습니다!",
    }[s] || "알 수 없는 단계");

  // TTS 안전 호출: STT 완전 중지 → 멘트 → 재시작
  const speakGuarded = async (msg: string, opts: { restart?: boolean } = { restart: true }) => {
    setUserStop(true);    // 의도적 중지 플래그 ON
    stop();               // 안전 중지 (abort 사용 X)
    setSttMuted(true);
    await speakAsync(msg);
    setSttMuted(false);
    setUserStop(false);   // 플래그 OFF
    if (opts.restart !== false) start(600); // 잔향 대비 지연 후 재시작
  };

  const goBack = () => {
    const prevStep = Math.max(1, step - 1);
    setStep(prevStep);
  };

  const goNext = async () => {
    if (step === 1) {
      if (!validators.name(form.name)) { await speakGuarded("성함이 조건에 맞지 않아요. 다시 말씀해 주세요."); return; }
      setEmailIdPart(""); // 이메일 누적 상태 초기화
      setEmailDomainPart("");
      setStep(2); await speakGuarded(promptOf(2)); return;
    }
    if (step === 2) {
      if (!committed && emailDraft) commitEmail();  // ✅ 커밋 먼저
      if (!validators.email(form.email)) { await speakGuarded("전자우편 형식이 올바르지 않아요. 다시 말씀해 주세요."); return; }
      setStep(3); await speakGuarded(promptOf(3)); return;
    }
    if (step === 3) {
      if (!validators.password(form.password)) { await speakGuarded("비밀번호는 8자 이상이어야 합니다."); return; }
      setStep(4);
      await speakGuarded(`확인합니다. 성함 ${form.name}, 전자우편 ${form.email}. 이 정보로 가입할까요?`);
      return;
    }
    if (step === 4) { await onConfirmSignup(); return; }
  };

  // 예시: 약관 동의 단계에서 호출하는 함수
  const onConfirmSignup = async () => {
    const finalEmail =
      (form.email?.trim?.() || `${emailId}@${fixDomainCommon(emailDomain)}`).toLowerCase();
    const finalPassword = form.password; // 너희 비밀번호 상태 변수

      setSubmitting(true);
    setUiError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, finalEmail, finalPassword);
      await updateProfile(cred.user, { displayName: form.name });
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name: form.name, email: finalEmail,
        createdAt: serverTimestamp(), provider: "password", voice_signup: true,
      });
      setUserUid(cred.user.uid);
      setSignupDone(true);
      // TODO: 완료 화면 이동 or 홈으로 이동
      // navigate("/");  // 필요 시
    } catch (e: any) {
      if (e?.code === "auth/email-already-in-use") {
        setUiError({ code: e.code, message: "이미 가입된 이메일입니다.", email: finalEmail });
      } else {
        setUiError({ code: e?.code, message: e?.message ?? "가입에 실패했습니다." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    pushLog("ℹ️ 안내 시작");
    if (ttsOK) speakGuarded("음성 회원가입 화면입니다. '듣기 시작'을 누르고 진행하세요.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 마이크 레벨 모니터링
  useEffect(() => {
    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let raf = 0, src: MediaStreamAudioSourceNode | null = null;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { noiseSuppression:true, echoCancellation:true, autoGainControl:true, channelCount:1, sampleRate:16000 }
        });
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        src = ctx.createMediaStreamSource(stream);
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const loop = () => {
          analyser!.getByteTimeDomainData(data);
          // 0~1 rms 근사
          let sum = 0; for (let i=0;i<data.length;i++){ const v=(data[i]-128)/128; sum += v*v; }
          const rms = Math.sqrt(sum/data.length);
          setMicLevel(rms);
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch (e) { console.warn("mic meter error", e); }
    })();
    return () => { cancelAnimationFrame(raf); src?.disconnect(); analyser?.disconnect(); ctx?.close(); };
  }, []);

  // 탭 숨김/복귀 이벤트 처리
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden && !listening) {
        start(300);
      } else if (document.hidden && listening) {
        setUserStop(true);
        stop();
        setUserStop(false);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [listening, start, stop, setUserStop]);

  // 안전 클릭 핸들러
  const handleListenClick = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (listening) {
      if (!committed && emailDraft) commitEmail();  // 권장
      setUserStop(true);
      stop();
      setUserStop(false);
      return;
    }
    try {
      // enrollMock이 있으면 실행, 없으면 무시
      if (enrollMock) {
        await enrollMock();
      }
    setUserStop(false);
    start(0);
    } catch (error) {
      console.error("듣기 시작 오류:", error);
      pushLog("❌ 듣기 시작 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (!sttOK) pushLog("⚠️ 이 브라우저는 Web Speech API(음성 인식)를 지원하지 않을 수 있습니다.");
    if (!ttsOK) pushLog("⚠️ 이 브라우저는 음성 합성을 지원하지 않을 수 있습니다.");
  }, [sttOK, ttsOK]);

  // canNextFromUI는 제거 (사용하지 않음)

  // === 이름 STT 핸들러 ===
  // TTS가 말하는 중이면 STT 시작 전에 끄기
  const stopTTSForName = () => {
    try {
      if (window.speechSynthesis?.speaking || window.speechSynthesis?.pending) {
        window.speechSynthesis.cancel();
      }
    } catch {}
  };

  const ensureNameRec = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    if (!nameRecRef.current) {
      const rec = new SR();
      rec.lang = "ko-KR";
      rec.interimResults = false;
      rec.continuous = false;
      nameRecRef.current = rec;
    }
    return nameRecRef.current;
  }, []);

  const onNameFinal = useCallback((transcript: string) => {
    // ✅ 여기서 더 이상 "길이<2면 무시" 같은 조기 리턴 하지 않음
    const { name } = appendNamePiece(fullName, transcript);
    const clean = normalizeName(name);
    setFullName(clean);
    setForm(f => ({ ...f, name: clean }));

    // 디버깅 로그 추가
    console.log("🔍 이름 인식:", { transcript, name, clean, fullName: clean, length: clean.length });

    if (clean.length >= 2) setNameHint("✅ 이름 인식 완료");
    else setNameHint("ℹ️ 두 글자 이상 말씀해 주세요. 예: 홍 길 동 → '홍길동'");
  }, [fullName]);

  const startName = useCallback(() => {
    stopTTSForName();                           // TTS 먼저 끄기
    setTimeout(() => {                          // 잔향 방지 딜레이
      const rec = ensureNameRec();
      if (!rec) { setNameHint("브라우저가 STT를 지원하지 않아요(https/localhost 필요)"); return; }
      rec.onresult = (e: any) => {
        const text = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
        onNameFinal(text);
      };
      rec.onerror = () => setNameListening(false);
      rec.onend = () => setNameListening(false);
      try { rec.start(); setNameListening(true); } catch {}
    }, 250);
  }, [ensureNameRec, onNameFinal]);

  const stopName = useCallback(() => {
    const rec = nameRecRef.current;
    if (rec) rec.stop();
  }, []);

  // === 이메일 STT 핫픽스 핵심 로직 ===
  const onEmailSpeechFinalLocal = useCallback((raw: string) => {
    let t = (raw || "").toLowerCase().trim();

    // 공통 치환
    t = t.replace(DOT_WORDS, "."); // '점/닷/쩜' -> '.'
    t = t.replace(AT_WORDS, "@");  // '골뱅이/앳/at' -> '@'

    if (mode === "id") {
      // 1) '@'로 명시 전환
      if (t.includes("@")) {
        const [left, right = ""] = t.split("@");
        let idNew = accumulateId(emailId, left);

        // (보정) ID 꼬리에 도메인 단서가 말려들었으면 떼어내서 domainSeed로
        const pulled = pullTrailingDomainFromId(idNew);
        idNew = pulled.id;
        setEmailId(idNew);

        if (!domainSwitchedRef.current) {
          domainSwitchedRef.current = true;
          setMode("domain");
          pushLog("🌐 도메인 입력 모드로 전환");
        }

        const domSeed = fixDomainCommon(sanitizeDomain(pulled.domainSeed || right));
        setEmailDomain(prev => prev || domSeed);
        return;
      }

      // 2) '지메일/네이버...'가 먼저 나왔는데 아직 ID가 비어있는 경우 → 전환 금지 + 안내
      const m = t.match(PROVIDER_RE);
      if (!emailId && m) {
        pushLog("⚠️ 먼저 아이디를 말씀해 주세요. 예: '제이 에이 이, 맨'");
        // provider 단어는 ID에 누적하지 않음
        return;
      }

      // 3) provider가 포함된 경우 ID 부분만 추출하여 누적
      if (m) {
        const idx = t.indexOf(m[0]);
        const left = t.slice(0, idx);
        const right = t.slice(idx); // provider부터 끝까지

        let idNew = accumulateId(emailId, left);
        const pulled = pullTrailingDomainFromId(idNew);
        idNew = pulled.id;
        setEmailId(idNew);

        if (!domainSwitchedRef.current) {
          domainSwitchedRef.current = true;
          setMode("domain");
          pushLog("🌐 도메인 입력 모드로 전환(키워드)");
        }

        const domSeed = fixDomainCommon(
          sanitizeDomain(pulled.domainSeed || right)
            .replace(/^(gmail|naver|daum|hanmail|kakao)$/, (_,$1)=>fixDomainCommon($1))
        );
        setEmailDomain(prev => prev || domSeed);
        return;
      }

      // 3) 일반 ID 누적 ('.'은 제거된 상태)
      const idAcc = accumulateId(emailId, t);
      setEmailId(idAcc);
      pushLog(`👤 ID 조각 추가: ${t} → 누적: ${idAcc}`);
      return;
    }

    // === mode === 'domain' ===
    const domAcc = fixDomainCommon(sanitizeDomain(emailDomain + t));
    setEmailDomain(domAcc);
    pushLog(`🌐 DOMAIN 조각 추가: ${t} → 누적: ${domAcc}`);
    
    // 기존 상태와 동기화
    setEmailIdPart(emailId);
    setEmailDomainPart(emailDomain);
  }, [mode, emailId, emailDomain, emailIdPart, emailDomainPart]);

  // === 완료 후보 검사 후 다음 단계로 이동 ===
  const onTryNext = () => {
    const domFixed = fixDomainCommon(emailDomain);
    if (isLikelyEmailFull(emailId, domFixed)) {
      // 이메일 완성 시 form.email에 저장
      const finalEmail = `${emailId}@${domFixed}`;
      setForm(f => ({ ...f, email: finalEmail }));
      setEmailIdPart(emailId);
      setEmailDomainPart(domFixed);
      
      // 상태 초기화
      setMode("id");
      domainSwitchedRef.current = false;
      setEmailId("");
      setEmailDomain("");
      
      pushLog(`✅ 이메일 완성: ${finalEmail}`);
      setStep(3); // 다음 단계로 이동
    } else {
      pushLog("⚠️ 이메일 형식이 아직 완성되지 않았어요.");
    }
  };

  return (
    <div className="app">
      <style>{css}</style>

      <header className="header">
        <div className="logo">V</div>
        <div>
          <div className="title">VIBE 플랫폼</div>
          <div className="subtitle">음성 기반 회원가입</div>
        </div>
        <div className="header-right">
          <Badge ok={sttOK}>STT</Badge>
          <Badge ok={ttsOK}>TTS</Badge>
          <div style={{marginLeft:8, minWidth:90, fontSize:12, opacity:.8}}>
            MIC {micLevel.toFixed(2)}
            <div style={{height:6, background:"rgba(255,255,255,.08)", borderRadius:6}}>
              <div style={{height:6, width:`${Math.min(100, micLevel*400)}%`, background:"#22c55e", borderRadius:6}}/>
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="column">
          <Card>
            <div className="step-row">
              <StepDot active={step === 1}>1</StepDot>
              <StepDot active={step === 2}>2</StepDot>
              <StepDot active={step === 3}>3</StepDot>
              <StepDot active={step === 4}>4</StepDot>
              <StepDot active={step === 5}>✓</StepDot>
              <div className="listening">{listening ? "🎙️ 듣는 중..." : "🟣 대기 중"}</div>
            </div>

            {step !== 5 && <p className="prompt">{promptOf(step)}</p>}

            {/* 이름 단계 */}
            {step === 1 && (
              <div className="col" style={{ marginTop: 8 }}>
                <h3>성함을 입력해 주세요. (2자 이상)</h3>

                <input
                  className="input"
                  value={fullName}
                  onChange={(e) => {
                    const v = normalizeName(e.target.value);
                    setFullName(v);
                    setForm(f => ({ ...f, name: v }));
                    setNameHint(v.length >= 2 ? "✅ 입력 완료" : "ℹ️ 두 글자 이상 입력해 주세요.");
                  }}
                  placeholder="예: 홍길동"
                />

                <div className="row" style={{ marginTop: 8 }}>
                  {!nameListening ? (
                    <button type="button" className="btn" onClick={startName}>듣기 시작</button>
                  ) : (
                    <button type="button" className="btn" onClick={stopName}>듣기 종료</button>
                  )}
                  <button type="button" className="btn" onClick={() => { 
                    setFullName(""); 
                    setForm(f => ({ ...f, name: "" })); 
                    setNameHint(null); 
                  }}>
                    초기화
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      console.log("🚀 다음 버튼 클릭:", { fullName, isValid: isValidName(fullName) });
                      if (isValidName(fullName)) {
                        setForm(f => ({ ...f, name: fullName }));
                        setStep(2);
                      }
                    }}
                    disabled={!isValidName(fullName)}
                  >
                    다음 ({fullName.length}자)
                  </button>
                </div>

                {nameHint && <div className="note" style={{ marginTop: 8 }}>{nameHint}</div>}
                
                {/* 디버깅 정보 */}
                <div className="note" style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                  <strong>디버깅:</strong> fullName: "{fullName}" (길이: {fullName.length}), 
                  form.name: "{form.name}" (길이: {form.name.length}), 
                  유효성: {isValidName(fullName) ? "✅" : "❌"}
                </div>
              </div>
            )}
            {/* 이메일 단계 (음성 입력 활성화) */}
            {step === 2 && (
              <>
                <Field label="이메일" placeholder="음성으로 말씀하거나 직접 입력하세요" type="email" value={form.email || `${emailId}@${emailDomain}`}
                  onChange={(v) => {
                    // 수동 입력 시 form.email에 직접 저장
                    setForm(f => ({ ...f, email: v }));
                    // 수동 입력 시 누적 상태 초기화
                    setEmailId("");
                    setEmailDomain("");
                    setEmailIdPart("");
                    setEmailDomainPart("");
                    // setEmailLocked는 제거 (사용하지 않음)
                    committedRef.current = false;
                    setMode("id");
                    domainSwitchedRef.current = false;
                  }}
                  valid={vEmail(form.email) || isLikelyEmail(emailId, emailDomain)} />
                
                {/* EmailVoiceField 컴포넌트 추가 */}
                                  <EmailVoiceField
                    emailId={emailId}
                    emailDomain={emailDomain}
                    mode={mode}
                    setEmailId={setEmailId}
                    setEmailDomain={setEmailDomain}
                    setMode={setMode}
                    domainSwitchedRef={domainSwitchedRef}
                    pushLog={pushLog}
                    onTryNext={onTryNext}
                  />
                
                {/* 초기화 버튼은 하단 고정 영역에서 처리 */}
              </>
            )}
            {/* 비밀번호 단계 */}
            {step === 3 && (
              <div className="col" style={{ marginTop: 8 }}>
                <h3>비밀번호를 입력해 주세요. (8자 이상, 문자+숫자)</h3>

                {/* 안내문 - 실제 비밀번호는 낭독하지 않도록 유지 */}
                <div className="note">비밀번호에는 영문, 숫자(권장: 특수문자) 포함이면 좋아요.</div>

                {/* 프로젝트의 비밀번호 상태 변수를 사용하세요 */}
                <PasswordVoiceField
                  value={form.password}
                  onChange={(v) => setForm((f) => ({ ...f, password: v }))}
                />

                <div className="row" style={{ marginTop: 12 }}>
                  <button type="button" className="btn" onClick={() => setStep(2)}>뒤로</button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setStep(4)}
                    disabled={!validatePassword(form.password).ok}
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
            {/* 약관 단계 */}
            {step === 4 && (
              <div className="col" style={{ marginTop: 8 }}>
                <h3>약관에 동의해 주세요.</h3>

                <div className="field">
                  <label className="label">약관 동의</label>
                  <div style={{marginTop:8}}>
                    <label style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
                      <input
                        type="checkbox"
                        checked={form.termsRequired}
                        onChange={(e) => setForm(f => ({...f, termsRequired: e.target.checked}))}
                      />
                      <span>(필수) 서비스 이용 약관 동의</span>
                    </label>
                    <label style={{display:"flex", alignItems:"center", gap:8}}>
                      <input
                        type="checkbox"
                        checked={form.termsMarketing}
                        onChange={(e) => setForm(f => ({...f, termsMarketing: e.target.checked}))}
                      />
                      <span>(선택) 정보/이벤트 수신 동의</span>
                    </label>
                  </div>
                </div>
                
                {/* 성공 배지 (선택) */}
                {signupDone && <div className="chip" style={{ marginTop: 8 }}>회원가입 완료</div>}

                {/* 중복 이메일 CTA */}
                {uiError?.code === "auth/email-already-in-use" && (
                  <div className="note" style={{ marginTop: 12 }}>
                    <div style={{ marginBottom: 8 }}>이미 가입된 이메일이에요.</div>
                    <div className="row">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          // 라우터 미사용 시 window.location 사용
                          window.location.href = `/login?email=${encodeURIComponent(uiError.email || "")}`;
                        }}
                      >
                        로그인하기
                      </button>

                      <button
                        type="button"
                        className="btn"
                        onClick={async () => {
                          try {
                            await sendPasswordResetEmail(auth, (uiError.email || "").trim());
                            alert("비밀번호 재설정 메일을 보냈습니다. 메일함을 확인해 주세요.");
                          } catch (err: any) {
                            alert(err?.message ?? "재설정 메일 전송에 실패했습니다.");
                          }
                        }}
                      >
                        비밀번호 재설정
                      </button>

                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          // 이메일 수정하려면 2단계로 되돌리기
                          setStep(2);
                          setUiError(null);
                        }}
                      >
                        이메일 수정
                      </button>
                </div>
                  </div>
                )}

                {/* 하단 액션 영역 */}
                <div className="row" style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onConfirmSignup}
                    disabled={
                      submitting ||
                      uiError?.code === "auth/email-already-in-use" ||  // 중복 시 비활성
                      !form.termsRequired                           // (필수 약관 체크 여부 사용)
                    }
                  >
                    {submitting ? "가입 중..." : "가입 확정"}
                  </button>

                  <button type="button" className="btn" onClick={() => setStep(3)}>뒤로</button>
                </div>
              </div>
            )}

            {/* 완료 단계(성공 화면) */}
            {step === 5 && (
              <div className="p-6">
                <h2 className="text-xl font-bold">가입이 완료되었습니다 🎉</h2>
                <p className="mt-2">이메일: {form.email}</p>
                <p className="text-sm opacity-70">로그인은 자동으로 유지됩니다. (이메일 인증 메일도 확인해 주세요)</p>
              </div>
            )}

            {listening && recognizingText && (
              <div className="hearing">👂 인식 중: {recognizingText}</div>
            )}

            <div className="actions">
              <button
                type="button"                 // ✅ submit 금지
                onClick={handleListenClick}   // ✅ 위 핸들러 사용
                disabled={false}              // ✅ 듣기 버튼은 항상 활성화
                className="button primary"
              >
                {listening ? "🎙️ 듣기 종료" : "🎙️ 듣기 시작"}
              </button>

              <Button onClick={() => goBack()} disabled={stepIndex === 0 || submitting || step === 5}>뒤로</Button>
              <Button onClick={async () => await speakGuarded("안내를 다시 들려드릴게요.", { restart:false })} variant="ghost" disabled={step === 5}>질문 다시 듣기</Button>

              <div className="actions-right">
                {/* 초기화 버튼은 제거됨 */}
              </div>
            </div>

            {step === 5 && (
              <div className="done">
                ✅ 회원가입 완료! {form.name}님 환영합니다.
                {userUid && <div className="uid">UID: {userUid}</div>}
              </div>
            )}
          </Card>

          <Card>
            <div className="log-head">
              <div className="log-title">디버그 로그</div>
              <div className="grow" />
              <Button onClick={() => setLogs([])} variant="ghost">로그 지우기</Button>
            </div>
            <div className="log-body">
              {logs.length === 0 ? (
                <div className="log-empty">로그가 여기에 표시됩니다…</div>
              ) : (
                <ul className="log-list">
                  {logs.map((l, i) => <li key={i} className="log-item">{l}</li>)}
                </ul>
              )}
            </div>
          </Card>
        </section>
      </main>

      <footer className="footer">
        <div>마이크: {listening ? "활성화" : "비활성화"} / STT {sttOK ? "OK" : "미지원"} / TTS {ttsOK ? "OK" : "미지원"}</div>
        <div>TIP: "듣기 시작" 후 '성함/전자우편/비밀번호'를 말씀하세요. 정정은 "아니고/말고 …"</div>
      </footer>
    </div>
  );
}

// ---- 스타일 & 작은 컴포넌트 (반응형 유지) ----
const css = `
:root{ --bg:#0b1220; --card-grad:linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03)); --border:rgba(255,255,255,0.12); --muted:rgba(255,255,255,0.7); }
*{box-sizing:border-box} html,body,#root{height:100%} body{margin:0;background:var(--bg);color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",Arial,sans-serif}
.app{min-height:100vh;display:grid;grid-template-rows:auto 1fr auto;}
.header{position:sticky;top:0;display:flex;align-items:center;gap:12px;padding:clamp(10px,2vw,16px) clamp(12px,2vw,20px);border-bottom:1px solid rgba(255,255,255,.08);backdrop-filter:blur(6px);}
.logo{width:clamp(30px,4vw,36px);height:clamp(30px,4vw,36px);border-radius:10px;background:linear-gradient(135deg,#8b5cf6,#22d3ee);display:grid;place-items:center;font-weight:800}
.title{font-size:clamp(14px,2.2vw,16px);font-weight:700}.subtitle{font-size:clamp(11px,1.8vw,12px);opacity:.7}
.header-right{margin-left:auto;display:flex;gap:8px}
.container{width:100%;display:grid;grid-template-columns:1fr min(920px,92vw) 1fr}
.column{grid-column:2;display:grid;gap:clamp(12px,2vw,16px);padding:clamp(10px,2vw,16px)}
.card{width:100%;background:var(--card-grad);border:1px solid var(--border);border-radius:16px;padding:clamp(12px,2.2vw,16px);box-shadow:0 8px 24px rgba(0,0,0,.25)}
.step-row{display:flex;align-items:center;gap:10px}
.step-dot{width:clamp(24px,4.5vw,28px);height:clamp(24px,4.5vw,28px);border-radius:10px;display:grid;place-items:center;font-weight:800;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);font-size:clamp(12px,2.5vw,14px)}
.step-dot.active{background:rgba(139,92,246,.35)}
.listening{margin-left:auto;opacity:.8;font-size:clamp(11px,2vw,12px)}
.prompt{margin:6px 0 0;font-size:clamp(13px,2.2vw,14px);opacity:.85}
.field{display:grid;gap:6px}.label{font-size:clamp(12px,2vw,13px);opacity:.85}
.input{width:100%;padding:clamp(10px,1.8vw,12px);border-radius:12px;border:1px solid rgba(255,255,255,.2);outline:none;background:rgba(2,6,23,.6);color:#fff;font-size:clamp(13px,2.4vw,14px)}
.input.invalid{border-color:rgba(239,68,68,.6)} .hint-error{font-size:clamp(11px,2vw,12px);color:#f87171}
.quick-select{display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap}
.quick-label{font-size:clamp(11px,2vw,12px);opacity:.7}
.quick-chip{padding:4px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;font-size:clamp(11px,2vw,12px);cursor:pointer;transition:all .2s}
.quick-chip:hover{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.3)}
.domain-quick-select{display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap}
.email-draft-status{margin-top:12px;padding:12px;background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.3);border-radius:12px}
.draft-label{font-size:clamp(11px,2vw,12px);opacity:.8;margin-bottom:8px}
.draft-parts{display:flex;align-items:center;gap:4px;margin-bottom:8px;flex-wrap:wrap}
.draft-id,.draft-domain{padding:4px 8px;background:rgba(255,255,255,.1);border-radius:6px;font-family:monospace;font-size:clamp(12px,2vw,13px)}
.draft-at{opacity:.6;font-size:clamp(14px,2.2vw,16px)}
.draft-preview{margin-top:8px;padding:8px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:8px;font-size:clamp(11px,2vw,12px)}
.hearing{margin-top:4px;font-size:clamp(12px,2.2vw,13px);opacity:.85;padding:8px 10px;background:rgba(255,255,255,.05);border-radius:10px}
.actions{display:flex;gap:8px;flex-wrap:wrap}.actions-right{margin-left:auto;display:flex;gap:8px}
.button{padding:clamp(9px,2vw,10px) clamp(10px,2vw,12px);border-radius:12px;font-weight:700;font-size:clamp(13px,2.4vw,14px);border:1px solid rgba(255,255,255,.18);color:#fff;background:rgba(255,255,255,.08)}
.button.primary{background:linear-gradient(135deg,#8b5cf6,#22d3ee);border-color:rgba(255,255,255,.28)}
.button.ghost{background:transparent}.button.success{background:linear-gradient(135deg,#22c55e,#14b8a6);border-color:rgba(255,255,255,.28)}
.button[disabled]{opacity:.6;cursor:not-allowed}
.done{margin-top:4px;padding:12px 14px;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.4);border-radius:12px;font-size:clamp(13px,2.2vw,14px)}
.uid{opacity:.8;margin-top:6px;font-size:clamp(11px,2vw,12px)}
.log-head{display:flex;align-items:center;gap:8px}.log-title{font-weight:700}.grow{flex:1}
.log-body{margin-top:8px;padding:12px;background:rgba(255,255,255,.04);border-radius:10px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:clamp(12px,2.4vw,12.5px);max-height:40vh;overflow:auto}
.log-empty{opacity:.7}.log-list{margin:0;padding-left:18px}.log-item{margin-bottom:6px}
.footer{padding:clamp(10px,2vw,12px) clamp(12px,2vw,16px);border-top:1px solid rgba(255,255,255,.08);font-size:clamp(11px,2vw,12px);opacity:.8;display:flex;gap:12px;flex-wrap:wrap;justify-content:space-between}
@media (max-width:1024px){.container{grid-template-columns:1fr min(840px,94vw) 1fr}}
@media (max-width:768px){.container{grid-template-columns:1fr min(720px,94vw) 1fr}.actions-right{width:100%;justify-content:flex-end}}
@media (max-width:480px){.container{grid-template-columns:1fr min(100%,96vw) 1fr}.actions{gap:6px}.button{width:100%}.actions-right{width:100%;justify-content:stretch}}
`;

function Card({ children }: { children: React.ReactNode }) { return <section className="card">{children}</section>; }
function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <span title={ok ? "Supported" : "Not Supported"} style={{fontSize:11,padding:"4px 8px",borderRadius:999,border:`1px solid ${ok?"rgba(34,197,94,.5)":"rgba(239,68,68,.5)"}`,background:ok?"rgba(34,197,94,.15)":"rgba(239,68,68,.15)"}}>{children}</span>;
}
function StepDot({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <div className={`step-dot ${active ? "active" : ""}`}>{children}</div>;
}
function Field({ label, value, onChange, placeholder, type="text", valid=true, readOnly=false }:{
  label:string; value:string; onChange:(v:string)=>void; placeholder?:string; type?:"text"|"email"|"password"; valid?:boolean; readOnly?:boolean;
}) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      <input className={`input ${!valid ? "invalid" : ""}`} type={type} value={value} readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)} placeholder={placeholder} spellCheck={false}/>
      {!valid && <div className="hint-error">값을 확인해 주세요.</div>}
    </div>
  );
}
function Button({ children, onClick, disabled, variant="default" }:{
  children:React.ReactNode; onClick?:()=>void|Promise<void>; disabled?:boolean; variant?:"default"|"primary"|"ghost"|"success";
}) {
  return <button onClick={onClick} disabled={disabled} className={`button ${variant}`}>{children}</button>;
}
