// src/lib/sms.js  (ESM)
import { auth } from '@/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// reCAPTCHA 준비(필요 시 한 번만)
export function setupRecaptcha(containerId = 'recaptcha-container') {
  if (window.recaptchaVerifier) return window.recaptchaVerifier;
  
  // 컨테이너가 없으면 생성
  if (!document.getElementById(containerId)) {
    const div = document.createElement('div');
    div.id = containerId;
    div.style.display = 'none';
    document.body.appendChild(div);
  }
  
  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible', // 버튼 없이 보이지 않게
  });
  return window.recaptchaVerifier;
}

// 전화번호를 E.164 형식으로 변환
export function toE164KR(raw) {
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("0")) return "+82" + d.slice(1);
  if (d.startsWith("82")) return "+" + d;
  return "+82" + d;
}

// OTP 전송
export async function sendOtp(phoneNumber) {
  const verifier = setupRecaptcha(); // or 전달받은 containerId 사용
  const confirmation = await signInWithPhoneNumber(auth, toE164KR(phoneNumber), verifier);
  return confirmation; // confirm(code) 호출용 객체
}

// 코드 확인
export async function verifyOtp(confirmation, code) {
  return await confirmation.confirm(code);
}

// 기존 함수들도 유지 (하위 호환성)
export async function sendSms(auth, phoneDigits) {
  const verifier = setupRecaptcha();
  return signInWithPhoneNumber(auth, toE164KR(phoneDigits), verifier);
}

export async function verifySmsCode(confirmation, code) {
  return confirmation.confirm(code);
} 