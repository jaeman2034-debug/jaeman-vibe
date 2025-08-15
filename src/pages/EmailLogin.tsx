import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

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
      setMsg(err?.message ?? "로그인에 실패했습니다.");
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
