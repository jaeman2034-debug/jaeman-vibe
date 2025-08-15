import React, { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { parseNaturalSignup } from "../utils/naturalSignupParser";
import { parseSignupFromText } from "../utils/voiceSignupParser";
import { Telemetry, sanitizeRawForLogs } from "../lib/telemetry";
import { normalizeEmail, extractPhone, extractPassword } from "../lib/parse-ko";



/** Natural Signup Parser 데모: 한국어 섞인 자연어에서 name/email/phone/password 추출 */

export default function NaturalSignupLab() {
  const navigate = useNavigate();
  
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
  const [enStrict, setEnStrict] = useState(false);
  const [autoReprompt, setAutoReprompt] = useState(false); // 기본: 꺼짐(수동만)
  const [autoParse, setAutoParse] = useState(false); // 듣는 동안 자동 파싱(기본: 꺼짐)
  const [stickyListen, setStickyListen] = useState(true); // 끊겨도 자동 재시작
  const [listening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoContinue, setAutoContinue] = useState(false); // 말 끝나면 자동으로 다시 듣기
  const [inlineAppend, setInlineAppend] = useState(true); // ✅ 가로 이어쓰기 토글
  const [pwOrder, setPwOrder] = useState<"as_spoken"|"letters_first"|"digits_first">("as_spoken");
  const recRef = useRef<any>(null);
  const rawRef = useRef<HTMLTextAreaElement>(null);

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
    if (rawRef.current && raw) {
      rawRef.current.scrollTop = rawRef.current.scrollHeight;
    }
  }, [raw]);
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
      if (rawRef.current) rawRef.current.scrollTop = rawRef.current.scrollHeight;
    }, 0);
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

  

