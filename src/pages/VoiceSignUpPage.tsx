// src/pages/VoiceSignUpPage.tsx
import { useEffect, useRef, useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword
} from "firebase/auth";
import type { 
  UserCredential
} from "firebase/auth";
import { auth, app } from "@/firebase";
import { getFirestore } from "firebase/firestore";

const db = getFirestore(app);

/**
 * ✅ 이 파일 하나로 끝나는 "통복" 버전
 * - useSettings 대체: 기본 locale은 ko-KR
 * - 마이크 권한 확인/레벨미터/정리(force kill) 내장
 * - 이름/이메일/비밀번호 정규화/검증 유틸 내장
 * - 브라우저 SpeechRecognition 직접 구동 (클릭 컨텍스트에서 즉시 start)
 * - Firebase Auth 연동 (회원가입/로그인)
 * - TTS 피드백 (음성 안내)
 * - HTTPS 체크·가드 (보안 강화)
 *
 * 사용법:
 * 1) 이 파일을 프로젝트에 추가
 * 2) 라우터가 있다면 이 컴포넌트를 라우트에 연결
 *    (또는 App.tsx 등에서 <VoiceSignUpPage /> 렌더)
 */

// ----------------------------------------------------
// 🔒 HTTPS 체크·가드
// ----------------------------------------------------
function checkHTTPS(): boolean {
  if (window.location.protocol === 'https:') return true;
  if (window.location.hostname === 'localhost') return true;
  if (window.location.hostname === '127.0.0.1') return true;
  return false;
}

function showHTTPSWarning(): void {
  if (!checkHTTPS()) {
    alert('⚠️ 보안을 위해 HTTPS 연결이 필요합니다.\n현재 HTTP로 접속 중입니다.');
  }
}

// ----------------------------------------------------
// 🔊 TTS 피드백 유틸
// ----------------------------------------------------
function speak(text: string, rate: number = 1.5): void {
  if ('speechSynthesis' in window) {
    // 기존 음성 중지
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = rate; // 최적 속도 1.5
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }
}

// ----------------------------------------------------
// 🔥 Firebase Auth 연동
// ----------------------------------------------------
async function signUpWithFirebase(email: string, password: string): Promise<UserCredential> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: any) {
    if (error && typeof error === 'object' && 'code' in error) {
      throw new Error(getFirebaseErrorMessage(error.code));
    }
    throw new Error('알 수 없는 오류가 발생했습니다.');
  }
}

async function signInWithFirebase(email: string, password: string): Promise<UserCredential> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: any) {
    if (error && typeof error === 'object' && 'code' in error) {
      throw new Error(getFirebaseErrorMessage(error.code));
    }
    throw new Error('알 수 없는 오류가 발생했습니다.');
  }
}

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일입니다.';
    case 'auth/invalid-email':
      return '올바르지 않은 이메일 형식입니다.';
    case 'auth/operation-not-allowed':
      return '이메일/비밀번호 로그인이 비활성화되어 있습니다.';
    case 'auth/weak-password':
      return '비밀번호가 너무 약합니다. 8자 이상으로 설정해 주세요.';
    case 'auth/user-disabled':
      return '비활성화된 계정입니다.';
    case 'auth/user-not-found':
      return '등록되지 않은 이메일입니다.';
    case 'auth/wrong-password':
      return '잘못된 비밀번호입니다.';
    case 'auth/too-many-requests':
      return '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해 주세요.';
    default:
      return '인증 중 오류가 발생했습니다.';
  }
}

// ----------------------------------------------------
// 브라우저 타입 안전 처리 (webkitSpeechRecognition 대응)
// ----------------------------------------------------
type SpeechRecognitionErrorCode =
  | "no-speech"
  | "aborted"
  | "audio-capture"
  | "network"
  | "not-allowed"
  | "service-not-allowed"
  | "bad-grammar"
  | "language-not-supported"
  | "unknown";

type SRLike = SpeechRecognition & {
  // webkitSpeechRecognition도 포함
};
declare global {
  interface Window {
    webkitSpeechRecognition?: {
      new (): SRLike;
    };
    SpeechRecognition?: {
      new (): SRLike;
    };
  }
}

