import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, getAdditionalUserInfo } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { getAuthPageVoiceRoute } from "@/voice/intentLogin";

// 마이크 아이콘(SVG)
const MicIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sp] = useSearchParams();
  const next = sp.get("next") || "/market";
  const nav = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pw !== confirm) return setErr("비밀번호가 일치하지 않습니다.");
    if (pw.length < 8) return setErr("비밀번호는 8자 이상이어야 합니다.");
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw);
      // (선택) 이메일 검증 메일
      try { await sendEmailVerification(cred.user); } catch {}
      const info = getAdditionalUserInfo(cred);
      // 프로필 설정은 나중에
      nav(next, { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "가입에 실패했습니다.");
    } finally { setLoading(false); }
  };

  // 음성 명령 처리 (민감 정보 입력 방지)
  useEffect(() => {
    const handleVoiceCommand = (e: CustomEvent) => {
      const transcript = e.detail?.transcript;
      if (!transcript) return;
      
      const route = getAuthPageVoiceRoute(transcript);
      if (route) {
        console.log('[VOICE] Auth page command:', transcript, '->', route);
        nav(route);
      }
    };

    window.addEventListener('voice:command', handleVoiceCommand as EventListener);
    return () => window.removeEventListener('voice:command', handleVoiceCommand as EventListener);
  }, [nav]);

  // 음성 페이지로 이동
  const openVoice = () => {
    // 음성 페이지로 이동. 어디서 왔는지(from=signup)와 next를 같이 넘겨줌
    nav(`/voice?from=signup&next=${encodeURIComponent(next)}`);
  };

  return (
    <div className="mx-auto max-w-sm p-6">
      <div className="flex items-center justify-center gap-3 mb-2">
        <h1 className="text-2xl font-bold">이메일로 가입</h1>
        <button
          type="button"
          onClick={openVoice}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          aria-label="음성으로 로그인하기"
          title="음성으로 로그인하기"
        >
          <MicIcon />
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">이미 계정이 있나요? <Link to={`/login?next=${encodeURIComponent(next)}`} className="text-blue-600">로그인</Link></p>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" type="email" placeholder="이메일" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="비밀번호(8자 이상)" value={pw} onChange={e=>setPw(e.target.value)} required />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="비밀번호 확인" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-60" disabled={loading}>
          {loading ? "가입 중..." : "가입하기"}
        </button>
      </form>
    </div>
  );
}