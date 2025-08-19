import { useEffect, useRef, useState } from "react";
import { usePttStt } from "@/hooks/usePttStt";
import { extractName, extractPhone } from "@/lib/parse";
import { auth, db } from "@/firebase";
import { sendSms, verifySmsCode } from "@/lib/sms";
import { updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export default function OneShotVoiceSignup() {
  const { ok, listening, partial, finalText, setFinalText, handlers } = usePttStt("ko-KR");
  const [name, setName] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [digits, setDigits] = useState("");
  const prevListening = useRef(false);                // ← 딱 한 번만
  const textSnapRef = useRef({ final: "", partial: "" });

  // 최근 인식 문장(고정 표시) + 히스토리
  const [lastUtterance, setLastUtterance] = useState("");
  const [history, setHistory] = useState<Array<{ t: number; text: string }>>([]);
  const [showDebug, setShowDebug] = useState(false); // 디버그 토글(선택)

  const onDown = (e:any) => { setFinalText(""); handlers.onPointerDown?.(e); };

  // 인증 버튼 활성화 조건
  const canSubmit = !!name && digits.length >= 10;

  // STT 결과가 바뀔 때마다 스냅샷을 갱신
  useEffect(() => {
    textSnapRef.current = { final: finalText || "", partial: partial || "" };
  }, [finalText, partial]);

  // 원샷 타이밍: 손을 떼는 순간 한 번만 처리 (deps는 listening만)
  useEffect(() => {
    if (prevListening.current && !listening) {
      setTimeout(() => {
        const { final, partial } = textSnapRef.current;
        const text = (final.trim() || partial.trim());
        if (!text) {
          alert("음성이 인식되지 않았어요. 다시 한 번에 말씀해 주세요.");
          return;
        }

        // ✅ 최근 인식 고정 + 히스토리 누적
        setLastUtterance(text);
        setHistory(h => [{ t: Date.now(), text }, ...h].slice(0, 10));

        handleOneShot(text);
      }, 150);
    }
    prevListening.current = listening;
  }, [listening]);

  function handleOneShot(text: string) {
    const n = extractName(text);
    const p = extractPhone(text);

    if (n) setName(n);
    if (p) { setPhoneDisplay(p.display); setDigits(p.digits); }

    if (!p) {
      // 번호만 다시 말하게 안내(선택)
      console.log("[원샷] 전화번호 미검출. '010부터 번호만' 다시 말씀해 주세요.");
    }

    // 선택: 자동 삭제 타이머 (원하면 주석 해제)
    // setTimeout(() => setLastUtterance(""), 8000); // 8초 후 최근 인식 자동 삭제
  }

  async function onSendSms() {
    if (!canSubmit) return;
    try {
      const confirmation = await sendSms(auth, digits);
      const code = window.prompt("문자 인증번호 6자리를 입력하세요");
      if (!code) return;
      const cred = await verifySmsCode(confirmation, code.trim());
      if (cred.user && name) await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid, name, phone: phoneDisplay, createdAt: serverTimestamp(),
      }, { merge: true });
      alert("✅ 가입 완료!");
    } catch (e: any) {
      console.error(e);
      alert("인증 실패: " + (e?.message || e));
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "24px auto", fontFamily: "system-ui" }}>
      <h2>📱 음성 원샷 가입</h2>

      <label>이름</label>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="홍길동" />

      <label>전화번호</label>
      <input
        value={phoneDisplay}
        onChange={(e) => {
          const d = e.target.value.replace(/\D/g, "");
          const disp = d.length >= 10
            ? `${d.slice(0,3)}-${d.slice(3, d.length===10?6:7)}-${d.slice(-4)}`
            : e.target.value;
          setPhoneDisplay(disp);
          setDigits(d);
        }}
        placeholder="010-1234-5678"
        inputMode="numeric"
      />

      <button
        type="button"
        disabled={!ok}
        {...handlers}                  // usePttStt가 주는 onPointerDown만 사용
        onContextMenu={(e)=>e.preventDefault()}   // 길게누르기 메뉴 차단
        onDragStart={(e)=>e.preventDefault()}     // 이미지 드래그 차단
        style={{
          width:"100%", 
          padding:14, 
          borderRadius:12,
          background: ok ? (listening ? "#1db954" : "#1e5af9") : "#ccc",
          color:"#fff", 
          border:"none", 
          touchAction: "none",         // 제스처로 pointercancel 방지
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",  // iOS 길게누르기 callout 차단
          WebkitTapHighlightColor: "transparent",
          position: "relative",
          zIndex: 1,
        }}
        aria-pressed={listening}
      >
        {ok ? (listening ? "🎙️ 듣는 중… (떼면 처리)" : "🎤 길게 누르고 한 번에 말하기")
            : "🎤 음성 인식 미지원"}
      </button>

      <div style={{ marginTop:8, fontSize:13, color:"#666" }}>
        {listening ? (partial || "…") : (finalText || "예) 제 이름은 홍길동, 010-1234-5678")}
      </div>

      {/* 최근 인식(항상 남김) */}
      <div style={{ marginTop: 8, fontSize: 14, color: "#333" }}>
        <div style={{ opacity: 0.7, marginBottom: 4 }}>최근 인식</div>
        <div style={{
          padding: "10px 12px",
          borderRadius: 8,
          background: "#f4f6fa",
          border: "1px solid #e3e8f0",
          minHeight: 20,
          whiteSpace: "pre-wrap"
        }}>
          {listening ? (partial || lastUtterance || "…") : (lastUtterance || "—")}
        </div>

        {/* 디버그 토글 + 히스토리 지우기 */}
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button type="button"
            onClick={()=>setShowDebug(v=>!v)}
            style={{ fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "1px solid #ccd5e3", background:"#fff" }}>
            {showDebug ? "디버그 숨기기" : "디버그 보기"}
          </button>
          
          {showDebug && (
            <button type="button"
              onClick={()=>setHistory([])}
              style={{ fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "1px solid #fecaca", background:"#fef2f2", color:"#dc2626" }}>
              지우기
            </button>
          )}
          
          <button type="button" 
            onClick={()=>{ setLastUtterance(""); setHistory([]); }}
            style={{ marginLeft: 8, fontSize: 12, padding:"6px 10px", borderRadius: 6, border:"1px solid #f0b7b7", background:"#fff0f0" }}>
            로그 지우기
          </button>
        </div>

        {/* 히스토리 로그(최근 10건) */}
        {showDebug && (
          <div style={{ marginTop: 6, maxHeight: 160, overflow: "auto", fontSize: 12, border: "1px dashed #d1d9e6", borderRadius: 8, padding: 8, background:"#fafbfd" }}>
            {history.length === 0 ? <div style={{opacity:.6}}>로그 없음</div> : (
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {history.map((h, i) => (
                  <li key={h.t} style={{ margin: "6px 0" }}>
                    <span style={{ opacity:.6, marginRight: 8 }}>
                      {new Date(h.t).toLocaleTimeString()}
                    </span>
                    {h.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <button 
        onClick={onSendSms} 
        disabled={!canSubmit}
        style={{ 
          width:"100%", 
          padding:14, 
          marginTop:12, 
          borderRadius:12,
          background: canSubmit ? "#0070f3" : "#b6c7e1",
          color:"#fff", 
          border:"none" 
        }}
      >
        인증 문자 받기
      </button>

      <div id="recaptcha-container" style={{ display:"none" }} />
    </div>
  );
} 