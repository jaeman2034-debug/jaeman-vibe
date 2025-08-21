import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { auth } from '@/firebase';

export function useAuthUser(): User | null | undefined {
  const [u, setU] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (user) => setU(user));
  }, []);
  return u;
}

/**
 * 현재 로그인한 사용자의 UID를 안전하게 가져오기
 * @returns uid 또는 null (로그인하지 않은 경우)
 */
export const getUid = () => auth.currentUser?.uid ?? null;

/**
 * 로그인 상태 확인
 * @returns 로그인 여부
 */
export const isLoggedIn = () => !!getUid();

/**
 * 로그인 필요 시 에러 메시지
 * @returns 로그인 필요 메시지
 */
export const getLoginRequiredMessage = () => '로그인이 필요합니다.';

/**
 * 로그인 필요 시 기본 UI 컴포넌트
 * @param message 커스텀 메시지 (선택사항)
 * @returns 로그인 필요 UI
 */
export const LoginRequiredUI = ({ message = getLoginRequiredMessage() }: { message?: string }) => (
  <div style={{padding: 16, textAlign: 'center', color: '#666'}}>
    <div style={{fontSize: 18, marginBottom: 8}}>🔒 {message}</div>
    <div style={{fontSize: 14}}>로그인 후 이용해주세요.</div>
  </div>
); 