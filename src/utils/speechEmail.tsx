// src/utils/speechEmail.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';

// === 이메일 STT 핫픽스 유틸 ===
const AT_WORDS = /(골뱅이|앳|\bat\b)/g;         // '@' 트리거
const DOT_WORDS = /(닷|점|쩜)/g;                // '.' 치환 전용
const EMAIL_ID_ALLOWED = /[a-z0-9._-]/;         // 허용 문자

const sanitizeId = (s: string) =>
  (s || "")
    .toLowerCase()
    // '@' 나오기 전까지는 점을 모두 제거 (전환 방지)
    .replace(/\./g, "")
    .split("")
    .filter(ch => EMAIL_ID_ALLOWED.test(ch))
    .join("");

const sanitizeDomain = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(DOT_WORDS, ".")
    .replace(/\s+/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^\./, "")
    .replace(/\.$/, "");

// 도메인 한국어/축약 보정
const fixDomainCommon = (dom: string) => {
  if (!dom) return dom;
  if (dom === "gmail") return "gmail.com";
  if (dom === "naver") return "naver.com";
  if (dom === "daum") return "daum.net";
  if (dom === "hanmail") return "hanmail.net";
  if (dom === "kakao") return "kakao.com";
  return dom;
};

// === 이메일 STT 핵심 로직 ===
export const onEmailSpeechFinal = (
  raw: string,
  mode: "id" | "domain",
  emailId: string,
  emailDomain: string,
  setEmailId: (id: string) => void,
  setEmailDomain: (id: string | ((prev: string) => string)) => void,
  setMode: (mode: "id" | "domain") => void,
  domainSwitchedRef: React.MutableRefObject<boolean>,
  pushLog: (msg: string) => void
) => {
  let t = (raw || "").toLowerCase().trim();

  // 공통 치환
  t = t.replace(DOT_WORDS, ".");     // '점/닷/쩜' -> '.'
  t = t.replace(AT_WORDS, "@");      // '골뱅이/앳/at' -> '@'

  if (mode === "id") {
    // '@'가 들어오면 한 번만 도메인 모드로 전환
    if (t.includes("@")) {
      const [left, right = ""] = t.split("@");

      // 1) 남은 ID 정리 ('.' 전부 무시)
      const idNew = sanitizeId(emailId + left);
      setEmailId(idNew);

      // 2) 도메인 모드로 '한 번만' 전환
      if (!domainSwitchedRef.current) {
        domainSwitchedRef.current = true;
        setMode("domain");
        pushLog("🌐 도메인 입력 모드로 전환");
      }

      // 3) 첫 도메인 시드 반영
      const domSeed = fixDomainCommon(sanitizeDomain(right));
      setEmailDomain(prev => (prev ? prev : domSeed));
      return;
    }

    // '@' 전에는 절대 전환/누적에 '.'을 쓰지 않음
    const idAcc = sanitizeId(emailId + t);
    setEmailId(idAcc);
    pushLog(`👤 ID 조각 추가: ${t} → 누적: ${idAcc}`);
    return;
  }

  // mode === 'domain'
  const domAcc = fixDomainCommon(sanitizeDomain(emailDomain + t));
  setEmailDomain(domAcc);
  pushLog(`🌐 도메인 조각 추가: ${t} → 누적: ${domAcc}`);
};

// === 완료 후보 검사 ===
export const isLikelyEmail = (id: string, dom: string) =>
  !!id && !!dom && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(`${id}@${dom}`);

// === EmailVoiceField 컴포넌트 ===
interface EmailVoiceFieldProps {
  emailId: string;
  emailDomain: string;
  mode: "id" | "domain";
  setEmailId: (id: string) => void;
  setEmailDomain: (domain: string) => void;
  setMode: (mode: "id" | "domain") => void;
  domainSwitchedRef: React.MutableRefObject<boolean>;
  pushLog: (msg: string) => void;
  onTryNext: () => void;
  onFinal?: (text: string) => void;   // ✅ 추가: 최종 결과 전달
}

