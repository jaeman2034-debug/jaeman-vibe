import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { parseNaturalSignup } from "../utils/naturalSignupParser";
import { parseSignupFromText } from "../utils/voiceSignupParser";
import { Telemetry, sanitizeRawForLogs } from "../lib/telemetry";
import { normalizeEmail } from "../lib/parse-ko";
import { extractName } from "../lib/koNlu";
import { extractEmail } from "../lib/parse-ko-email";
import ChatDock from "../components/ChatDock";
import { parseSignupUtterance } from "../lib/nlu/parseSignup";
import type { Parsed } from "../lib/nlu/parseSignup";
import { FLAGS } from "../lib/flags";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, app } from "@/firebase";
import { getFirestore } from "firebase/firestore";

const db = getFirestore(app);
import { toKoMessage } from "@/lib/authErrors";
import { useSettings } from "../settings/SettingsContext";

// 서버 없이도 답하게 하는 스위치
const USE_LOCAL_BOT = true;

// 전화/비밀번호 간단 파서
function extractPhone(raw: string) {
  const d = raw.replace(/[^0-9]/g, '');
  const m = d.match(/(01[016789])(\d{3,4})(\d{4})/);
  return m ? { ok: true, value: `${m[1]}-${m[2]}-${m[3]}` } : { ok: false, value: '' };
}
function extractPassword(raw: string) {
  const m = raw.match(/(?:비밀\s*번호|비번)\s*(?:은|:)?\s*([A-Za-z0-9!@#$%^&*_.-]{8,})/);
  return { ok: !!m, value: m?.[1] ?? '' };
}

// TypeScript 전역 타입 선언
declare global {
  interface Window {
    setEmail?: (v: string) => void;
    setName?: (v: string) => void;
    setPhone?: (v: string) => void;
  }
}


/** Natural Signup Parser 데모: 한국어 섞인 자연어에서 name/email/phone/password 추출 */

function NaturalSignupLab() {
  const navigate = useNavigate();
  const { autoFillWhileListening } = useSettings();
  
  // [ADD] 텔레메트리 인스턴스
  const tmRef = React.useRef<Telemetry | null>(null);
  if (!tmRef.current) tmRef.current = new Telemetry("/api/telemetry");
  const tm = tmRef.current!;

  const [userConsented, setUserConsented] = React.useState(false);
  const [sessionStartTime, setSessionStartTime] = React.useState<number>(Date.now());
  
  const [raw, setRaw] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<"ok"|"weak"|"missing">("missing");
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', text: string}>>([]);
  const [enStrict, setEnStrict] = useState(false);
  const [autoReprompt, setAutoReprompt] = useState(false); // 기본: 꺼짐(수동만)
  const [autoParse, setAutoParse] = useState(false); // 듣는 동안 자동 파싱(기본: 꺼짐)
  const [stickyListen, setStickyListen] = useState(true); // 끊겨도 자동 재시작
  const [listening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoContinue, setAutoContinue] = useState(false); // 말 끝나면 자동으로 다시 듣기
  const [inlineAppend, setInlineAppend] = useState(true); // ✅ 가로 이어쓰기 토글
  const [pwOrder, setPwOrder] = useState<"as_spoken"|"letters_first"|"digits_first">("as_spoken");
  const [localMsg, setLocalMsg] = useState(""); // 로컬 챗봇 테스트 입력 상태
  const [submitting, setSubmitting] = useState(false); // 폼 제출 상태
  const recRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // [ADD] 중복 파싱 방지용 ref
  const parsedRef = useRef({ name: false, email: false, last: '' });
  
  // [ADD] 사용자 편집 여부 추적
  const touchedRef = React.useRef({ name: false, email: false, phone: false, pw: false });

  // [ADD] 자동 채움 제어 함수
  const maybeFillFields = (parsed: any) => {
    if (autoFillWhileListening) {
      // 자동 채움 허용: 기존 로직
      if (parsed.name && !touchedRef.current.name) setName(parsed.name);
      if (parsed.email && !touchedRef.current.email) setEmail(parsed.email);
      if (parsed.phone && !touchedRef.current.phone) setPhone(parsed.phone);
      if (parsed.password && !touchedRef.current.pw) setPassword(parsed.password);
    }
    // 자동 채움 금지: 버튼 눌렀을 때만
  };

  // [ADD] 사용자 편집 핸들러
  const onNameChange = (v: string) => { setName(v); touchedRef.current.name = true; };
  const onEmailChange = (v: string) => { setEmail(v); touchedRef.current.email = true; };
  const onPhoneChange = (v: string) => { setPhone(v); touchedRef.current.phone = true; };
  const onPasswordChange = (v: string) => { setPassword(v); touchedRef.current.pw = true; };

  // [ADD] 유효성 검증 함수들
  const isNonEmpty = (s = '') => s.trim().length > 0;
  const isEmail = (s = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const isPhone = (s = '') => /^\d{2,3}-\d{3,4}-\d{4}$/.test(s);

  // [ADD] 전화번호 포맷터
  const formatPhone = (s: string) =>
    s.replace(/\D/g, "").replace(/^(\d{3})(\d{3,4})(\d{4}).*$/, "$1-$2-$3");

  // [ADD] fillForm 함수 정의
  const fillForm = (p: {name?: string; email?: string; phone?: string; password?: string}) => {
    if (p.name) {
      setName(p.name);
      touchedRef.current.name = true;
    }
    if (p.email) {
      setEmail(p.email);
      touchedRef.current.email = true;
    }
    if (p.phone) {
      setPhone(formatPhone(p.phone));
      touchedRef.current.phone = true;
    }
    if (p.password) {
      setPassword(p.password);
      touchedRef.current.pw = true;
    }

    // ✅ 함께 터치/완료 처리
    // 모든 필드가 채워졌다면 터치 상태를 true로 설정
    if (p.name || p.email || p.phone || p.password) {
      const updates: any = {};
      if (p.name) updates.name = true;
      if (p.email) updates.email = true;
      if (p.phone) updates.phone = true;
      if (p.password) updates.pw = true;
      
      // 터치 상태 업데이트
      Object.assign(touchedRef.current, updates);
    }
  };

  // [ADD] 윈도우로 파서 노출 (콘솔/버튼 둘 다 접근 가능)
  useEffect(() => {
    (window as any).parseSignupUtterance = parseSignupUtterance;
    // 콘솔에서 원클릭 파싱/채움도 테스트할 수 있도록 헬퍼 하나 더:
    (window as any).parseSignupNow = () => {
      const raw = textareaRef.current?.value ?? "";
      const p = parseSignupUtterance(raw);
      fillForm(p);
      console.log("[parsed]", p);
      return p;
    };
  }, []);

  // [ADD] 30초 진단 - 폼 상태 모니터링
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("[진단] 폼 상태:", {
        name: { value: name, touched: touchedRef.current.name },
        email: { value: email, touched: touchedRef.current.email },
        phone: { value: phone, touched: touchedRef.current.phone },
        password: { value: password, touched: touchedRef.current.pw },
        timestamp: new Date().toISOString()
      });
    }, 30000); // 30초마다

    return () => clearInterval(interval);
  }, [name, email, phone, password]);

  // [ADD] 로컬 챗봇 테스트 전송 핸들러
  const onLocalSend = () => {
    const raw = localMsg.trim();
    if (!raw) return;

    const parsed: Parsed = parseSignupUtterance(raw);
    console.log("[LocalBot] parsed:", parsed);

    // 폼으로 브로드캐스트 (STT 모듈 전용)
    window.__setSignupFields?.(parsed);

    // (선택) 채팅창에 "적용했어요 …" 같은 메시지 출력하는 기존 코드 호출
    // addBotMessage(makeAppliedText(parsed));

    setLocalMsg("");
  };

  // [ADD] Firebase 회원가입 제출 핸들러
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nameValue = name?.trim();
    const emailValue = email?.trim();
    const phoneValue = phone?.trim();
    const passwordValue = password;

    if (!nameValue || !emailValue || !phoneValue || !passwordValue) {
      alert("이름/이메일/전화/비밀번호를 모두 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
              // auth와 db는 이미 위에서 정의됨
      const { user } = await createUserWithEmailAndPassword(auth, emailValue, passwordValue);
      await updateProfile(user, { displayName: nameValue });
      await setDoc(doc(db, "users", user.uid), {
        name: nameValue, 
        email: emailValue, 
        phone: phoneValue, 
        phoneRaw: phoneValue.replace(/\D/g, ""), 
        createdAt: serverTimestamp()
      });
      alert("회원가입 완료!");
    } catch (err: any) {
      alert(`회원가입 실패: ${toKoMessage(err?.code, err?.message)}`);
    } finally {
      setSubmitting(false);
    }
  }



  // [ADD] 누락 필드 계산
  const missing = useMemo(() => {
    const arr: Array<"email"|"phone"|"password"> = [];
    if (!email) arr.push("email");
    if (!phone) arr.push("phone");
    if (!password || pwStatus === "missing") arr.push("password");
    return arr;
  }, [email, phone, password, pwStatus]);

  // [ADD] 원문(raw)이 바뀔 때 300ms 뒤 자동 파싱
  React.useEffect(() => {
    if (!raw) return;
    const timer = setTimeout(() => {
      const n = extractName(raw);
      const e = extractEmail(raw);

      // 자동 채움 스위치에 따라 폼 채우기
      const parsed = {
        name: n.ok ? n.value : undefined,
        email: e.ok ? e.value : (!e?.ok ? normalizeEmail(raw) : undefined),
        phone: extractPhone(raw).ok ? extractPhone(raw).value : undefined,
        password: extractPassword(raw).ok ? extractPassword(raw).value : undefined
      };
      
      maybeFillFields(parsed);
      setPwStatus(extractPassword(raw).ok ? "ok" : "missing");

      // 텔레메트리 (샘플링은 서버/클라이언트 중 한쪽에서만)
      fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema: 1,
          events: [{
            type: 'parse',
            ts: Date.now(),
            data: { rawLen: raw.length, nameOk: n.ok, emailOk: e.ok }
          }]
        })
      }).catch(() => {}); // 실패해도 앱 진행 방해 금지
    }, 300);
    return () => clearTimeout(timer);
  }, [raw]);

  // [ADD] NLU 이벤트 리스너 - 챗봇에서 파싱된 결과를 폼에 자동 채우기
  useEffect(() => {
    const fill = (p: Parsed) => {
      // 자동 채움 스위치에 따라 폼 채우기
      maybeFillFields(p);
      // 사용자 편집 여부 추적
      if (p.name) touchedRef.current.name = true;
      if (p.email) touchedRef.current.email = true;
      if (p.phone) touchedRef.current.phone = true;
      if (p.password) touchedRef.current.pw = true;
    };
    const onFill = (e: Event) => {
      const p = (e as CustomEvent<Parsed>).detail;
      console.log("[Form] nlu:fill received:", p);
      if (p) fill(p);
    };
    window.addEventListener("nlu:fill", onFill);
    window.__setSignupFields = (parsed: Parsed) => {
      // STT 모듈 전용: 폼만 업데이트 (채팅과 완전 분리)
      // 자동 채움 스위치에 따라 폼 채우기
      maybeFillFields(parsed);
      // 사용자 편집 여부 추적
      if (parsed.name) touchedRef.current.name = true;
      if (parsed.email) touchedRef.current.email = true;
      if (parsed.phone) touchedRef.current.phone = true;
      if (parsed.password) touchedRef.current.pw = true;
    };
    console.log("[debug] setters\nattached:", { set: true });

    return () => {
      window.removeEventListener("nlu:fill", onFill);
      delete window.__setSignupFields;
    };
  }, []);

  // [ADD] STT 결과 로깅
  const logStt = React.useCallback(async (bestText: string, parsed: any, altsCount: number) => {
    if (!userConsented) return;
    const fail = isFailure(parsed);
    // 실패면 100%, 성공이면 1%
    if (!fail && !sample(0.01)) return;

    const salt = tm.getSalt();
    tm.push({
      type: "stt_result",
      data: {
        ts: Date.now(),
        alts_count: altsCount,
        raw_sanitized: await sanitizeRawForLogs(bestText, salt),
        email_found: !!parsed.email,
        phone_found: !!parsed.phone,
        pw_found: !!parsed.password,
        toggles: { strictEN: enStrict, autoParse }
      }
    });
    tm.flush();
  }, [userConsented, enStrict, autoParse]);

  // [ADD] 파싱 결과 로깅
  const logParse = React.useCallback(async (parsed: any, rawText: string) => {
    if (!userConsented) return;
    const fail = isFailure(parsed);
    if (!fail && !sample(0.01)) return; // 성공 1%만

    const salt = tm.getSalt();
    const emailDomain = parsed.email?.split("@")[1]?.toLowerCase() ?? null;
    tm.push({
      type: "parse_result",
      data: {
        ts: Date.now(),
        email_status: parsed.email ? "ok" : "missing",
        email_domain: emailDomain ?? "none",
        phone_status: parsed.phone ? "ok" : "missing",
        pw_status: parsed.password ? "ok" : "missing",
        raw_len: rawText.length,
        raw_sanitized: await sanitizeRawForLogs(rawText, salt),
      }
    });
    tm.flush();
  }, [userConsented]);

  // 실패 판단 헬퍼
  function isFailure(parsed: any) {
    return !(parsed?.email && parsed?.phone && parsed?.password && parsed?.name);
  }

  // 샘플링 헬퍼
  function sample(prob: number) {
    return Math.random() < prob;
  }

  // [ADD] 제출 시 로깅(있으면 호출)
  const logSubmit = React.useCallback((allOk: boolean, durationMs: number) => {
    if (!userConsented) return;
    if (allOk && !sample(0.01)) return; // 성공 1%

    tm.push({ type: "submit", data: { ts: Date.now(), all_ok: allOk, duration_ms: durationMs } });
    tm.flush();
  }, [userConsented]);

  // ✅ 이벤트 핸들러에서 최신값을 읽기 위한 ref들
  const stickyRef  = React.useRef(stickyListen);
  const speakRef   = React.useRef(isSpeaking);
  const autoParseRef = React.useRef(autoParse);

  React.useEffect(() => { stickyRef.current = stickyListen; }, [stickyListen]);
  React.useEffect(() => { speakRef.current  = isSpeaking;   }, [isSpeaking]);
  React.useEffect(() => { autoParseRef.current = autoParse; }, [autoParse]);

  // 원문 입력 박스 자동 스크롤 (최신 내용이 항상 보이게)
  useEffect(() => {
    if (textareaRef.current && raw) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [raw]);

  // [ADD] 개발용 테스트 훅 - 브라우저 콘솔에서 __testName, __testEmail 사용 가능
  React.useEffect(() => {
    (window as any).__testName = extractName;
    (window as any).__testEmail = extractEmail;
  }, []);

  // [ADD] 개발 중 콘솔에서 상태를 바꿀 수 있도록 window에 세터를 붙여 둡니다.
  React.useEffect(() => {
    // React StrictMode로 마운트/언마운트가 두 번 일어날 수 있으므로
    // 이미 있으면 덮어쓰지 않고, 없을 때만 달아 둡니다.
    if (!window.setEmail) window.setEmail = (v: string) => setEmail(v);
    if (!window.setName) window.setName = (v: string) => setName(v);
    if (!window.setPhone) window.setPhone = (v: string) => setPhone(v);

    console.log('[debug] setters attached:', {
      setEmail: typeof window.setEmail,
      setName: typeof window.setName,
      setPhone: typeof window.setPhone,
    });

    // 개발 편의상 정리(cleanup)는 생략 (StrictMode에서 지워졌다가 다시 달리는 문제 방지)
  }, []); // <-- 의존성 비움
  let rec: any = null; // STT 인스턴스 직접 참조 (SpeechRecognition | webkitSpeechRecognition)
  
  // === Mic guardian refs ===
  let keepAliveTimer: number | null = null;   // 60초 제한 회피용
  let restartLock = false;                    // 동시 재시작 방지
  let sessionStartedAt = 0;
  let backoffMs = 400;                        // 에러시 점증 대기

  // 권장값: Chrome는 continuous여도 ~60s 제한 → 55초마다 회전
  const MAX_SESSION_MS = 55_000;
  
  // === STT 결과 누적 + 필드 채우기 분리 ===
  // raw: 음성 인식 결과 누적 저장 (필드 자동 채우기 아님)
  // autoParse: 듣는 동안 자동 파싱 여부 (기본: 꺼짐)
  // stickyListen: 끊겨도 자동 재시작 (마이크 끊김 방지)
  // autoContinue: 말 끝나면 자동으로 다시 듣기 시작
  // inlineAppend: 가로 이어쓰기 모드 (기본: ON, 공백 정리)
  // appendRaw: 가로/세로 모드에 따라 구분자 선택 (공백/줄바꿈)
  // normalizeInline: 가로 모드에서 공백/구두점 정리
  // flattenRaw: 기존 원문을 한 번에 가로로 변환
  // blurActive: 활성 인풋 블러하여 음성 타이핑 방해 방지
  // ensureRecognizer: continuous=true로 긴 구간도 끊기지 않게, resultIndex부터 수집
  
  // === STT·TTS 루프 차단 + 수동 재질문 ===
  // autoReprompt: false = 수동 재질문만 (기본값), true = 자동 재질문 루프
  // isSpeaking: TTS 중일 때 STT 차단하여 루프 방지
  // startListen/stopListen: TTS 중일 때 STT 차단하는 래퍼 함수
  // startListen: 포커스 해제 + STT 시작 + sticky 모드 활성화
  // stopListen: sticky 모드 비활성화 + STT 중단
  // say(): TTS 전에 STT 중단, TTS 후 재청취 (에코 방지)
  // onClickRepromptOnce: 수동 재질문 버튼 (듣기 중단 → 안내 → 재청취

  // 탭 전환/포커스 이벤트에서도 자동 회복
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && stickyRef.current && !speakRef.current) {
        // 탭 복귀 시 즉시 회복
        gracefulRestart("visibility");
      } else {
        stopKeepAlive();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    window.addEventListener("blur", stopListen);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
      window.removeEventListener("blur", stopListen);
    };
  }, [stickyListen, isSpeaking]);
  
  // 공백/구두점 정리(가로 모드에서만 사용)
  function normalizeInline(s: string) {
    return s
      .replace(/\s+/g, " ")            // 여러 공백 → 1칸
      .replace(/\s+([.,!?;:])/g, "$1") // 구두점 앞 공백 제거
      .replace(/([@/])\s+/g, "$1")     // @, / 뒤 공백 제거(이메일/URL 보호)
      .trim();
  }

  // ✅ 원문 누적 함수 (가로/세로 모드 지원)
  function appendRaw(t: string) {
    setRaw(prev => {
      const sep = inlineAppend ? " " : "\n";
      const next = prev ? prev + sep + t : t;
      return inlineAppend ? normalizeInline(next) : next;
    });
    // 다음 페인트 이후 스크롤을 맨 아래로
    setTimeout(() => {
      if (textareaRef.current) textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }, 0);
  }

  // [ADD] STT 콜백에서 원문 누적 및 실시간 파싱
  function onSpeechChunk(text: string) {
    if (!text) return;
    setRaw(prev => (prev ? prev + " " : "") + text);
    
    // 실시간 파싱으로 즉시 폼 업데이트 (STT 모듈 전용)
    const parsed = parseSignupUtterance(text);
    if (Object.keys(parsed).length > 0) {
      window.__setSignupFields?.(parsed); // STT 모듈만 사용
    }
  }

  // (선택) 기존 원문을 한 번에 가로로 변환하는 버튼용
  function flattenRaw() {
    setRaw(prev => normalizeInline(prev.replace(/\s*[\r\n]+\s*/g, " ")));
  }

  // 현재 활성 인풋이 음성 타이핑을 가로채지 않도록
  const blurActive = () => (document.activeElement as HTMLElement | null)?.blur();
  
  // 마이크 끊김 방지 STT 블록
  const userStopRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);
  const lastStartAtRef = useRef(0);
  const MIN_RESTART_INTERVAL = 600; // ms

  // 유효성 검사 함수들
  const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(s.trim());
  const isValidPw = (s: string) => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(s);
  const isValidName = (s: string) => s.trim().length >= 2;
  const isValidPhone = (s: string) => s.replace(/\D/g, "").length >= 10; // 010 포함 10~11자리

  const allValid = isValidName(name) && isValidEmail(email) && isValidPw(password) && isValidPhone(phone);

  function applyToSignup() {
    if (!allValid) return;
    
    // [ADD] 제출 시 로깅
    const durationMs = Date.now() - sessionStartTime;
    logSubmit(true, durationMs);
    
    localStorage.setItem("vibe:preset", JSON.stringify({ name, email, password, phone }));
    navigate("/signup?from=nat");
  }

  // 스코어러/적용 함수 추가
  function scoreParsed(r: ReturnType<typeof parseSignupFromText>) {
    let s = 0;
    if (r.email) s += 3;
    if (r.phone) s += 2;
    if (r.password) s += 2;
    if (r.name) s += 1;
    return s;
  }

  function pickBestParse(candidates: string[]) {
    // 후보마다 mixed / strict EN 두 모드로 모두 파싱 → 최고점 채택
    let bestText = "", bestParsed: any = null, bestScore = -1;

    for (const t of candidates) {
      const p1 = parseSignupFromText(t, { emailMode: "mixed",      passwordMode: "mixed",      emailPick: "last" });
      const p2 = parseSignupFromText(t, { emailMode: "en_strict",  passwordMode: "en_strict",  emailPick: "first" });
      const s1 = scoreParsed(p1);
      const s2 = scoreParsed(p2);
      const pick = s2 > s1 ? p2 : p1;
      const sc   = Math.max(s1, s2);
      if (sc > bestScore) { bestScore = sc; bestText = t; bestParsed = pick; }
    }
    return { text: bestText, parsed: bestParsed };
  }

  