// ----------------------------------------------------
// 간단 Settings 대체 훅 (기본 ko-KR)
// ----------------------------------------------------
function useSettingsFallback() {
  return { locale: "ko-KR" as const };
}

// ----------------------------------------------------
// 🔧 마이크 유틸: 권한/레벨미터/강제종료
// ----------------------------------------------------
async function ensureMicPermission(): Promise<void> {
  // 권한 강제 확인 (권한 프롬프트)
  await navigator.mediaDevices.getUserMedia({ audio: true });
}

type MeterStopper = () => void;

/**
 * 마이크 레벨 미터 시작
 * - callback(v): 0~1 RMS 근사값
 * - 반환값: 정지 함수
 */
async function startMicLevelMeter(
  callback: (level01: number) => void
): Promise<MeterStopper> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });

  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new Ctx();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);

  const buf = new Float32Array(analyser.fftSize);
  let rafId = 0;

  const tick = () => {
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length); // 0~1 근사
    callback(Math.max(0, Math.min(1, rms)));
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  // 정지 함수
  const stop = () => {
    try {
      cancelAnimationFrame(rafId);
      source.disconnect();
      analyser.disconnect();
      ctx.close();
    } catch {}
    try {
      stream.getTracks().forEach((t) => t.stop());
    } catch {}
  };
  return stop;
}

/** 마이크/오디오 리소스 강제 종료용 (보수적으로 호출) */
function forceKillMic() {
  // 이 통복 파일에선 startMicLevelMeter가 리턴하는 stop으로 관리되므로
  // 여기서는 추가로 종료할 스트림/컨텍스트를 추적하지 않음.
  // 필요시 확장 가능.
}