export const EmailVoiceField: React.FC<EmailVoiceFieldProps> = ({
  emailId,
  emailDomain,
  mode,
  setEmailId,
  setEmailDomain,
  setMode,
  domainSwitchedRef,
  pushLog,
  onTryNext,
  onFinal
}) => {
  // 음성 인식기 관련 상태 및 ref
  const [listening, setListening] = useState(false);
  const userStopRef = useRef(false);   // 사용자가 직접 멈췄는지 여부
  const recRef = useRef<any>(null);

  // 음성 인식기 생성 및 설정
  const ensureRecognizer = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;
    if (!recRef.current) {
      const rec = new SR();
      rec.lang = "ko-KR";
      rec.interimResults = true;   // ✅ 중간 결과 ON
      rec.continuous = true;       // ✅ 연속 인식 ON
      rec.maxAlternatives = 3;
      
      // 최종 문장만 모아서 부모에 전달
      rec.onresult = (e: any) => {
        const finals: string[] = [];
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const alt = e.results[i];
          if (alt.isFinal) {
            for (let k = 0; k < alt.length; k++) finals.push(alt[k].transcript);
          }
        }
        if (finals.length > 0) {
          const txt = finals.join(" ");
          // 부모로 최종 결과 전달
          onFinal?.(txt);
          // 이메일 누적 함수 호출 (기존 로직 유지)
          onEmailSpeechFinal(
            txt,
            mode,
            emailId,
            emailDomain,
            setEmailId,
            setEmailDomain,
            setMode,
            domainSwitchedRef,
            pushLog
          );
        }
      };

      rec.onerror = (ev: any) => {
        setListening(false);
        // 사용자가 멈춘 게 아니고, aborted 외 에러면 재시작
        if (!userStopRef.current && ev?.error !== "aborted") {
          setTimeout(() => { try { rec.start(); setListening(true); } catch {} }, 600);
        }
      };

      rec.onend = () => {
        setListening(false);
        // 사용자가 멈춘 게 아니면 바로 재시작
        if (!userStopRef.current) {
          setTimeout(() => { try { rec.start(); setListening(true); } catch {} }, 600);
        }
      };
      
      recRef.current = rec;
    }
    return recRef.current;
  }, [mode, emailId, emailDomain, setEmailId, setEmailDomain, setMode, domainSwitchedRef, pushLog, onFinal]);

  // 음성 인식 시작
  const start = useCallback(() => {
    const rec = ensureRecognizer();
    if (!rec) return alert("이 브라우저는 음성 인식을 지원하지 않아요.");

    userStopRef.current = false;
    try { rec.start(); setListening(true); } catch {}
  }, [ensureRecognizer]);

  // 음성 인식 중지
  const stop = useCallback(() => {
    userStopRef.current = true;
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      userStopRef.current = true;
      try { recRef.current?.stop(); recRef.current?.abort(); } catch {}
    };
  }, []);

  return (
    <div style={{ marginTop: 16 }}>
      <label>이메일 (음성 입력)</label>

      {/* 음성 인식 버튼 추가 */}
      <div style={{ margin: "8px 0", display: "flex", gap: 8 }}>
        <button 
          type="button" 
          onClick={() => (listening ? stop() : start())}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid rgba(34,197,94,0.5)",
            background: listening ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
            color: listening ? "#f87171" : "#22c55e",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          {listening ? "듣기 종료" : "말하기"}
        </button>
        {listening && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            padding: "8px 12px", 
            background: "rgba(34,197,94,0.1)", 
            borderRadius: 6,
            fontSize: 12,
            color: "#22c55e"
          }}>
            🎤 음성 인식 중... (자동 재시작)
          </div>
        )}
      </div>

      <div style={{ margin: "8px 0", padding: 12, background: "#1f2330", borderRadius: 8 }}>
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>
          음성 입력 중: {mode === "id" ? "아이디 모드" : "도메인 모드"}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <code style={{ padding: "4px 8px", borderRadius: 6, background: "#0e111a" }}>
            {emailId || "ID 입력 중..."}
          </code>
          <code style={{ padding: "4px 8px", borderRadius: 6, background: "#0e111a" }}>@</code>
          <code style={{ padding: "4px 8px", borderRadius: 6, background: "#0e111a" }}>
            {emailDomain || "도메인 입력 중..."}
          </code>
        </div>
        {emailId && emailDomain && (
          <div style={{ marginTop: 8, padding: 8, background: "rgba(34,197,94,0.1)", borderRadius: 6, fontSize: 12 }}>
            완성된 이메일: <strong>{emailId}@{emailDomain}</strong>
          </div>
        )}
      </div>

      {/* 자주 쓰는 도메인 단축 버튼 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        {["gmail.com","naver.com","daum.net","outlook.com"].map(d => (
          <button 
            key={d} 
            type="button" 
            onClick={()=>{ 
              setMode("domain"); 
              domainSwitchedRef.current=true; 
              setEmailDomain(d); 
            }}
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: 12,
              cursor: "pointer"
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* ID가 비어있을 때 도메인 모드에서 ID 입력 유도 */}
      {mode === "domain" && !emailId && (
        <div style={{ marginTop: 8, padding: 8, background: "rgba(239,68,68,0.1)", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)" }}>
          <div style={{ fontSize: 12, color: "#f87171", marginBottom: 6 }}>
            ⚠️ 아이디가 비어있습니다. 먼저 아이디를 입력해 주세요.
          </div>
          <button
            type="button"
            onClick={() => { 
              setMode("id"); 
              domainSwitchedRef.current = false; 
              pushLog("🔄 ID 입력 모드로 돌아가기");
            }}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid rgba(239,68,68,0.5)",
              background: "rgba(239,68,68,0.2)",
              color: "#f87171",
              fontSize: 12,
              cursor: "pointer"
            }}
          >
            ID 먼저 입력하기
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button 
          type="button" 
          onClick={onTryNext} 
          disabled={!isLikelyEmail(emailId, fixDomainCommon(emailDomain))}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid rgba(139,92,246,0.5)",
            background: "linear-gradient(135deg,#8b5cf6,#22d3ee)",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          다음
        </button>
        <button
          type="button"
          onClick={() => {
            setEmailId("");
            setEmailDomain("");
            setMode("id");
            domainSwitchedRef.current = false;
            pushLog("♻️ 이메일 입력 초기화");
          }}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.08)",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          초기화
        </button>
      </div>
    </div>
  );
}; 