// 새로운 파서 v1.1 적용 (emitFillOnce로 중복 방지)
function applyNewParser(raw: string) {
  const parsed: Parsed = {};
  
  const email = normalizeEmail(raw) ?? "";
  const phone = extractPhone(raw);
  const pw = extractPassword(raw);
  
  if (email) parsed.email = email;
  if (phone.ok) parsed.phone = phone.value;
  if (pw.ok) parsed.password = pw.value;
  
      // STT 모듈 전용: 폼만 업데이트
    if (Object.keys(parsed).length > 0) {
      window.__setSignupFields?.(parsed);
    }
  
  // 기존 상태 업데이트도 유지 (호환성)
  if (email) setEmail(email);
  if (phone.ok) setPhone(phone.value);
  if (pw.ok) setPassword(pw.value);
  setPwStatus(pw.ok ? "ok" : "missing");
}

async function handleSend(text: string) {
  setMessages(prev => [...prev, { role: 'user', text }]);

  if (USE_LOCAL_BOT) {
    // 이미 콘솔용으로 만든 파서가 있으면 재사용
    const testName = (window as any).__testName;
    const testEmail = (window as any).__testEmail;

    const parts: string[] = [];

    // 이름
    const n = testName ? testName(text) : { ok: false };
    if (n.ok) { setName(n.value); parts.push(`이름=${n.value}`); }

    // 이메일
    const e = testEmail ? testEmail(text) : { ok: false };
    if (e?.ok) { setEmail(e.value); parts.push(`이메일=${e.value}`); }

    // 전화번호
    const p = extractPhone(text);
    if (p.ok) { setPhone(p.value); parts.push(`전화번호=${p.value}`); }

    // 비밀번호
    const pw = extractPassword(text);
    if (pw.ok) { setPassword(pw.value); parts.push(`비밀번호=●●●●`); }
    
    // STT 모듈 전용: 폼만 업데이트
    const parsed: Parsed = {};
    if (n.ok) parsed.name = n.value;
    if (e?.ok) parsed.email = e.value;
    if (p.ok) parsed.phone = p.value;
    if (pw.ok) parsed.password = pw.value;
    
    if (Object.keys(parsed).length > 0) {
      window.__setSignupFields?.(parsed);
    }

    const reply = parts.length
      ? `적용했어요: ${parts.join(', ')}`
      : `"이름은 …, 이메일은 …, 전화번호는 …, 비밀번호는 …" 형식으로 말씀해 주세요.`;

    setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    return;
  }

  // ↓ 실제 서버 모드는 옵션 B에서 활성화
  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await r.json();
    setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
  } catch {
    setMessages(prev => [...prev, { role: 'assistant', text: '서버 응답이 없어요.' }]);
  }
}

