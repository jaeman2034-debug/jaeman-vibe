import { auth } from '@/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from 'firebase/auth';
import type { User } from 'firebase/auth';

// KR 전화번호를 E.164(+82)로 변환: 010-1234-5678 -> +821012345678
export function toE164KR(input: string) {
  const d = input.replace(/[^\d]/g, '');
  if (!d) return '';
  if (d.startsWith('82')) return `+${d}`;
  if (d.startsWith('0')) return `+82${d.slice(1)}`;
  if (d.startsWith('1')) return `+82${d}`; // 오입력 보정
  return d.startsWith('+') ? d : `+${d}`;   // 국제형 그대로 허용
}

let recaptcha: RecaptchaVerifier | null = null;
export function initRecaptcha(containerId = 'recaptcha-container') {
  if (recaptcha) return recaptcha;
  recaptcha = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
  return recaptcha;
}

export async function sendOtp(phoneE164: string) {
  const appVerifier = initRecaptcha();
  return await signInWithPhoneNumber(auth, phoneE164, appVerifier);
}

export async function finishSignup(user: User, displayName?: string) {
  if (displayName && !user.displayName) {
    await updateProfile(user, { displayName });
  }
  return user;
} 