// src/utils/speechEmail.tsx
import React from 'react';

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
  onTryNext
}) => {
  return (
    <div style={{ marginTop: 16 }}>
      <label>이메일 (음성 입력)</label>

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