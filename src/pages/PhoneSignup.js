import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp } from '../lib/sms';
import { toE164KR } from '../lib/sms';
export default function PhoneSignup() { const nav = useNavigate(); const [step, setStep] = useState('phone'); const [phone, setPhone] = useState(''); const [e164, setE164] = useState(''); const [code, setCode] = useState(''); const [name, setName] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const confirmRef = useRef(null); useEffect(() => { setErr(''); }, [step]); async function onRequestCode(e) { e.preventDefault(); setErr(''); const p = toE164KR(phone); if (!/^\+\d{8,15}$/.test(p))
    return setErr('?�화번호 ?�식???�인??주세??'); try {
    setBusy(true);
    const confirmation = await sendOtp(p);
    confirmRef.current = confirmation;
    setE164(p);
    setStep('code');
}
catch (e) {
    setErr('?�증 문자 ?�송 ?�패: ' + (e?.message || ''));
}
finally {
    setBusy(false);
} } async function onVerify(e) { e.preventDefault(); setErr(''); try {
    setBusy(true);
    const result = await confirmRef.current.confirm(code);
    const user = result.user;
}
finally { } } } // ?�름 받도�??�음 ?�계�?      setStep('name');    } catch (e: any) {      setErr('?�증번호가 ?�바르�? ?�습?�다.');    } finally { setBusy(false); }  }  async function onFinish(e: React.FormEvent) {    e.preventDefault(); setErr('');    try {      setBusy(true);      const uid = getUid();      if (!uid) {        setErr('?�용???�보�?찾을 ???�습?�다.');        return;      }      await finishSignup({ uid } as any, name.trim());      alert('가???�료!');      nav('/home');    } catch (e: any) {      setErr('?�로???�데?�트 ?�패');    } finally { setBusy(false); }  }  return (    <div style={{maxWidth:420, margin:'40px auto', padding:16}}>      <h2>?�� ?�화번호�??�작</h2>      {step === 'phone' && (        <form onSubmit={onRequestCode} style={{display:'grid', gap:10}}>          <input            placeholder="?�화번호 (?? 010-1234-5678)"            value={phone}            onChange={e=>setPhone(e.target.value)}            style={{padding:'10px 12px', border:'1px solid #ddd', borderRadius:8}}          />          {e164 && <div style={{fontSize:12, color:'#777'}}>?�송 ?�?? {e164}</div>}          {err && <div style={{color:'crimson'}}>{err}</div>}          <button disabled={busy} type="submit" style={{padding:'10px 12px', borderRadius:8}}>            {busy ? '?�송 중�? : '?�증 문자 받기'}          </button>        </form>      )}      {step === 'code' && (        <form onSubmit={onVerify} style={{display:'grid', gap:10}}>          <div style={{color:'#555'}}>?�송??코드 6?�리�??�력?�세??</div>          <input            placeholder="?�증번호 6?�리"            inputMode="numeric"            maxLength={6}            value={code}            onChange={e=>setCode(e.target.value.replace(/[^\d]/g,''))}            style={{letterSpacing:4, textAlign:'center', padding:'10px 12px', border:'1px solid #ddd', borderRadius:8}}          />          {err && <div style={{color:'crimson'}}>{err}</div>}          <button disabled={busy || code.length!==6} type="submit" style={{padding:'10px 12px', borderRadius:8}}>            {busy ? '?�인 중�? : '?�인'}          </button>          <button type="button" onClick={()=>setStep('phone')} style={{opacity:.7}}>번호 ?�시 ?�력</button>        </form>      )}      {step === 'name' && (        <form onSubmit={onFinish} style={{display:'grid', gap:10}}>          <div style={{color:'#555'}}>?�시???�름???�어 주세??</div>          <input            placeholder="?�름(?�네??"            value={name}            onChange={e=>setName(e.target.value)}            style={{padding:'10px 12px', border:'1px solid #ddd', borderRadius:8}}          />          {err && <div style={{color:'crimson'}}>{err}</div>}          <button disabled={busy || !name.trim()} type="submit" style={{padding:'10px 12px', borderRadius:8}}>            {busy ? '?�??중�? : '?�료'}          </button>        </form>      )}      {/* reCAPTCHA 컨테?�너(보이지 ?�음) */}      <div id="recaptcha-container"></div>    </div>  );} 
