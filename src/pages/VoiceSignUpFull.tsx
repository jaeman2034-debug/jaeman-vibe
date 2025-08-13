// src/pages/VoiceSignUpFull.tsx
import { useEffect, useRef, useState } from "react";
import { initializeApp, type FirebaseOptions } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from "firebase/auth";

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

// -------------------- Firebase 부트스트랩 --------------------
const fbConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
};
const app = initializeApp(fbConfig);
const auth = getAuth(app);

// -------------------- SR 타입 보강 --------------------
type SRLike = SpeechRecognition & {};
declare global {
  interface Window {
    webkitSpeechRecognition?: { new (): SRLike };
    SpeechRecognition?: { new (): SRLike };
  }
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

// -------------------- 컴포넌트 --------------------
type Step = 0 | 1 | 2 | 3;

export default function VoiceSignUpFull() {
  const locale = "ko-KR"; // 필요 시 i18n 연결
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [srLog, setSrLog] = useState<string[]>([]);
  const log = (m: string) => setSrLog((xs) => [...xs.slice(-80), m]);

  // HTTPS 가드 (로컬 localhost는 허용)
  useEffect(() => {
    if (location.protocol !== "https:" && location.hostname !== "localhost") {
      setError("⚠️ 보안 경고: 마이크 사용을 위해 HTTPS가 필요합니다.");
    }
  }, []);

  useEffect(() => {
    // 단계 진입 시 간단 안내(음성)
    const lines = [
      "이름을 말씀해 주세요.",
      "이메일을 말씀해 주세요. 예: 지메일 점 컴",
      "비밀번호를 말씀해 주세요. 공개 장소에서는 직접 입력을 권장합니다.",
      "입력 내용을 확인하고 가입하기 버튼을 누르세요.",
    ];
    speak(lines[step], locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // 음성 듣기
  const doListen = (field: "name" | "email" | "pw") => {
    if (listening) return;
    setError(null);
    setListening(true);

    try {
      const SR = window.webkitSpeechRecognition || window.SpeechRecognition;
      if (!SR) {
        setListening(false);
        setError("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome/Edge를 권장합니다.");
        return;
      }
      const r: SRLike = new SR();
      r.lang = locale;
      r.interimResults = true;
      r.maxAlternatives = 2;
      r.continuous = false;

      let finalText = "";
      let interimText = "";

      r.onstart = () => log("▶ onstart");
      r.onresult = (e: SpeechRecognitionEvent) => {
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
          const v = cleanName(text);
          setName(v);
          if (v.length < 2) {
            setError("이름이 너무 짧습니다. 또렷이 말씀해 주세요.");
            speak("이름이 너무 짧습니다. 다시 말씀해 주세요.", locale);
          } else {
            speak(`이름 ${v} 확인했습니다. 다음 단계로 이동하세요.`, locale);
          }
        } else if (field === "email") {
          const fixed = normalizeEmail(text);
          setEmail(fixed);
          if (!isValidEmail(fixed)) {
            setError("이메일 형식이 올바르지 않습니다. 골뱅이, 점, 닷컴 형태로 말씀해 주세요.");
            speak("이메일 형식이 올바르지 않습니다.", locale);
          } else {
            speak(`이메일 ${fixed} 확인했습니다.`, locale);
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

  const stepValid =
    (step === 0 && cleanName(name.trim()).length >= 2) ||
    (step === 1 && isValidEmail(email.trim())) ||
    (step === 2 && isStrongPassword(pw)) ||
    step === 3;

  const next = () => {
    if (!stepValid) return;
    setStep((s) => (Math.min(3, s + 1) as Step));
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
          <p style={sub}>예) “이름은 이재만” / “백승권”</p>
          <div style={row}>
            <input
              style={input}
              aria-label="이름"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button style={ghost} onClick={() => doListen("name")} disabled={listening}>
              {listening ? "듣는 중..." : "🎙 말하기"}
            </button>
          </div>
          {name && cleanName(name).length < 2 && <div style={danger}>이름이 너무 짧습니다.</div>}
        </section>
      )}

      {step === 1 && (
        <section>
          <h3 style={title}>2/4 이메일 말하기</h3>
          <p style={sub}>예) “이메일은 jaeman 골뱅이 지메일 점 컴”</p>
          <div style={row}>
            <input
              style={input}
              aria-label="이메일"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button style={ghost} onClick={() => doListen("email")} disabled={listening}>
              {listening ? "듣는 중..." : "🎙 말하기"}
            </button>
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
          {srLog.length === 0
            ? <span style={{ color: "#64748b" }}>음성 인식을 시작하면 로그가 표시됩니다...</span>
            : srLog.map((msg, i) => <div key={i} style={{ marginBottom: 2 }}>{msg}</div>)}
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
