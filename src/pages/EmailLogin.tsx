import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

// 사람친화적인 인증 오류 메시지 매핑
const AUTH_MSG: Record<string, string> = {
  'auth/user-not-found': '가입되지 않은 이메일입니다.',
  'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/too-many-requests': '요청이 많습니다. 잠시 후 다시 시도하세요.',
  'auth/network-request-failed': '네트워크 오류입니다. 인터넷 연결을 확인해주세요.',
  'auth/invalid-email': '올바른 이메일 형식이 아닙니다.',
  default: '로그인에 실패했습니다. 잠시 후 다시 시도하세요.',
};

function humanize(code?: string) {
  return (code && AUTH_MSG[code]) || `${AUTH_MSG.default}${code ? ` (${code})` : ''}`;
}

export default function EmailLogin() {
  const auth = getAuth();
  const params = new URLSearchParams(window.location.search);
  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setMsg("로그인 성공! 잠시 후 이동합니다.");
      // 필요 시: window.location.href = "/";
    } catch (err: any) {
      // Firebase 오류 코드/메시지만 로깅 (민감 정보 제외)
      console.error('[AUTH] EmailLogin error:', err?.code, err?.message);
      setMsg(humanize(err?.message)); // err.message에 'auth/...' 코드가 담겨옴
    } finally {
      setLoading(false);
    }
  };

  const onReset = async () => {
    if (!email) return setMsg("비밀번호 재설정 메일을 보낼 이메일을 입력해 주세요.");
    setLoading(true);
    setMsg(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMsg("비밀번호 재설정 메일을 보냈습니다. 메일함을 확인해 주세요.");
    } catch (err: any) {
      setMsg(err?.message ?? "재설정 메일 전송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "48px auto", padding: 24, border: "1px solid #333", borderRadius: 12 }}>
      <h2 style={{ marginTop: 0 }}>이메일 로그인</h2>

      <form onSubmit={onLogin}>
        <div style={{ marginBottom: 8 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            required
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="비밀번호"
            required
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <button disabled={loading} style={{ width: "100%", padding: 12 }}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <button onClick={onReset} disabled={loading} style={{ width: "100%", padding: 12, marginTop: 8 }}>
        비밀번호 재설정 메일 보내기
      </button>

      {msg && (
        <div style={{ marginTop: 12, padding: 10, background: "#111", border: "1px solid #444" }}>
          {msg}
        </div>
      )}
    </div>
  );
}
