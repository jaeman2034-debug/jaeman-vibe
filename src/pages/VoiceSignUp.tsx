import { useEffect, useRef, useState } from "react";
import { useSettings } from "../settings/SettingsContext";
import { ensureMicPermission, listenOnceP, startMicLevelMeter, forceKillMic } from "../utils/mic";
import {
  cleanName,
  normalizeEmail,
  isValidEmail,
  isStrongPassword,
} from "../utils/normalize";

type Step = 0 | 1 | 2 | 3; // 0:이름, 1:이메일, 2:비번, 3:검토/제출

export default function VoiceSignUp() {
  const { locale } = useSettings();
  const safeLocale = locale || "ko-KR"; // ✅ 보강

  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  
  // 👇 추가: 화면에 SR 로그를 띄워서 콘솔 안 봐도 원인 보이게
  const [srLog, setSrLog] = useState<string[]>([]);
  const log = (m: string) => setSrLog((xs) => [...xs.slice(-50), m]);
  
  // 마이크 레벨 미터 관련 상태
  const [micLevel, setMicLevel] = useState(0);   // 0~1
  const meterStopRef = useRef<null | (() => void)>(null);
  const [meterOn, setMeterOn] = useState(false);

  useEffect(() => {
    return () => {
      mounted.current = false;
      try { meterStopRef.current?.(); } catch {}
      forceKillMic(); // 페이지 떠날 때 완전 종료
    };
  }, []);

  // 미터 시작/종료 헬퍼
  async function startMeter() {
    try {
      // 권한 없으면 요청
      await navigator.mediaDevices.getUserMedia({ audio: true });
      meterStopRef.current = await startMicLevelMeter((v) => setMicLevel(v));
      setMeterOn(true);
    } catch {
      setError("마이크 권한이 필요합니다. 주소창 왼쪽 🔒에서 허용으로 변경하세요.");
    }
  }
  
  function stopMeter() {
    try { meterStopRef.current?.(); } catch {}
    meterStopRef.current = null;
    setMeterOn(false);
    setMicLevel(0);
  }

  /** 공용: STT 결과를 필드별로 반영 */
  const applyResult = (field: "name" | "email" | "pw", rawText: string) => {
    console.log("🎯 applyResult 호출:", field, rawText);
    
    const text = (rawText || "").trim();
    console.log("📝 정리된 텍스트:", text);

    if (field === "name") {
      const v = cleanName(text);
      console.log("👤 이름 설정:", v);
      setName(v);
      if (v.length < 2) setError("이름이 너무 짧습니다. 또렷이 말씀해 주세요.");
    } else if (field === "email") {
      const fixed = normalizeEmail(text);
      console.log("📧 이메일 설정:", fixed);
      setEmail(fixed);
      if (!isValidEmail(fixed)) {
        setError("이메일 형식이 올바르지 않습니다. \"골뱅이/점/닷컴\"처럼 말씀해 보세요.");
      }
    } else {
      const v = text.replace(/\s+/g, "");
      console.log("🔒 비밀번호 설정:", v);
      setPw(v);
      if (!isStrongPassword(v)) {
        setError("비밀번호는 8자 이상이어야 합니다.");
      }
    }
    
    console.log("✅ applyResult 완료");
  };

  // >>> @VOICE_SIGNUP_DO_LISTEN_DIRECT
  // 🔥 헬퍼/미터 다 빼고, 브라우저 SR만 직접 구동
  const doListen = (field: "name" | "email" | "pw") => {
    if (listening) return;
    setError(null);
    setListening(true);

    try {
      const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SR) {
        setListening(false);
        setError("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome/Edge 사용해 주세요.");
        return;
      }

      // 👉 중요: 버튼 클릭 컨텍스트에서 즉시 생성/시작 (await 절대 금지)
      const r: any = new SR();
      r.lang = (locale || "ko-KR");
      r.interimResults = true;       // 중간 결과도 받기
      r.maxAlternatives = 2;
      r.continuous = false;

      let finalText = "";
      let interimText = "";

      r.onstart = () => log("▶ onstart");
      r.onaudiostart = () => log("▶ onaudiostart");
      r.onsoundstart = () => log("▶ onsoundstart");
      r.onspeechstart = () => log("▶ onspeechstart");

      r.onresult = (e: any) => {
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
        const code = e?.error;
        log(`❌ onerror: ${code || "unknown"}`);
        setError(
          code === "not-allowed" ? "마이크 권한이 거부되었습니다. 주소창 왼쪽 🔒에서 허용으로 변경하세요."
          : code === "audio-capture" ? "마이크 장치를 찾을 수 없습니다. OS의 입력 장치를 확인하세요."
          : code === "no-speech" ? "말소리가 감지되지 않았습니다. 조금 더 크게 또렷하게 말씀해 주세요."
          : "음성 인식 오류가 발생했습니다. 다시 시도해 주세요."
        );
      };

      r.onend = () => {
        log("■ onend");
        setListening(false);

        // 최종 없으면 중간이라도 사용
        const text = finalText || interimText || "";
        if (!text) return; // 아무것도 못 들은 경우

        if (field === "name") {
          setName(cleanName(text));
        } else if (field === "email") {
          const fixed = normalizeEmail(text);
          setEmail(fixed);
          if (!isValidEmail(fixed)) setError("이메일 형식이 올바르지 않습니다. 다시 말씀해 주세요.");
        } else {
          const val = text.replace(/\s+/g, "");
          setPw(val);
          if (!isStrongPassword(val)) setError("비밀번호는 8자 이상이어야 합니다.");
        }
      };

      // ⚠️ 절대 기다리지 말고 즉시 시작
      r.start();
      log(`🎙 start(lang=${r.lang})`);
    } catch (err: any) {
      setListening(false);
      setError(err?.message || "음성 인식 초기화 실패");
    }
  };
  // <<< @VOICE_SIGNUP_DO_LISTEN_DIRECT

  // 단계 검증 (트림 반영)
  const stepValid =
    (step === 0 && cleanName(name.trim()).length >= 2) ||
    (step === 1 && isValidEmail(email.trim())) ||
    (step === 2 && isStrongPassword(pw)) ||
    step === 3;

  const next = () => setStep((s) => (Math.min(3, s + 1) as Step));
  const prev = () => setStep((s) => (Math.max(0, s - 1) as Step));

  // 가입 제출 (데모)
  async function submitSignUp() {
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 400));
      alert(`가입 완료!\n이름: ${name}\n이메일: ${email}`);
      // TODO: navigate("/welcome")
    } catch (e: any) {
      setError(e?.message || "가입 중 오류가 발생했습니다.");
    }
  }

  // 인라인 스타일 (기존 유지)
  const wrap: React.CSSProperties = {
    maxWidth: 560,
    margin: "32px auto",
    padding: "0 16px",
    fontFamily:
      "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  };
  const barBox: React.CSSProperties = {
    height: 8,
    background: "#e2e8f0",
    borderRadius: 6,
    overflow: "hidden",
    margin: "12px 0 24px",
  };
  const title: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 800,
    margin: "12px 0 4px",
  };
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
    outline: "none" as const,
  };

  return (
    <div style={wrap}>
      <h2 style={title}>음성 회원가입</h2>
      <div style={sub}>언어: {safeLocale}</div>
      
      {/* 마이크 입력 레벨 표시 */}
      <div style={{margin: "8px 0 16px"}}>
        <div style={{fontSize: 12, color: "#64748b", marginBottom: 4}}>
          마이크 입력 레벨 {listening ? "🎤 음성 인식 중" : meterOn ? (micLevel > 0.1 ? "🎤 입력 감지" : "…대기중") : "(꺼짐)"}
        </div>
        <div style={{height: 8, background:"#e2e8f0", borderRadius: 6, overflow:"hidden"}}>
          <div style={{height:"100%", width: `${listening ? 100 : Math.round(micLevel*100)}%`, background: listening ? "#2563eb" : "#10b981", transition:"width .08s"}}/>
        </div>
      </div>

      {/* 진행 바 */}
      <div style={barBox}>
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
          <p style={sub}>예) “이메일은 jaeman 골뱅이 지메일 점 컴”</p>
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
            <div style={{ color: "#dc2626", marginTop: 8 }}>
              올바른 이메일 형식이 아닙니다.
            </div>
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
            <div style={{ color: "#dc2626", marginTop: 8 }}>
              비밀번호는 8자 이상이어야 합니다.
            </div>
          )}
        </section>
      )}

      {step === 3 && (
        <section>
          <h3 style={title}>4/4 확인 후 가입</h3>
          <ul style={{ lineHeight: 1.8, color: "#334155" }}>
            <li>
              <b>이름</b>: {name || "-"}
            </li>
            <li>
              <b>이메일</b>: {email || "-"}
            </li>
          </ul>
          <p style={{ color: "#64748b" }}>
            ※ 비밀번호는 보안상 표시하지 않습니다.
          </p>
        </section>
      )}

             {/* 하단 내비게이션 */}
       {error && <div style={{ color: "#dc2626", marginTop: 8 }}>{error}</div>}

       {/* STT 로그 영역 */}
       <div style={{ marginTop: 16, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
         <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>🎤 STT 로그:</div>
         <div style={{ 
           height: 120, 
           overflow: "auto", 
           fontSize: 11, 
           fontFamily: "monospace",
           background: "#0f172a",
           color: "#e2e8f0",
           padding: 8,
           borderRadius: 4
         }}>
           {srLog.length === 0 ? (
             <span style={{ color: "#64748b" }}>음성 인식을 시작하면 로그가 표시됩니다...</span>
           ) : (
             srLog.map((msg, i) => (
               <div key={i} style={{ marginBottom: 2 }}>{msg}</div>
             ))
           )}
         </div>
       </div>

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
            onClick={submitSignUp}
            disabled={!stepValid}
          >
            가입하기
          </button>
        )}
      </div>
    </div>
  );
}
