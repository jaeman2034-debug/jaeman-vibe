import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { finishSignup } from '../features/auth/phoneService';
import { extractPhoneKO } from '../features/voice/phoneParser';
import { auth, db } from '@/firebase';
import { getUid } from '@/lib/auth';
import { usePttStt } from '@/hooks/usePttStt';
import { sendSms, verifySmsCode, toE164KR } from '../lib/sms';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { RecaptchaVerifier } from 'firebase/auth';


type Step = 'phone' | 'code' | 'name';

// 간단한 전화번호 유효성 검사
function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/[^\d]/g, '');
  return digits.length >= 10 && digits.startsWith('010');
}

const PhoneVoiceSignup = () => {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const confirmRef = React.useRef<any>(null);

  // 음성 인식 결과 처리
  const onPhoneResult = useCallback((txt: string) => {
    // 한글 숫자 → 숫자만 추출 → 010-XXXX-XXXX 포맷
    const { formatted } = extractPhoneKO(txt);
    if (formatted) setPhone(formatted);
  }, []);

  const onCodeResult = useCallback((txt: string) => {
    const digits = txt.replace(/[^\d]/g, '').slice(0, 6);
    if (digits) setCode(digits);
  }, []);

  const onNameResult = useCallback((txt: string) => {
    const nameText = txt.trim();
    if (nameText.length >= 2) setName(nameText);
  }, []);

  // 현재 단계에 따른 결과 콜백
  const getCurrentResultCallback = useCallback(() => {
    switch (step) {
      case 'phone': return onPhoneResult;
      case 'code': return onCodeResult;
      case 'name': return onNameResult;
      default: return onPhoneResult;
    }
  }, [step, onPhoneResult, onCodeResult, onNameResult]);

  // PTT STT 훅 사용
  const { ok: sttSupport, listening: isListening, partial, finalText, handlers } = usePttStt("ko-KR", (text) => {
    const callback = getCurrentResultCallback();
    callback(text);
  });

  // 인증 문자 요청
  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setErr('');
    
    try {
      const e164 = toE164KR(phone);
      if (!e164 || !/^\+\d{8,15}$/.test(e164)) {
        setErr('전화번호 형식을 확인해 주세요.');
        return;
      }
      
      setBusy(true);
      const confirmation = await sendSms(auth, phone);
      confirmRef.current = confirmation;
      setStep('code');
    } catch (e: any) {
      console.error('[CODE] request error:', e);
      setErr('인증 문자 전송 실패: ' + (e?.message || '알 수 없는 오류'));
    } finally {
      setBusy(false);
    }
  }

  // 인증번호 확인
  async function verifyCode(e?: React.FormEvent) {
    e?.preventDefault();
    setErr('');
    
    try {
      if (!code || code.length !== 6) {
        setErr('6자리 코드를 입력해 주세요.');
        return;
      }
      
      if (!confirmRef.current) {
        setErr('인증 정보가 없습니다. 처음부터 다시 시도해주세요.');
        return;
      }
      
      setBusy(true);
      await verifySmsCode(confirmRef.current, code);
      setStep('name');
    } catch (e: any) {
      console.error('[CODE] verify error:', e);
      setErr('인증번호가 올바르지 않습니다. 다시 확인해주세요.');
    } finally {
      setBusy(false);
    }
  }

  // 가입 완료
  async function finish(e?: React.FormEvent) {
    e?.preventDefault();
    setErr('');
    
    try {
      if (!name || name.trim().length < 2) {
        setErr('이름을 2자 이상 입력해 주세요.');
        return;
      }
      
      setBusy(true);
      const user = auth.currentUser;
      if (!user) {
        setErr('사용자 정보를 찾을 수 없습니다. 다시 시도해주세요.');
        return;
      }
      
      await finishSignup(user, name.trim());
      nav('/home');
    } catch (e: any) {
      console.error('[PROFILE] save error:', e);
      setErr('프로필 저장에 실패했습니다: ' + (e?.message || '알 수 없는 오류'));
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile() {
    try {
      if (!name.trim()) {
        setErr('이름을 입력해주세요.');
        return;
      }
      
      setBusy(true);
      const uid = getUid();
      if (!uid) {
        setErr('사용자 정보를 찾을 수 없습니다. 다시 시도해주세요.');
        return;
      }
      
      await finishSignup({ uid } as any, name.trim());
      nav('/home');
    } catch (e: any) {
      console.error('[PROFILE] save error:', e);
      setErr('프로필 저장에 실패했습니다: ' + (e?.message || '알 수 없는 오류'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 16 }}>
      <h2>📱 전화번호 + 🎙️ 음성 보조 가입</h2>

      {/* 단계별 입력 폼 */}
      {step === 'phone' && (
        <form onSubmit={requestCode} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              전화번호
            </label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="010-1234-5678"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: 16
              }}
            />
          </div>

          {/* 음성 입력 버튼 */}
          <button
            type="button"
            disabled={!sttSupport.ok}
            onPointerDown={() => startSTT()}
            onPointerUp={() => stopSTT()}
            onPointerCancel={() => stopSTT()}
            onPointerLeave={() => stopSTT()}
            style={{
              padding: '16px',
              borderRadius: 8,
              border: 'none',
              background: sttSupport.ok ? '#2563eb' : '#ccc',
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              cursor: sttSupport.ok ? 'pointer' : 'not-allowed',
              opacity: sttSupport.ok ? 1 : 0.6
            }}
          >
            {sttSupport.ok ? '🎤 길게 눌러 말하기' : '🎤 음성 인식 미지원'}
          </button>



          {/* 브라우저 미지원 안내 */}
          {!sttSupport && (
            <div style={{
              padding: '12px',
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: 6,
              color: '#92400e',
              textAlign: 'center'
            }}>
              이 브라우저는 Web Speech(음성 인식)를 제공하지 않습니다. 키보드로 입력해 주세요.
            </div>
          )}

          {/* 음성 인식 에러 */}
          {false && (
            <div style={{
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 6,
              color: '#dc2626',
              textAlign: 'center'
            }}>

            </div>
          )}

          <button
            type="submit"
            disabled={busy || !isValidPhone(phone)}
            style={{
              padding: '16px',
              borderRadius: 8,
              border: 'none',
              background: isValidPhone(phone) ? '#10b981' : '#ccc',
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              cursor: isValidPhone(phone) ? 'pointer' : 'not-allowed'
            }}
          >
            {busy ? '전송 중…' : '인증 문자 받기'}
          </button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={verifyCode} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              인증번호 6자리
            </label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: 16,
                textAlign: 'center',
                letterSpacing: 4
              }}
            />
          </div>

          {/* 음성 입력 버튼 */}
          <button
            type="button"
            disabled={!sttSupport.ok}
            onPointerDown={() => startSTT()}
            onPointerUp={() => stopSTT()}
            onPointerCancel={() => stopSTT()}
            onPointerLeave={() => stopSTT()}
            style={{
              padding: '16px',
              borderRadius: 8,
              border: 'none',
              background: sttSupport.ok ? '#2563eb' : '#ccc',
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              cursor: sttSupport.ok ? 'pointer' : 'not-allowed',
              opacity: sttSupport.ok ? 1 : 0.6
            }}
          >
            {sttSupport.ok ? '🎤 길게 눌러 말하기' : '🎤 음성 인식 미지원'}
          </button>



          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setStep('phone')}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #ddd',
                background: 'white',
                color: '#666',
                cursor: 'pointer'
              }}
            >
              번호 수정
            </button>
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: 'none',
                background: code.length === 6 ? '#10b981' : '#ccc',
                color: 'white',
                cursor: code.length === 6 ? 'pointer' : 'not-allowed',
                marginLeft: 'auto'
              }}
            >
              {busy ? '확인 중…' : '확인'}
            </button>
          </div>
        </form>
      )}

      {step === 'name' && (
        <form onSubmit={finish} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
              이름(닉네임)
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="홍길동"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: 16
              }}
            />
          </div>

          {/* 음성 입력 버튼 */}
          <button
            type="button"
            disabled={!sttSupport.ok}
            onPointerDown={() => startSTT()}
            onPointerUp={() => stopSTT()}
            onPointerCancel={() => stopSTT()}
            onPointerLeave={() => stopSTT()}
            style={{
              padding: '16px',
              borderRadius: 8,
              border: 'none',
              background: sttSupport.ok ? '#2563eb' : '#ccc',
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              cursor: sttSupport.ok ? 'pointer' : 'not-allowed',
              opacity: sttSupport.ok ? 1 : 0.6
            }}
          >
            {sttSupport.ok ? '🎤 길게 눌러 말하기' : '🎤 음성 인식 미지원'}
          </button>



          <button
            type="submit"
            disabled={busy || !name.trim()}
            style={{
              padding: '16px',
              borderRadius: 8,
              border: 'none',
              background: name.trim() ? '#10b981' : '#ccc',
              color: 'white',
              fontSize: 16,
              fontWeight: 600,
              cursor: name.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            {busy ? '저장 중…' : '완료'}
          </button>
        </form>
      )}

      {/* 에러 메시지 */}
      {err && (
        <div style={{
          color: 'crimson',
          marginTop: 16,
          padding: '12px 16px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          fontSize: 14
        }}>
          ⚠️ {err}
        </div>
      )}

      {/* reCAPTCHA 컨테이너 */}
      <div id="recaptcha-container" />
    </div>
  );
};

export default PhoneVoiceSignup; 