// ----------------------------------------------------
// 🧹 정규화/검증 유틸
// ----------------------------------------------------
function cleanName(raw: string): string {
  // 한글/영문/공백만 유지, 다중 공백 단일화
  return (raw || "")
    .replace(/[^a-zA-Z가-힣\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeEmail(raw: string): string {
  let t = (raw || "").toLowerCase().trim();

  // 한글 음성 표현 치환
  // 예: "골뱅이" -> @, "점" -> ".", "닷컴" -> ".com"
  t = t
    .replace(/\s+/g, " ")
    .replace(/골뱅이|앳|에이티/g, "@")
    .replace(/점\s?/g, ".")
    .replace(/닷컴|닷 컴|닷 콤/g, ".com")
    .replace(/\s+/g, "");

  // 공백 제거, 흔한 한글 도메인 발화 보정
  t = t
    .replace(/지메일|gmail\.?com/g, "gmail.com")
    .replace(/네이버|naver\.?com/g, "naver.com")
    .replace(/다음|daum\.?net/g, "daum.net")
    .replace(/야후|yahoo\.?com/g, "yahoo.com");

  return t;
}

function isValidEmail(v: string): boolean {
  if (!v) return false;
  // 간단/견고한 검증
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isStrongPassword(v: string): boolean {
  return (v || "").length >= 8; // 필요시 규칙 강화
}

// ----------------------------------------------------
// 📦 메인 컴포넌트
// ----------------------------------------------------
type Step = 0 | 1 | 2 | 3; // 0: 이름, 1: 이메일, 2: 비번, 3: 확인/제출
type Mode = "signup" | "signin"; // 회원가입 또는 로그인 모드

export default function VoiceSignUpPage() {
  const { locale } = useSettingsFallback();
  const safeLocale = locale || "ko-KR";

  // HTTPS 체크
  useEffect(() => {
    showHTTPSWarning();
  }, []);

  const [mode, setMode] = useState<Mode>("signup");
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // STT 로그 표시 (콘솔 안 봐도 원인 파악)
  const [srLog, setSrLog] = useState<string[]>([]);
  const log = (m: string) => setSrLog((xs) => [...xs.slice(-80), m]);

  // 마이크 레벨 미터 상태
  const [micLevel, setMicLevel] = useState(0); // 0~1
  const meterStopRef = useRef<null | (() => void)>(null);
  const [meterOn, setMeterOn] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      try {
        meterStopRef.current?.();
      } catch {}
      forceKillMic();
    };
  }, []);

  // 미터 시작/종료
  async function startMeter() {
    try {
      await ensureMicPermission();
      meterStopRef.current = await startMicLevelMeter((v) => setMicLevel(v));
      setMeterOn(true);
      speak("마이크가 활성화되었습니다.");
    } catch {
      setError("마이크 권한이 필요합니다. 주소창 왼쪽 🔒에서 허용으로 변경하세요.");
      speak("마이크 권한이 필요합니다.");
    }
  }
  function stopMeter() {
    try {
      meterStopRef.current?.();
    } catch {}
    meterStopRef.current = null;
    setMeterOn(false);
    setMicLevel(0);
    speak("마이크가 비활성화되었습니다.");
  }

  // 음성 듣기 (브라우저 SR 직접)
  const doListen = (field: "name" | "email" | "pw") => {
    if (listening) return;
    setError(null);
    setListening(true);

    // TTS 피드백
    if (field === "name") {
      speak("이름을 말씀해 주세요.");
    } else if (field === "email") {
      speak("이메일을 말씀해 주세요.");
    } else {
      speak("비밀번호를 말씀해 주세요.");
    }

    try {
      const SR = window.webkitSpeechRecognition || window.SpeechRecognition;
      if (!SR) {
        setListening(false);
        setError("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome/Edge 사용을 권장합니다.");
        speak("이 브라우저는 음성 인식을 지원하지 않습니다.");
        return;
      }

      // 반드시 사용자 클릭 핸들러 컨텍스트에서 즉시 생성/시작 (await 금지)
      const r: SRLike = new SR();
      r.lang = safeLocale;
      r.interimResults = true;
      r.maxAlternatives = 2;
      r.continuous = false;

      let finalText = "";
      let interimText = "";

      r.onstart = () => log("▶ onstart");
      r.onaudiostart = () => log("▶ onaudiostart");
      r.onsoundstart = () => log("▶ onsoundstart");
      r.onspeechstart = () => log("▶ onspeechstart");

      r.onresult = (e: SpeechRecognitionEvent) => {
        try {
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            const alt = res && res[0];
            const t = (alt?.transcript || "").trim();
            if (!t) continue;
            if (res.isFinal) finalText = t;
            else interimText = t;
          }
          log(`🎯 onresult: "${finalText || interimText}"`);
        } catch {}
      };

      r.onerror = (e: any) => {
        const code: SpeechRecognitionErrorCode = e?.error || "unknown";
        log(`❌ onerror: ${code}`);
        const errorMsg = 
          code === "not-allowed"
            ? "마이크 권한이 거부되었습니다. 주소창 왼쪽 🔒에서 허용으로 변경하세요."
            : code === "audio-capture"
            ? "마이크 장치를 찾을 수 없습니다. OS의 입력 장치를 확인하세요."
            : code === "no-speech"
            ? "말소리가 감지되지 않았습니다. 조금 더 크게 또렷하게 말씀해 주세요."
            : "음성 인식 오류가 발생했습니다. 다시 시도해 주세요.";
        
        setError(errorMsg);
        speak(errorMsg);
      };

      r.onend = () => {
        log("■ onend");
        setListening(false);

        const text = (finalText || interimText || "").trim();
        if (!text) {
          speak("음성이 감지되지 않았습니다. 다시 시도해 주세요.");
          return;
        }

        if (field === "name") {
          const cleaned = cleanName(text);
          setName(cleaned);
          speak(`이름이 ${cleaned}로 설정되었습니다.`);
        } else if (field === "email") {
          const fixed = normalizeEmail(text);
          setEmail(fixed);
          if (!isValidEmail(fixed)) {
            setError("이메일 형식이 올바르지 않습니다. 다시 말씀해 주세요.");
            speak("이메일 형식이 올바르지 않습니다. 다시 말씀해 주세요.");
          } else {
            speak(`이메일이 ${fixed}로 설정되었습니다.`);
          }
        } else {
          const val = text.replace(/\s+/g, "");
          setPw(val);
          if (!isStrongPassword(val)) {
            setError("비밀번호는 8자 이상이어야 합니다.");
            speak("비밀번호는 8자 이상이어야 합니다.");
          } else {
            speak("비밀번호가 설정되었습니다.");
          }
        }
      };

      r.start(); // 즉시 시작
      log(`🎙 start(lang=${r.lang})`);
    } catch (err: any) {
      setListening(false);
      setError(err?.message || "음성 인식 초기화 실패");
      speak("음성 인식 초기화에 실패했습니다.");
    }
  };

  // 단계 검증
  const stepValid =
    (step === 0 && cleanName(name.trim()).length >= 2) ||
    (step === 1 && isValidEmail(email.trim())) ||
    (step === 2 && isStrongPassword(pw)) ||
    step === 3;

  const next = () => {
    setStep((s) => (Math.min(3, s + 1) as Step));
    if (step < 3) {
      const nextStep = step + 1;
      if (nextStep === 1) speak("이름이 확인되었습니다. 이메일을 입력해 주세요.");
      else if (nextStep === 2) speak("이메일이 확인되었습니다. 비밀번호를 입력해 주세요.");
      else if (nextStep === 3) speak("모든 정보가 입력되었습니다. 확인 후 가입해 주세요.");
    }
  };
  
  const prev = () => {
    setStep((s) => (Math.max(0, s - 1) as Step));
    if (step > 0) {
      const prevStep = step - 1;
      if (prevStep === 0) speak("이름 입력 단계로 돌아갔습니다.");
      else if (prevStep === 1) speak("이메일 입력 단계로 돌아갔습니다.");
      else if (prevStep === 2) speak("비밀번호 입력 단계로 돌아갔습니다.");
    }
  };

  // Firebase Auth 제출
  async function submitAuth() {
    setError(null);
    setLoading(true);
    
    try {
      if (mode === "signup") {
        // 회원가입
        const userCredential = await signUpWithFirebase(email, pw);
        speak(`회원가입이 완료되었습니다! 환영합니다, ${name}님.`);
        alert(`🎉 회원가입 완료!\n이름: ${name}\n이메일: ${email}\nUID: ${userCredential.user.uid}`);
        
        // 이름 업데이트 (선택사항)
        // await updateProfile(userCredential.user, { displayName: name });
        
      } else {
        // 로그인
        const userCredential = await signInWithFirebase(email, pw);
        speak(`로그인이 완료되었습니다! 환영합니다, ${userCredential.user.displayName || email}님.`);
        alert(`🔐 로그인 완료!\n이메일: ${email}\nUID: ${userCredential.user.uid}`);
      }
      
      // TODO: 실제 라우팅 (예: 메인 페이지로 이동)
      // navigate('/dashboard');
      
    } catch (e: any) {
      setError(e?.message || "인증 중 오류가 발생했습니다.");
      speak(e?.message || "인증 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // 모드 전환
  const toggleMode = () => {
    const newMode = mode === "signup" ? "signin" : "signup";
    setMode(newMode);
    setStep(0);
    setName("");
    setEmail("");
    setPw("");
    setError(null);
    
    if (newMode === "signup") {
      speak("회원가입 모드로 전환되었습니다.");
    } else {
      speak("로그인 모드로 전환되었습니다.");
    }
  };

  // ---------------- UI 스타일 ----------------
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
  const modeToggle: React.CSSProperties = {
    ...ghost,
    background: mode === "signup" ? "#10b981" : "#f59e0b",
    color: "#fff",
    borderColor: mode === "signup" ? "#10b981" : "#f59e0b",
  };

  return (
    <div style={wrap}>
      {/* HTTPS 상태 표시 */}
      <div style={{ 
        padding: "8px 12px", 
        background: checkHTTPS() ? "#dcfce7" : "#fef3c7", 
        color: checkHTTPS() ? "#166534" : "#92400e",
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 12,
        textAlign: "center"
      }}>
        {checkHTTPS() ? "🔒 HTTPS 보안 연결" : "⚠️ HTTP 연결 (보안 권장)"}
      </div>

      <h2 style={title}>
        {mode === "signup" ? "음성 회원가입" : "음성 로그인"}
      </h2>
      
      {/* 모드 전환 버튼 */}
      <div style={{ marginBottom: 16 }}>
        <button style={modeToggle} onClick={toggleMode}>
          {mode === "signup" ? "🔐 로그인 모드로 전환" : "📝 회원가입 모드로 전환"}
        </button>
      </div>

      <div style={sub}>
        언어: {safeLocale}{" "}
        <span style={{ marginLeft: 8 }}>
          {meterOn ? (
            <button style={ghost} onClick={stopMeter}>🔌 미터 종료</button>
          ) : (
            <button style={ghost} onClick={startMeter}>🔊 미터 시작</button>
          )}
        </span>
      </div>

      {/* 마이크 입력 레벨 표시 */}
      <div style={{ margin: "8px 0 16px" }}>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
          마이크 입력 레벨{" "}
          {listening ? "🎤 음성 인식 중" : meterOn ? (micLevel > 0.1 ? "🎤 입력 감지" : "…대기중") : "(꺼짐)"}
        </div>
        <div style={{ height: 8, background: "#e2e8f0", borderRadius: 6, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${listening ? 100 : Math.round(micLevel * 100)}%`,
              background: listening ? "#2563eb" : "#10b981",
              transition: "width .08s",
            }}
          />
        </div>
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
          <p style={sub}>예) "이름은 이재만" / "백승권"</p>
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
              onClick={() => doListen("name")}
              disabled={listening}
              title="이름을 음성으로 입력"
            >
              {listening ? "듣는 중..." : "🎙 말하기"}
            </button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section>
          <h3 style={title}>2/4 이메일 말하기</h3>
          <p style={sub}>예) "이메일은 jaeman 골뱅이 지메일 점 컴"</p>
          <div style={row}>
            <input
              style={input}
              aria-label="이메일"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              style={ghost}
              onClick={() => doListen("email")}
              disabled={listening}
              title="이메일을 음성으로 입력"
            >
              {listening ? "듣는 중..." : "🎙 말하기"}
            </button>
          </div>
          {!isValidEmail(email) && email && (
            <div style={{ color: "#dc2626", marginTop: 8 }}>올바른 이메일 형식이 아닙니다.</div>
          )}
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
            <button
              style={ghost}
              onClick={() => doListen("pw")}
              disabled={listening}
              title="비밀번호를 음성으로 입력"
            >
              {listening ? "듣는 중..." : "🎙 말하기"}
            </button>
          </div>
          {!isStrongPassword(pw) && pw && (
            <div style={{ color: "#dc2626", marginTop: 8 }}>비밀번호는 8자 이상이어야 합니다.</div>
          )}
        </section>
      )}

      {step === 3 && (
        <section>
          <h3 style={title}>4/4 확인 후 {mode === "signup" ? "가입" : "로그인"}</h3>
          <ul style={{ lineHeight: 1.8, color: "#334155" }}>
            <li><b>이름</b>: {name || "-"}</li>
            <li><b>이메일</b>: {email || "-"}</li>
          </ul>
          <p style={{ color: "#64748b" }}>※ 비밀번호는 보안상 표시하지 않습니다.</p>
        </section>
      )}

      {/* 오류 */}
      {error && <div style={{ color: "#dc2626", marginTop: 8 }}>{error}</div>}

      {/* STT 로그 */}
      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: "#f8fafc",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>
          🎤 STT 로그:
        </div>
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
          {srLog.length === 0 ? (
            <span style={{ color: "#64748b" }}>음성 인식을 시작하면 로그가 표시됩니다...</span>
          ) : (
            srLog.map((msg, i) => <div key={i} style={{ marginBottom: 2 }}>{msg}</div>)
          )}
        </div>
      </div>

      {/* 내비게이션 */}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button style={ghost} onClick={prev} disabled={step === 0}>
          이전
        </button>
        {step < 3 ? (
          <button
            style={{ ...btn, opacity: stepValid ? 1 : 0.6 }}
            onClick={next}
            disabled={!stepValid}
          >
            다음
          </button>
        ) : (
          <button
            style={{ ...btn, opacity: stepValid ? 1 : 0.6 }}
            onClick={submitAuth}
            disabled={!stepValid || loading}
          >
            {loading ? "처리 중..." : mode === "signup" ? "가입하기" : "로그인"}
          </button>
        )}
      </div>

      {/* TTS 테스트 버튼 */}
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button 
          style={{ ...ghost, fontSize: 12, padding: "6px 10px" }}
          onClick={() => speak("음성 피드백이 정상 작동하고 있습니다.")}
        >
          🔊 TTS 테스트
        </button>
      </div>
    </div>
  );
}