// 실패 시 슬롯별 재질문(재청취) 자동화
function repromptMissing(r: any) {
  const wants: string[] = [];
  if (!r.name)     wants.push("이름");
  if (!r.email)    wants.push("이메일");
  if (!r.phone)    wants.push("전화번호");
  if (!r.password) wants.push("비밀번호");

  if (!wants.length) return;

  const msg = wants.join(", ") + "를 다시 한 번 또박또박 말씀해 주세요. 예) 이메일은 jae man 골뱅이 지메일 점 컴";
  say(msg); // TTS 중일 때 STT 차단하는 say 함수 사용
}

// "누락 재질문"은 수동 버튼만 말하기 (자동 토글은 기본 OFF)
function buildReprompt(r: any) {
  const wants: string[] = [];
  if (!r.name)     wants.push("이름");
  if (!r.email)    wants.push("이메일");
  if (!r.phone)    wants.push("전화번호");
  if (!r.password) wants.push("비밀번호");
  if (!wants.length) return "";
  return `${wants.join(", ")}를 다시 한번 또박또박 말씀해 주세요. 예를 들어, 이메일은 j a e 골뱅이 지메일 점 컴.`;
}

function onClickRepromptOnce() {
  // 수동 1회 안내 (듣기 중이면 끄고, 안내 후 다시 듣기 켬)
  const r = parseSignupFromText(raw, {
    emailMode: enStrict ? "en_strict" : "mixed",
    passwordMode: enStrict ? "en_strict" : "mixed",
    emailPick: enStrict ? "first" : "last",
  });
  const msg = buildReprompt(r);
  if (msg) say(msg, { resumeListen: true });
}

  // TTS 래퍼 (말할 땐 듣지 않기)
  function say(text: string, opts: { resumeListen?: boolean } = {}) {
    stopListen();                    // ★ 말할 땐 듣기 끔
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    setIsSpeaking(true);
    u.onend = () => {
      setIsSpeaking(false);
      if (opts.resumeListen) setTimeout(() => startListen(), 300);
    };
    window.speechSynthesis.speak(u);
  }

  // === 마이크 캡처 품질 보강 ===
  // 노이즈 억제, 에코 캔슬레이션, 자동 게인 컨트롤 등으로 STT 인식률 향상
  
  // 인식기 생성/초기화 함수 교체
  function newRecognizer(): any {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;

    const r = new SR();
    r.lang = "ko-KR";
    r.interimResults = false;   // 완성본만
    r.continuous = true;        // 길게 듣기
    (r as any).maxAlternatives = 5;
    return r;
  }

  function attachHandlers(r: any) {
    r.onstart = () => {
      sessionStartedAt = Date.now();
      setListening(true);
      startKeepAlive();
    };

    r.onresult = (e: any) => {
      const texts: string[] = [];
      for (let i = e.resultIndex; i < e.results.length; i++) {
        texts.push(e.results[i][0].transcript);
      }
      if (!texts.length) return;

      const best = pickBestParse(texts);
      appendRaw(best.text);

      // [ADD] STT 누적 텍스트 자동 파싱을 위한 onSpeechChunk 호출
      onSpeechChunk(best.text);

      if (autoParseRef.current) applyNewParser(best.text);  // ✅ 새로운 파서 v1.1 적용

      // [ADD]
      logStt(best.text, best.parsed, texts.length);
    };

    r.onend = () => {
      setListening(false);
      stopKeepAlive();
      if (stickyRef.current && !speakRef.current) gracefulRestart("onend");
    };

    r.onerror = () => {
      setListening(false);
      stopKeepAlive();
      gracefulRestart("onerror");
    };

    // Safari 일부에서 발생하는 no-match
    (r as any).onnomatch = () => {
      if (stickyRef.current && !speakRef.current) gracefulRestart("onnomatch");
    };
  }

  // Keep-alive 및 graceful restart 함수들
  function startKeepAlive() {
    stopKeepAlive();
    keepAliveTimer = window.setInterval(() => {
      // 세션이 55초 넘기면 브라우저가 곧 끊으니 먼저 회전
      if (Date.now() - sessionStartedAt > MAX_SESSION_MS - 500) {
        gracefulRestart("keepAlive");
      }
    }, 3_000);
  }

  function stopKeepAlive() {
    if (keepAliveTimer) { clearInterval(keepAliveTimer); keepAliveTimer = null; }
  }

  function gracefulRestart(reason: string) {
    if (restartLock) return;
    restartLock = true;

    const delay = Math.min(backoffMs, 5000);
    backoffMs = Math.min(backoffMs * 2, 5000);

    try { rec?.abort(); } catch {}
    rec = newRecognizer();
    if (!rec) { restartLock = false; return; }
    attachHandlers(rec);

    setTimeout(() => {
      // ✅ 최신 상태(ref)로 검사
      if (!stickyRef.current || speakRef.current) { restartLock = false; return; }
      try { rec!.start(); backoffMs = 400; } finally { restartLock = false; }
    }, delay);
  }
  
  // 인식기 초기화 & 콜백 (핵심)
  function ensureRecognizer() {
    if (rec) return rec;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;

    rec = new SR();
    rec.lang = "ko-KR";
    rec.interimResults = false;   // 중간 결과는 누적하지 않음
    rec.continuous = true;        // 한 구간 길게 받아도 끊기지 않도록
    (rec as any).maxAlternatives = 5;

    rec.onstart = () => {
      sessionStartedAt = Date.now();
      setListening(true);
      startKeepAlive();   // ★ 세션 감시 시작
    };

    rec.onresult = (e: any) => {
      // 1) 후보 텍스트 모두 수집
      const texts: string[] = [];
      for (let i = e.resultIndex; i < e.results.length; i++) {
        texts.push(e.results[i][0].transcript);
      }
      if (!texts.length) return;

      // 2) 가장 잘 파싱되는 후보 선택(기존 pickBestParse 사용)
      const best = pickBestParse(texts);

      // 3) ★ 원문 입력창에만 누적 (가로/세로 모드 지원)
      appendRaw(best.text);          // ✅ 줄바꿈 대신 가로로 이어붙임
      
      // [ADD] STT 누적 텍스트 자동 파싱을 위한 onSpeechChunk 호출
      onSpeechChunk(best.text);

      // 4) 자동 파싱이 켜져 있을 때만 필드에 채움 (기본은 꺼짐)
      if (autoParseRef.current) {
        // 새로운 파서 v1.1 적용
        applyNewParser(best.text);
        
        // 누락 슬롯이 있고 autoReprompt가 켜져 있으면, TTS로 1회 안내 → 종료 후 재청취
        if (autoReprompt) {
          const msg = buildReprompt(best.parsed);
          if (msg) say(msg, { resumeListen: true }); // TTS 끝나면 다시 듣기
        }
      }

      // [ADD]
      logStt(best.text, best.parsed, texts.length);
    };

    // 마이크가 스스로 종료되었을 때(침묵 등) sticky 모드면 자동 재시작
    rec.onend = () => {
      setListening(false);
      stopKeepAlive();
      // 사용자 의도(stopListen)로 끈 게 아니고 sticky라면 재시작
      if (stickyListen && !isSpeaking) gracefulRestart("onend");
    };

    // 에러 케이스도 sticky면 재시작
    rec.onerror = (ev: any) => {
      setListening(false);
      stopKeepAlive();
      // 네트워크/무음/오디오 오류 모두 회복 시도
      gracefulRestart(`onerror:${ev?.error || "unknown"}`);
    };

    // Safari 일부에서 발생하는 no-match
    (rec as any).onnomatch = () => {
      if (stickyListen && !isSpeaking) gracefulRestart("onnomatch");
    };

    return rec;
  }

