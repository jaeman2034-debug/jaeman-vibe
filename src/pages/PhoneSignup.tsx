import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/firebase';
import { getUid } from '@/lib/auth';
import { finishSignup } from '../features/auth/phoneService';
import { sendOtp } from '../lib/sms';
import { toE164KR } from '../lib/sms';

export default function PhoneSignup() {
  const nav = useNavigate();
  const [step, setStep] = useState<'phone'|'code'|'name'>('phone');
  const [phone, setPhone] = useState('');
  const [e164, setE164] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const confirmRef = useRef<any>(null);

  useEffect(() => { setErr(''); }, [step]);

  async function onRequestCode(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    const p = toE164KR(phone);
    if (!/^\+\d{8,15}$/.test(p)) return setErr('전화번호 형식을 확인해 주세요.');
    try {
      setBusy(true);
      const confirmation = await sendOtp(p);
      confirmRef.current = confirmation;
      setE164(p);
      setStep('code');
    } catch (e: any) {
      setErr('인증 문자 전송 실패: ' + (e?.message || ''));
    } finally { setBusy(false); }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    try {
      setBusy(true);
      const result = await confirmRef.current.confirm(code);
      const user = result.user;
      // 이름 받도록 다음 단계로
      setStep('name');
    } catch (e: any) {
      setErr('인증번호가 올바르지 않습니다.');
    } finally { setBusy(false); }
  }

  async function onFinish(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    try {
      setBusy(true);
      const uid = getUid();
      if (!uid) {
        setErr('사용자 정보를 찾을 수 없습니다.');
        return;
      }
      await finishSignup({ uid } as any, name.trim());
      alert('가입 완료!');
      nav('/home');
    } catch (e: any) {
      setErr('프로필 업데이트 실패');
    } finally { setBusy(false); }
  }

  return (
    <div style={{maxWidth:420, margin:'40px auto', padding:16}}>
      <h2>📱 전화번호로 시작</h2>

      {step === 'phone' && (
        <form onSubmit={onRequestCode} style={{display:'grid', gap:10}}>
          <input
            placeholder="전화번호 (예: 010-1234-5678)"
            value={phone}
            onChange={e=>setPhone(e.target.value)}
            style={{padding:'10px 12px', border:'1px solid #ddd', borderRadius:8}}
          />
          {e164 && <div style={{fontSize:12, color:'#777'}}>전송 대상: {e164}</div>}
          {err && <div style={{color:'crimson'}}>{err}</div>}
          <button disabled={busy} type="submit" style={{padding:'10px 12px', borderRadius:8}}>
            {busy ? '전송 중…' : '인증 문자 받기'}
          </button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={onVerify} style={{display:'grid', gap:10}}>
          <div style={{color:'#555'}}>전송된 코드 6자리를 입력하세요.</div>
          <input
            placeholder="인증번호 6자리"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={e=>setCode(e.target.value.replace(/[^\d]/g,''))}
            style={{letterSpacing:4, textAlign:'center', padding:'10px 12px', border:'1px solid #ddd', borderRadius:8}}
          />
          {err && <div style={{color:'crimson'}}>{err}</div>}
          <button disabled={busy || code.length!==6} type="submit" style={{padding:'10px 12px', borderRadius:8}}>
            {busy ? '확인 중…' : '확인'}
          </button>
          <button type="button" onClick={()=>setStep('phone')} style={{opacity:.7}}>번호 다시 입력</button>
        </form>
      )}

      {step === 'name' && (
        <form onSubmit={onFinish} style={{display:'grid', gap:10}}>
          <div style={{color:'#555'}}>표시할 이름을 적어 주세요.</div>
          <input
            placeholder="이름(닉네임)"
            value={name}
            onChange={e=>setName(e.target.value)}
            style={{padding:'10px 12px', border:'1px solid #ddd', borderRadius:8}}
          />
          {err && <div style={{color:'crimson'}}>{err}</div>}
          <button disabled={busy || !name.trim()} type="submit" style={{padding:'10px 12px', borderRadius:8}}>
            {busy ? '저장 중…' : '완료'}
          </button>
        </form>
      )}

      {/* reCAPTCHA 컨테이너(보이지 않음) */}
      <div id="recaptcha-container"></div>
    </div>
  );
} 