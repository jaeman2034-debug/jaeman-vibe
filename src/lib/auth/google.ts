// src/lib/auth/google.ts
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { auth } from '../../firebase'; // 프로젝트의 auth 인스턴스 경로에 맞게 조정

const provider = new GoogleAuthProvider();

// 인앱 브라우저/아이폰 감지
export const isInApp =
  /FBAN|FBAV|Instagram|KAKAOTALK|KAKAOSTORY|NAVER|Line|Daum|Whale|Twitter/i.test(
    navigator.userAgent
  );
export const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

// 앱 시작 시 리다이렉트 결과 복원(앱 초기화 시 1회 호출)
export async function resumeRedirect() {
  try {
    const res = await getRedirectResult(auth);
    if (res?.user) {
      console.info('[AUTH] redirect result received:', res.user.uid);
      return res.user;
    }
  } catch (e) {
    console.error('[AUTH] redirect result error:', e);
  }
  return null;
}

// 환경에 따라 팝업/리다이렉트 선택 + 팝업 실패 시 리다이렉트 폴백
export async function loginWithGoogle() {
  const useRedirect = isInApp || isIOS;
  try {
    if (useRedirect) {
      await signInWithRedirect(auth, provider);
      return;
    }
    await signInWithPopup(auth, provider);
  } catch (e: any) {
    if (
      e?.code === 'auth/popup-blocked' ||
      e?.code === 'auth/popup-closed-by-user' ||
      e?.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw e;
  }
}
