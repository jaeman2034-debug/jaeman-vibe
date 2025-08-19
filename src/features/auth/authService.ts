// src/features/auth/authService.ts
import { auth, googleProvider, isUsingEmulators } from '../../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

// ---- Email/Password ----
export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}
export const loginWithEmail = signInWithEmail; // alias

export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}
export const signUpWithEmail = registerWithEmail; // alias

// ---- Google ----
export async function signInWithGoogle() {
  if (isUsingEmulators) {
    // 에뮬레이터에선 구글 팝업 로그인 불편/미지원 케이스가 있어 이메일/비번 권장
    throw new Error('에뮬레이터에서는 이메일/비밀번호 로그인을 사용하세요.');
  }
  return signInWithPopup(auth, googleProvider);
}
export const loginWithGoogle = signInWithGoogle; // alias

// ---- Session helpers ----
export function logout() {
  return signOut(auth);
}
export function subscribeAuth(cb: (u: User | null) => void) {
  return onAuthStateChanged(auth, cb);
} 