// 새로운 파서 v1.1 적용
function applyNewParser(raw: string) {
  const email = normalizeEmail(raw) ?? "";
  const phone = extractPhone(raw);
  const pw = extractPassword(raw);
  
  if (email) setEmail(email);
  if (phone) setPhone(phone);
  if (pw.value) setPassword(pw.value);
  setPwStatus(pw.status); // "ok" | "weak" | "missing"
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

      // 4) 자동 파싱이 켜져 있을 때만 필드에 채움 (기본은 꺼짐)
      if (autoParse) {
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
  const onParse = async () => {
    // 새로운 파서 v1.1 적용
    applyNewParser(raw);
    
    // 기존 파서로 로깅용 데이터 생성 (텔레메트리 호환성)
    const parsed = parseSignupFromText(raw, {
      emailMode: enStrict ? "en_strict" : "mixed",
      passwordMode: enStrict ? "en_strict" : "mixed",
      emailPick: enStrict ? "first" : "last",
      passwordOrder: pwOrder, // ★ 전달
    });

    // [MODIFY] onParse 끝부분에 추가
    await logParse(parsed, raw);
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
        <button onClick={onParse}>🔎 파싱하기</button>
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
            <button onClick={onParse}>🔎 파싱하기</button>
            <button onClick={onClickRepromptOnce}>누락된 항목 재질문(1회)</button>

                      <div style={{marginTop:12}}>
                  <label style={{display:"block", marginBottom:6}}>원문 입력(음성 인식 누적/직접 입력 가능)</label>
                  <textarea
                    ref={rawRef}
                    value={raw}
                    onChange={(e) => setRaw(e.target.value)}
                    rows={2}
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
          <div style={{textAlign: "center", padding: "8px", backgroundColor: name ? "#d4edda" : "#f8d7da", borderRadius: "4px"}}>
            <div style={{fontSize: "12px", fontWeight: "bold"}}>이름</div>
            <div style={{fontSize: "10px"}}>{name ? "✅ 완성" : "❌ 누락"}</div>
          </div>
          <div style={{textAlign: "center", padding: "8px", backgroundColor: email ? "#d4edda" : "#f8d7da", borderRadius: "4px"}}>
            <div style={{fontSize: "12px", fontWeight: "bold"}}>이메일</div>
            <div style={{fontSize: "10px"}}>{email ? "✅ 완성" : "❌ 누락"}</div>
          </div>
          <div style={{textAlign: "center", padding: "8px", backgroundColor: phone ? "#d4edda" : "#f8d7da", borderRadius: "4px"}}>
            <div style={{fontSize: "12px", fontWeight: "bold"}}>전화번호</div>
            <div style={{fontSize: "10px"}}>{phone ? "✅ 완성" : "❌ 누락"}</div>
          </div>
          <div style={{textAlign: "center", padding: "8px", backgroundColor: password ? "#d4edda" : "#f8d7da", borderRadius: "4px"}}>
            <div style={{fontSize: "12px", fontWeight: "bold"}}>비밀번호</div>
            <div style={{fontSize: "10px"}}>{password ? "✅ 완성" : "❌ 누락"}</div>
          </div>
        </div>
        {(!name || !email || !phone || !password) && (
          <div style={{marginTop: "8px", fontSize: "12px", color: "#6c757d"}}>
            💡 누락된 항목이 있습니다. "누락된 항목 재질문" 버튼을 클릭하거나 음성으로 다시 말씀해 주세요.
          </div>
        )}
      </div>

      <div style={{display:"grid", gap:8, marginTop:16}}>
        <div>
          <label style={{display:"block", marginBottom:6}}>
            이름 {!name && <span style={{color: "#ff6b6b", fontSize: "12px"}}>⚠️ 누락됨</span>}
          </label>
          <input 
            value={name} 
            onChange={(e)=>setName(e.target.value)} 
            style={{
              width:"100%", 
              padding:8, 
              border: name ? "1px solid #ccc" : "2px solid #ff6b6b", 
              borderRadius:4,
              backgroundColor: name ? "white" : "#fff5f5"
            }}
            placeholder="이름을 입력하세요"
          />
        </div>
        <div>
          <label style={{display:"block", marginBottom:6}}>
            이메일 {!email && <span style={{color: "#ff6b6b", fontSize: "12px"}}>⚠️ 누락됨</span>}
          </label>
          <input 
            value={email} 
            onChange={(e)=>setEmail(e.target.value)} 
            style={{
              width:"100%", 
              padding:8, 
              border: email ? "1px solid #ccc" : "2px solid #ff6b6b", 
              borderRadius:4,
              backgroundColor: email ? "white" : "#fff5f5"
            }}
            placeholder="이메일을 입력하세요"
          />
        </div>
        <div>
          <label style={{display:"block", marginBottom:6}}>
            전화번호 {!phone && <span style={{color: "#ff6b6b", fontSize: "12px"}}>⚠️ 누락됨</span>}
          </label>
          <input 
            value={phone} 
            onChange={(e)=>setPhone(e.target.value)} 
            style={{
              width:"100%", 
              padding:8, 
              border: phone ? "1px solid #ccc" : "2px solid #ff6b6b", 
              borderRadius:4,
              backgroundColor: phone ? "white" : "#fff5f5"
            }}
            placeholder="전화번호를 입력하세요"
          />
        </div>
        <div>
          <label style={{display:"block", marginBottom:6}}>
            비밀번호 {!password && <span style={{color: "#ff6b6b", fontSize: "12px"}}>⚠️ 누락됨</span>}
          </label>
          <input 
            value={password} 
            onChange={(e)=>setPassword(e.target.value)} 
            style={{
              width:"100%", 
              padding:8, 
              border: password ? "1px solid #ccc" : "2px solid #ff6b6b", 
              borderRadius:4,
              backgroundColor: password ? "white" : "#fff5f5"
            }}
            placeholder="비밀번호를 입력하세요"
          />
          <div style={{fontSize:12, opacity:.8, marginTop:4}}>
            {pwStatus === "ok" && <span style={{color: "#28a745"}}>✅ 강함</span>}
            {pwStatus === "weak" && <span style={{color: "#ffc107"}}>⚠️ 약함 (8자 이상 권장)</span>}
            {pwStatus === "missing" && <span style={{color: "#6c757d"}}>ℹ️ 입력 필요</span>}
          </div>
        </div>
      </div>

      <hr style={{margin:"16px 0", opacity:.2}}/>
      <div style={{fontSize:12, opacity:.75}}>
        ※ 데모 파서는 규칙 기반 간소화 버전입니다. 정확도를 올리려면 기존 모듈(예: speechEmail, nluParser)과 단계별 파이프라인을 연결하세요.
      </div>
    </div>
  );
}