function startListen() {
  if (speakRef.current) return;
  blurActive();
  setStickyListen(true);          // ✅ state 업데이트로만 제어
  const r = ensureRecognizer();
  if (!r) return;
  try { r.start(); } catch {}
}

function stopListen() {
  setStickyListen(false);         // ✅ state 업데이트
  stopKeepAlive();
  try { rec?.abort(); } catch {}
  setListening(false);
}

  // 마이크 캡처 품질(노이즈 억제) 보강
  async function getEnhancedAudioStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,              // 모노 채널 (스테레오 불필요)
          sampleRate: 48000,            // 고품질 샘플링
          noiseSuppression: true,       // 노이즈 억제 활성화
          echoCancellation: true,       // 에코 캔슬레이션 활성화
          autoGainControl: true,        // 자동 게인 컨트롤

          // Chrome 전용 고급 설정 (타입 안전성을 위해 any로 캐스팅)
          ...(navigator.userAgent.includes('Chrome') ? {
            googEchoCancellation: true,   // Chrome 전용 에코 캔슬레이션
            googAutoGainControl: true,    // Chrome 전용 자동 게인
            googNoiseSuppression: true,   // Chrome 전용 노이즈 억제
            googHighpassFilter: true,     // Chrome 전용 고역 통과 필터
          } as any : {})
        }
      });
      return stream;
    } catch (error) {
      console.warn("Enhanced audio settings failed, falling back to basic:", error);
      // 권장 기본 설정으로 폴백
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        }
      });
    }
  }

  // 기존 ensureRec 함수는 제거하고 새로운 로직으로 교체
  function startListening() {
    if (isSpeaking) return; // TTS 중엔 STT 금지
    
    const rec = ensureRecognizer();
    if (!rec) return alert("이 브라우저는 음성 인식을 지원하지 않습니다.");

    userStopRef.current = false;

                  rec.onresult = (e: any) => {
                // 후보 전부 평가해서 가장 잘 파싱되는 문장을 채택
                const alts: string[] = [];
                for (let i = 0; i < e.results[0].length; i++) {
                  alts.push(e.results[0][i].transcript);
              }
                // 후보 + 기존 누적(raw)에 대해 파싱 스코어링
                const best = pickBestParse(alts);
                // best.text: 채택 문장, best.parsed: parse 결과
                applyNewParser(best.text); // ✅ 새로운 파서 v1.1 적용
                // 채택된 문장을 raw에 추가 (줄바꿈으로 구분)
                appendRaw(best.text.trim());
                
                // [ADD] STT 누적 텍스트 자동 파싱을 위한 onSpeechChunk 호출
                onSpeechChunk(best.text.trim());
                
                // 실패한 필드가 있으면 자동 재질문
                repromptMissing(best.parsed);

                // [ADD]
                logStt(best.text, best.parsed, alts.length);
              };

    rec.onerror = () => {
      setListening(false);
      // 에러라도 사용자가 멈추지 않았다면 재시작
      if (!userStopRef.current) scheduleRestart();
    };

    rec.onend = () => {
      setListening(false);
      if (!userStopRef.current) scheduleRestart();
    };

    try {
      const now = Date.now();
      if (now - lastStartAtRef.current < MIN_RESTART_INTERVAL) return; // 너무 빠른 재시작 방지
      rec.start();
      lastStartAtRef.current = now;
      setListening(true);
    } catch (e) {
      // InvalidStateError 등 무시
    }
  }

  function scheduleRestart() {
    if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
    restartTimerRef.current = window.setTimeout(() => {
      if (!userStopRef.current) startListening();
    }, 250); // 약간의 지연 후 재시작
  }

  function stopListening() {
    userStopRef.current = true;
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    try {
      recRef.current?.stop();
      recRef.current?.abort();
    } catch {}
    setListening(false);
  }

  // 컴포넌트 언마운트 시 정리
  React.useEffect(() => {
    return () => {
      userStopRef.current = true;
      if (restartTimerRef.current) {
        window.clearTimeout(restartTimerRef.current);
      }
      try {
        recRef.current?.stop();
        recRef.current?.abort();
      } catch {}
    };
  }, []);

  // "파싱하기"는 원문 → 수동 파싱으로만 동작
  const onParse = () => {
    const text = (document.getElementById("rawInput") as HTMLTextAreaElement)?.value.trim() ?? "";
    if (!text) return alert("원문이 비었습니다.");
    const parsed = parseSignupUtterance(text) || {};
    console.log("[parsed]", parsed);
    fillForm(parsed);
  };



  const pwv = { ok: isValidPw(password), msg: isValidPw(password) ? "✅ 규칙 충족" : "ℹ️ 8자 이상, 문자+숫자 포함" };

  return (
    <div style={{maxWidth: 860, margin: "24px auto", padding: 16}}>
      <h2 style={{marginTop:0}}>Natural Signup Lab</h2>
      <p style={{opacity:.8, marginTop:8}}>
        한 번에 말하세요: “저는 이재만이고 이메일은 {`id 골뱅이 도메인 점 com`} 비밀번호는 <i>OO</i> 입니다. 전화는 010…”
      </p>

      {/* 기본 액션 버튼들 */}
      <div style={{display:"flex", gap:8, marginTop:12}}>
        <button onClick={() => setRaw("")}>입력 지우기</button>
        <button type="button" onClick={onParse}>🔎 파싱하기</button>
        <button
          disabled={!allValid}
          onClick={applyToSignup}
        >
          /signup에 적용
        </button>
        
        <label style={{display:"inline-flex", gap:8, alignItems:"center", marginLeft:8}}>
          <input type="checkbox" checked={userConsented} onChange={e=>setUserConsented(e.target.checked)} />
          음성 품질 개선에 동의(익명 로그)
        </label>
      </div>

                  {/* UI 토글/버튼(권장 레이아웃) */}
            <label style={{display:"inline-flex",gap:8,alignItems:"center"}}>
              <input type="checkbox" checked={enStrict} onChange={e=>setEnStrict(e.target.checked)} />
              영문 위주(Strict EN)
            </label>

            <label style={{display:"inline-flex",gap:8,alignItems:"center",marginLeft:12}}>
              <input type="checkbox" checked={autoReprompt} onChange={e=>setAutoReprompt(e.target.checked)} />
              자동 재질문(또박또박 안내)
            </label>

            <label style={{display:"inline-flex",gap:8,alignItems:"center",marginLeft:12}}>
              <input
                type="checkbox"
                checked={autoContinue}
                onChange={e=>setAutoContinue(e.target.checked)}
              />
              자동 이어듣기(구간마다 원문 누적)
            </label>

            <label style={{display:"inline-flex",gap:8,alignItems:"center",marginLeft:12}}>
              <input
                type="checkbox"
                checked={inlineAppend}
                onChange={e => {
                  setInlineAppend(e.target.checked);
                  if (e.target.checked) flattenRaw();    // 가로 모드 켜질 때 기존 내용도 한 줄로 정리
                }}
              />
              원문 가로 이어쓰기
            </label>

            <button onClick={flattenRaw} style={{ marginLeft: 8 }}>
              현재 원문 가로로 정리
            </button>

            {/* 비밀번호 정렬 토글 */}
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginLeft:12}}>
              <span>비밀번호 정렬:</span>
              <label><input type="radio" checked={pwOrder==="as_spoken"} onChange={()=>setPwOrder("as_spoken")} /> 말한 순서</label>
              <label><input type="radio" checked={pwOrder==="letters_first"} onChange={()=>setPwOrder("letters_first")} /> 영문 먼저</label>
              <label><input type="radio" checked={pwOrder==="digits_first"} onChange={()=>setPwOrder("digits_first")} /> 숫자 먼저</label>
            </div>

            <label style={{display:"inline-flex",gap:8,alignItems:"center"}}>
              <input type="checkbox" checked={autoParse} onChange={e=>setAutoParse(e.target.checked)} />
              듣는 동안 자동으로 필드 채우기
            </label>

            <label style={{display:"inline-flex",gap:8,alignItems:"center",marginLeft:12}}>
              <input type="checkbox" checked={stickyListen} onChange={e=>setStickyListen(e.target.checked)} />
              끊김 방지(자동 재시작)
            </label>

            <button onClick={startListen}>듣기 시작</button>
            <button onClick={stopListen}>듣기 종료</button>
            <button type="button" onClick={onParse}>🔎 파싱하기</button>
            <button onClick={onClickRepromptOnce}>누락된 항목 재질문(1회)</button>

                      <div style={{marginTop:12}}>
                  <label style={{display:"block", marginBottom:6}}>원문 입력(음성 인식 누적/직접 입력 가능)</label>
                  <textarea
                    id="rawInput"
                    ref={textareaRef}
                    value={raw}
                    onChange={(e) => setRaw(e.target.value)}
                    rows={6}
                    wrap="soft"
                    style={{
                      width: "100%",
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                      overflowX: "hidden",
                      overflowY: "auto",
                    }}
                    placeholder="여기에 인식된 문장들이 누적됩니다..."
                  />
                </div>

            {/* 완성도 표시 */}
      <div style={{marginTop:16, padding: "12px", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #e9ecef"}}>
        <h4 style={{margin: "0 0 8px 0", fontSize: "14px"}}>📊 완성도</h4>
        <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px"}}>
          {(() => {
            const done = {
              name: isNonEmpty(name),
              email: isEmail(email),
              phone: isPhone(phone),
              password: isNonEmpty(password),
            };
            
            return (
              <>
                <div style={{textAlign: "center", padding: "8px", backgroundColor: done.name ? "#d4edda" : "#f8d7da", borderRadius: "4px"}}>
                  <div style={{fontSize: "12px", fontWeight: "bold"}}>이름</div>
                  <div style={{fontSize: "10px"}}>{done.name ? "✅ 완성" : "❌ 누락"}</div>
                </div>
                <div style={{textAlign: "center", padding: "8px", backgroundColor: done.email ? "#d4edda" : "#f8d7da", borderRadius: "4px"}}>
                  <div style={{fontSize: "12px", fontWeight: "bold"}}>이메일</div>
                  <div style={{fontSize: "10px"}}>{done.email ? "✅ 완성" : "❌ 누락"}</div>
                </div>
                <div style={{textAlign: "center", padding: "8px", backgroundColor: done.phone ? "#d4edda" : "#f8d7da", borderRadius: "4px"}}>
                  <div style={{fontSize: "12px", fontWeight: "bold"}}>전화번호</div>
                  <div style={{fontSize: "10px"}}>{done.phone ? "✅ 완성" : "❌ 누락"}</div>
                </div>
                <div style={{textAlign: "center", padding: "8px", backgroundColor: done.password ? "#d4edda" : "#f8d7da", borderRadius: "4px"}}>
                  <div style={{fontSize: "12px", fontWeight: "bold"}}>비밀번호</div>
                  <div style={{fontSize: "10px"}}>{done.password ? "✅ 완성" : "❌ 누락"}</div>
                </div>
              </>
            );
          })()}
        </div>
        
        {/* ✅ 완성도 계산을 값 자체로 */}
        {(() => {
          const done = {
            name: isNonEmpty(name),
            email: isEmail(email),
            phone: isPhone(phone),
            password: isNonEmpty(password),
          };
          const totalCompleted = Object.values(done).filter(Boolean).length;
          const totalFields = Object.keys(done).length;
          
          return (
            <div style={{marginTop: "8px", fontSize: "12px", color: "#6c757d"}}>
              💡 완성도: {totalCompleted}/{totalFields} ({Math.round(totalCompleted/totalFields*100)}%)
              {totalCompleted < totalFields && (
                <span> - "누락된 항목 재질문" 버튼을 클릭하거나 음성으로 다시 말씀해 주세요.</span>
              )}
            </div>
          );
        })()}
      </div>

      <form onSubmit={handleSubmit} style={{display:"grid", gap:8, marginTop:16}}>
        <div>
          <label style={{display:"block", marginBottom:6}}>
            이름 {!name && <span style={{color: "#ff6b6b", fontSize: "12px"}}>⚠️ 누락됨</span>}
          </label>
          <input 
            id="name"
            type="text"
            value={name ?? ""} 
            onChange={(e) => {
              touchedRef.current.name = true;
              setName(e.target.value);
            }}
            style={{
              width:"100%", 
              padding:8, 
              border: name ? "1px solid #ccc" : "2px solid #ff6b6b", 
              borderRadius:4,
              backgroundColor: name ? "white" : "#fff5f5"
            }}
            placeholder="이름을 입력하세요"
            autoComplete="name"
            required
          />
        </div>
        <div>
          <label style={{display:"block", marginBottom:6}}>
            이메일 {!email && <span style={{color: "#ff6b6b", fontSize: "12px"}}>⚠️ 누락됨</span>}
          </label>
          <input 
            id="email"
            type="email"
            value={email ?? ""} 
            onChange={(e) => {
              touchedRef.current.email = true;
              setEmail(e.target.value);
            }}
            style={{
              width:"100%", 
              padding:8, 
              border: email ? "1px solid #ccc" : "2px solid #ff6b6b", 
              borderRadius:4,
              backgroundColor: email ? "white" : "#fff5f5"
            }}
            placeholder="이메일을 입력하세요"
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label style={{display:"block", marginBottom:6}}>
            전화번호 {!phone && <span style={{color: "#ff6b6b", fontSize: "12px"}}>⚠️ 누락됨</span>}
          </label>
          <input 
            type="tel"
            value={phone ?? ""} 
            onChange={(e) => setPhone(e.target.value)} 
            style={{
              width:"100%", 
              padding:8, 
              border: phone ? "1px solid #ccc" : "2px solid #ff6b6b", 
              borderRadius:4,
              backgroundColor: phone ? "white" : "#fff5f5"
            }}
            placeholder="전화번호를 입력하세요"
            autoComplete="tel"
            required
          />
        </div>
        <div>
          <label style={{display:"block", marginBottom:6}}>
            비밀번호 {!password && <span style={{color: "#ff6b6b", fontSize: "12px"}}>⚠️ 누락됨</span>}
          </label>
          <input 
            type="password"
            value={password ?? ""} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{
              width:"100%", 
              padding:8, 
              border: password ? "1px solid #ccc" : "2px solid #ff6b6b", 
              borderRadius:4,
              backgroundColor: password ? "white" : "#fff5f5"
            }}
            placeholder="비밀번호를 입력하세요"
            autoComplete="new-password"
            required
          />
          <div style={{fontSize:12, opacity:.8, marginTop:4}}>
            {pwStatus === "ok" && <span style={{color: "#28a745"}}>✅ 강함</span>}
            {pwStatus === "weak" && <span style={{color: "#ffc107"}}>⚠️ 약함 (8자 이상 권장)</span>}
            {pwStatus === "missing" && <span style={{color: "#6c757d"}}>ℹ️ 입력 필요</span>}
          </div>
        </div>
        
        {/* 회원가입 제출 버튼 */}
        <div style={{marginTop: "16px"}}>
          <button 
            type="submit" 
            disabled={submitting || !name || !email || !phone || !password}
            style={{
              width: "100%",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "bold",
              backgroundColor: submitting || !name || !email || !phone || !password ? "#6c757d" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: submitting || !name || !email || !phone || !password ? "not-allowed" : "pointer"
            }}
          >
            {submitting ? "가입 중..." : "가입하기"}
          </button>
        </div>
      </form>

      <hr style={{margin:"16px 0", opacity:.2}}/>
      <div style={{fontSize:12, opacity:.75}}>
        ※ 데모 파서는 규칙 기반 간소화 버전입니다. 정확도를 올리려면 기존 모듈(예: speechEmail, nluParser)과 단계별 파이프라인을 연결하세요.
        {FLAGS.CHAT ? (
          <span style={{color: "#28a745"}}> 💬 채팅 기능: ON</span>
        ) : (
          <span style={{color: "#6c757d"}}> 💬 채팅 기능: OFF</span>
        )}
      </div>

      {/* [ADD] ChatDock 컴포넌트 */}
      {FLAGS.CHAT && (
        <ChatDock
          missing={missing}
          pwStatus={pwStatus}
          onAsk={(text) => setRaw(prev => (prev ? prev + " " : "") + text)}
        />
      )}

      {/* [ADD] 독립적인 채팅 UI - STT와 완전 분리 */}
      {FLAGS.CHAT && (
        <div style={{marginTop: "16px", padding: "16px", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #e9ecef"}}>
          <h4 style={{margin: "0 0 16px 0", fontSize: "16px"}}>💬 독립 채팅</h4>
          <div style={{fontSize: "14px", color: "#6c757d"}}>
            채팅 기능이 활성화되어 있습니다.
            <br />
            STT와 완전히 분리되어 독립적으로 동작합니다.
          </div>
        </div>
      )}

      {/* 로컬 챗봇 테스트 UI */}
      {FLAGS.CHAT && (
        <>
          <hr style={{margin:"24px 0", opacity:.2}}/>
          <div style={{marginTop:24, padding: "16px", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #e9ecef"}}>
            <h4 style={{margin: "0 0 16px 0", fontSize: "16px"}}>🤖 로컬 챗봇 테스트</h4>
            <div style={{marginBottom: "16px", fontSize: "14px", opacity: 0.8}}>
              USE_LOCAL_BOT: {USE_LOCAL_BOT ? "✅ ON (로컬 규칙)" : "❌ OFF (서버 연결)"}
            </div>
            
            {/* 메시지 목록 */}
            <div style={{marginBottom: "16px", maxHeight: "200px", overflowY: "auto", border: "1px solid #dee2e6", borderRadius: "4px", padding: "8px", backgroundColor: "white"}}>
              {messages.length === 0 ? (
                <div style={{textAlign: "center", color: "#6c757d", fontSize: "14px", padding: "20px"}}>
                  메시지가 없습니다. 아래 입력창에 테스트해보세요.
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} style={{
                    marginBottom: "8px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    backgroundColor: msg.role === 'user' ? "#007bff" : "#e9ecef",
                    color: msg.role === 'user' ? "white" : "black",
                    alignSelf: msg.role === 'user' ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    marginLeft: msg.role === 'user' ? "auto" : "0"
                  }}>
                    <div style={{fontSize: "12px", opacity: 0.8, marginBottom: "4px"}}>
                      {msg.role === 'user' ? '사용자' : '챗봇'}
                    </div>
                    <div>{msg.text}</div>
                  </div>
                ))
              )}
            </div>

            {/* 메시지 입력 */}
            <div style={{display: "flex", gap: "8px"}}>
              <input
                type="text"
                value={localMsg}
                onChange={(e) => setLocalMsg(e.target.value)}
                placeholder="예: 이름은 이재만이고 이메일은 jae@gmail.com입니다"
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    onLocalSend();
                  }
                }}
              />
              <button
                onClick={onLocalSend}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                전송
              </button>
            </div>

            <div style={{marginTop: "12px", fontSize: "12px", color: "#6c757d"}}>
              💡 테스트 예시: "이름은 김철수이고 이메일은 kim@naver.com 전화번호는 010-1234-5678 비밀번호는 password123입니다"
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NaturalSignupLab;
