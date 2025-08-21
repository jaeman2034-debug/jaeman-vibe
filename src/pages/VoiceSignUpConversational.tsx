import { useEffect, useRef, useState } from "react";
import { auth, app } from "@/firebase";
import { getFirestore } from "firebase/firestore";

const db = getFirestore(app);
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  updateProfile,
} from "firebase/auth";

// ---- SpeechRecognition 타입 보강 ----
type SRLike = SpeechRecognition & {};
declare global {
  interface Window {
    webkitSpeechRecognition?: { new (): SRLike };
    SpeechRecognition?: { new (): SRLike };
  }
}

// ---- 유틸: 정규화/검증 ----
function cleanName(raw: string): string {
  return (raw || "").replace(/[^a-zA-Z가-힣\s]/g, "").replace(/\s+/g, " ").trim();
}
function normalizeEmail(raw: string): string {
  let t = (raw || "").toLowerCase().trim();
  t = t
    .replace(/\s+/g, " ")
    .replace(/골뱅이|앳|에이티/g, "@")
    .replace(/점\s?/g, ".")
    .replace(/닷컴|닷 콤|닷 컴/g, ".com")
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

// ---- 유틸: TTS ----
function speak(text: string, lang = "ko-KR") {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

// ---- 상태 타입 ----
type Step = "name" | "email" | "password" | "confirm" | "done";

// ---- 메인 컴포넌트 ----
export default function VoiceSignUpConversational() {
  const locale = "ko-KR";
  const [step, setStep] = useState<Step>("name");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [log, setLog] = useState<string[]>([]);
  const pushLog = (m: string) => setLog((xs) => [...xs.slice(-80), m]);

  const recognitionRef = useRef<SRLike | null>(null);

  // HTTPS 가드
  useEffect(() => {
    if (location.protocol !== "https:" && location.hostname !== "localhost") {
      setError("⚠️ 마이크 사용을 위해 HTTPS가 필요합니다.");
    }
  }, []);

  // 단계 진입 안내 (TTS)
  useEffect(() => {
    const prompts: Record<Step, string> = {
      name: "이름을 말씀해 주세요. 예: 이재만",
      email: "이메일을 말씀해 주세요. 예: 제이메니 지메일 점 컴",
      password: "비밀번호를 말씀해 주세요. 공개 장소에서는 직접 입력을 권장합니다.",
      confirm: "입력 내용을 확인했습니다. 가입하시려면 가입하기라고 말씀하거나 버튼을 눌러 주세요.",
      done: "회원가입이 완료되었습니다. 환영합니다.",
    };
    speak(prompts[step], locale);
  }, [step]);

  // 공통: 명령어 처리
  function parseCommand(t: string) {
    const s = t.replace(/\s+/g, "").toLowerCase();
    if (/(초기화|리셋|reset)/.test(s)) return "reset";
    if (/(취소|캔슬|cancel)/.test(s)) return "cancel";
    if (/(다시|리피트|repeat)/.test(s)) return "repeat";
    if (/(이전|뒤로|백|back)/.test(s)) return "back";
    if (/(다음|넥스트|next)/.test(s)) return "next";
    if (/(가입|완료|확인|submit|sign)/.test(s)) return "submit";
    return null;
  }

  // 음성 듣기(현재 step에 맞춰 처리)
  const listen = () => {
    if (listening) return;
    setError(null);

    const SR = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SR) {
      setError("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome/Edge를 권장합니다.");
      return;
    }
    const r: SRLike = new SR();
    recognitionRef.current = r;

    r.lang = locale;
    r.interimResults = true;
    r.maxAlternatives = 2;
    r.continuous = false;

    let finalText = "";
    let interimText = "";

    r.onstart = () => {
      setListening(true);
      pushLog("▶ onstart");
    };
    r.onresult = (e: SpeechRecognitionEvent) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const t = (res?.[0]?.transcript || "").trim();
        if (!t) continue;
        if (res.isFinal) finalText = t;
        else interimText = t;
      }
      pushLog(`🎯 onresult: "${finalText || interimText}"`);
    };
    r.onerror = (e: any) => {
      pushLog(`❌ onerror: ${e?.error || "unknown"}`);
      setError(
        e?.error === "not-allowed"
          ? "마이크 권한이 거부되었습니다. 주소창 왼쪽 🔒에서 허용해 주세요."
          : e?.error === "no-speech"
          ? "말소리가 감지되지 않았습니다. 조금 더 크게 또렷하게 말씀해 주세요."
          : "음성 인식 오류가 발생했습니다. 다시 시도해 주세요."
      );
    };
    r.onend = () => {
      pushLog("■ onend");
      setListening(false);

      const text = (finalText || interimText || "").trim();
      if (!text) return;

      // 공통 명령어 우선 처리
      const cmd = parseCommand(text);
      if (cmd === "reset") {
        setName(""); setEmail(""); setPw(""); setStep("name");
        speak("모든 입력을 초기화했습니다. 이름부터 다시 진행합니다.", locale);
        return;
      }
      if (cmd === "cancel") {
        speak("취소했습니다. 필요하시면 다시 시작해 주세요.", locale);
        return;
      }
      if (cmd === "repeat") {
        // 현재 단계 안내 재생만
        const prompts: Record<Step, string> = {
          name: "이름을 말씀해 주세요.",
          email: "이메일을 말씀해 주세요. 예: 지메일 점 컴",
          password: "비밀번호를 말씀해 주세요.",
          confirm: "가입하시려면 가입하기라고 말씀해 주세요.",
          done: "회원가입이 완료되었습니다.",
        };
        speak(prompts[step], locale);
        return;
      }
      if (cmd === "back") {
        setStep((s) => (s === "email" ? "name" : s === "password" ? "email" : s === "confirm" ? "password" : s));
        return;
      }
      if (cmd === "next") {
        // 현재 값이 유효하면 다음으로
        if (step === "name" && cleanName(name).length >= 2) setStep("email");
        else if (step === "email" && isValidEmail(email)) setStep("password");
        else if (step === "password" && isStrongPassword(pw)) setStep("confirm");
        else speak("현재 단계의 입력이 유효하지 않습니다.", locale);
        return;
      }
      if (cmd === "submit" && step === "confirm") {
        handleSignup();
        return;
      }

      // 단계별 입력 처리
      if (step === "name") {
        const v = cleanName(text);
        setName(v);
        if (v.length < 2) {
          setError("이름이 너무 짧습니다. 다시 말씀해 주세요.");
          speak("이름이 너무 짧습니다. 다시 말씀해 주세요.", locale);
        } else {
          speak(`이름 ${v} 확인했습니다. 이메일 단계로 이동하시려면 다음이라고 말씀해 주세요.`, locale);
        }
      } else if (step === "email") {
        const fixed = normalizeEmail(text);
        setEmail(fixed);
        if (!isValidEmail(fixed)) {
          setError("이메일 형식이 올바르지 않습니다. 골뱅이, 점, 닷컴 형태로 말씀해 주세요.");
          speak("이메일 형식이 올바르지 않습니다.", locale);
        } else {
          speak(`이메일 ${fixed} 확인했습니다. 비밀번호 단계로 이동하시려면 다음이라고 말씀해 주세요.`, locale);
        }
      } else if (step === "password") {
        const v = text.replace(/\s+/g, "");
        setPw(v);
        if (!isStrongPassword(v)) {
          setError("비밀번호는 8자 이상이어야 합니다.");
          speak("비밀번호는 8자 이상이어야 합니다.", locale);
        } else {
          speak("비밀번호를 저장했습니다. 확인 단계로 이동하시려면 다음이라고 말씀해 주세요.", locale);
        }
      }
    };

    // 시작
    r.start();
    pushLog(`🎙 start(lang=${r.lang})`);
  };

  // 가입 처리
  async function handleSignup() {
    if (!(cleanName(name).length >= 2 && isValidEmail(email) && isStrongPassword(pw))) {
      setError("입력이 유효하지 않습니다. 각 항목을 다시 확인해 주세요.");
      speak("입력이 유효하지 않습니다.", locale);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods && methods.length > 0) {
        setError("이미 가입된 이메일입니다. 다른 이메일을 사용해 주세요.");
        speak("이미 가입된 이메일입니다.", locale);
        setBusy(false);
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, pw);
      try {
        await updateProfile(cred.user, { displayName: cleanName(name) });
      } catch {}
      setStep("done");
      speak("회원가입이 완료되었습니다. 환영합니다!", locale);
      alert(`가입 완료! 환영합니다, ${name}님`);
    } catch (e: any) {
      setError(e?.message || "가입 중 오류가 발생했습니다.");
      speak("가입 중 오류가 발생했습니다.", locale);
    } finally {
      setBusy(false);
    }
  }

  const wrap: React.CSSProperties = {
    maxWidth: 620,
    margin: "32px auto",
    padding: "0 16px",
    fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif",
  };
  const title: React.CSSProperties = { fontSize: 22, fontWeight: 900, margin: "12px 0 6px" };
  const row: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center", marginBottom: 10 };
  const btn: React.CSSProperties = {
    border: 0, background: "#2563eb", color: "#fff",
    padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 800,
  };
  const ghost: React.CSSProperties = {
    border: "2px solid #e2e8f0", background: "#fff", color: "#334155",
    padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 700,
  };
  const pill = (ok: boolean) => ({
    padding: "6px 10px", borderRadius: 999, fontSize: 12,
    background: ok ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.15)",
    color: ok ? "#10B981" : "#EF4444", border: `1px solid ${ok ? "#10B981" : "#EF4444"}`
  } as React.CSSProperties);

  return (
    <div style={wrap}>
      <h2 style={title}>🗣️ 대화형 음성 회원가입</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={pill(true)}>HTTPS/localhost {location.protocol === "https:" || location.hostname === "localhost" ? "OK" : "권장"}</span>
        <span style={pill(!!(window.webkitSpeechRecognition || window.SpeechRecognition))}>SpeechRecognition {window.webkitSpeechRecognition || window.SpeechRecognition ? "OK" : "미지원"}</span>
      </div>

      {/* 진행 정보 */}
      <div style={{ marginBottom: 10, color: "#64748b" }}>
        단계: {step === "name" ? "이름" : step === "email" ? "이메일" : step === "password" ? "비밀번호" : step === "confirm" ? "확인" : "완료"}
      </div>

      {/* 입력 카드 */}
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <b>이름</b>: {name || <span style={{ opacity: .6 }}>-</span>}
        </div>
        <div style={{ marginBottom: 8 }}>
          <b>이메일</b>: {email || <span style={{ opacity: .6 }}>-</span>}
        </div>
        <div style={{ marginBottom: 8 }}>
          <b>비밀번호</b>: {pw ? "●●●●●●" : <span style={{ opacity: .6 }}>-</span>}
        </div>

        {step !== "done" && (
          <div style={row}>
            <button style={ghost} onClick={listen} disabled={listening}>
              {listening ? "🎙 듣는 중..." : "🎙 말하기"}
            </button>
            {step !== "name" && (
              <button
                style={ghost}
                onClick={() => setStep(step === "email" ? "name" : step === "password" ? "email" : "password")}
                disabled={listening}
              >
                ⬅️ 이전 단계
              </button>
            )}
            {step !== "confirm" && (
              <button
                style={ghost}
                onClick={() => {
                  if (step === "name" && cleanName(name).length >= 2) setStep("email");
                  else if (step === "email" && isValidEmail(email)) setStep("password");
                  else if (step === "password" && isStrongPassword(pw)) setStep("confirm");
                  else speak("현재 단계의 입력이 유효하지 않습니다.", locale);
                }}
                disabled={listening}
              >
                ➡️ 다음 단계
              </button>
            )}
          </div>
        )}
      </div>

      {/* 확인 & 가입 */}
      {step === "confirm" && (
        <div style={{ marginBottom: 12, color: "#334155" }}>
          입력한 정보로 가입합니다. "가입하기"라고 말하거나 버튼을 누르세요.
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {step !== "done" && (
          <button
            style={{ ...btn, opacity: step === "confirm" && !busy ? 1 : 0.7 }}
            onClick={handleSignup}
            disabled={step !== "confirm" || busy}
          >
            {busy ? "가입 중..." : "가입하기"}
          </button>
        )}
        <button
          style={ghost}
          onClick={() => { setName(""); setEmail(""); setPw(""); setStep("name"); }}
          disabled={busy || listening}
        >
          초기화
        </button>
      </div>

      {/* 오류 */}
      {error && <div style={{ color: "#dc2626", marginTop: 10 }}>{error}</div>}

      {/* 로그 */}
      <div style={{ marginTop: 14, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>🎤 STT 로그</div>
        <div style={{ height: 140, overflow: "auto", fontSize: 11, fontFamily: "monospace", background: "#0f172a", color: "#e2e8f0", padding: 8, borderRadius: 4 }}>
          {log.length === 0 ? <span style={{ color: "#64748b" }}>음성 인식을 시작하면 로그가 표시됩니다…</span> :
            log.map((m, i) => <div key={i} style={{ marginBottom: 2 }}>{m}</div>)}
        </div>
      </div>
    </div>
  );
}
