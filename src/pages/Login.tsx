import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmail, loginWithGoogle } from '../features/auth/authService';

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

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await signInWithEmail(email, pw);
      nav('/home');
    } catch (e: any) {
      setErr(humanize(e?.message)); // e.message에 'auth/...' 코드가 담겨옴
    } finally { setBusy(false); }
  };

  const onGoogle = async () => {
    setErr(''); setBusy(true);
    try {
      await loginWithGoogle();
      nav('/home');
    } catch (e: any) {
      setErr(e?.message || 'Google 로그인에 실패했습니다.');
    } finally { setBusy(false); }
  };

  return (
    <div style={{maxWidth:420, margin:'40px auto', padding:16}}>
      <h2 style={{marginBottom:12}}>🔐 로그인</h2>
      <form onSubmit={onSubmit} style={{display:'grid', gap:10}}>
        <input
          placeholder="이메일"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          autoComplete="email"
          style={{padding:'10px 12px', border:'1px solid #ddd', borderRadius:8}}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={e=>setPw(e.target.value)}
          autoComplete="current-password"
          style={{padding:'10px 12px', border:'1px solid #ddd', borderRadius:8}}
        />
        {err && <div style={{color:'crimson', fontSize:14}}>{err}</div>}
        <button disabled={busy} type="submit" style={{padding:'10px 12px', borderRadius:8}}>
          {busy ? '로그인 중…' : '이메일로 로그인'}
        </button>
      </form>

      <button onClick={onGoogle} disabled={busy}
              style={{marginTop:8, padding:'10px 12px', borderRadius:8, width:'100%'}}>
        Google로 로그인
      </button>

      <div style={{marginTop:12, fontSize:14}}>
        <Link to="/reset">비밀번호 재설정</Link> · <Link to="/signup">회원가입</Link>
      </div>
      
      <div style={{marginTop:16, padding:16, background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:8}}>
        <h4 style={{margin:'0 0 8px 0', color:'#0369a1'}}>🎙️ 음성으로 빠르게 가입하기</h4>
        <Link to="/one-shot-signup" style={{
          display:'inline-block',
          padding:'8px 16px',
          background:'#2563eb',
          color:'white',
          textDecoration:'none',
          borderRadius:6,
          fontSize:14
        }}>
          📱 원샷 음성 가입
        </Link>
        <div style={{marginTop:8, fontSize:12, color:'#0369a1'}}>
          마이크 버튼을 누르고 한 번에 말하면 자동으로 가입됩니다
        </div>
      </div>
    </div>
  );
} 