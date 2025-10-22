import { doc, onSnapshot, getFirestore } from 'firebase/firestore';
import app from './firebase';
import { useEffect, useState } from 'react';

const db = getFirestore(app);
let cache: Record<string, any> = {};
let inited = false;

/**
 * 플래그 초기화 (앱 시작 시 한 번만 호출)
 */
export function initFlags() {
  if (inited) return;
  inited = true;
  
  onSnapshot(doc(db, 'config', 'runtime'), (snapshot) => {
    cache = snapshot.exists() ? snapshot.data() as any : {};
    (window as any).flags = cache; // 디버그용 전역 접근
    console.log('🚩 Flags updated:', cache);
  });
}

/**
 * 플래그 값 조회
 */
export function getFlag<T = any>(key: string, fallback?: T): T {
  return (cache as any)[key] ?? (fallback as any);
}

/**
 * 플래그 훅 (React 컴포넌트에서 사용)
 */
export function useFlag<T = any>(key: string, fallback?: T): T {
  const [, setTick] = useState(0);
  
  useEffect(() => {
    initFlags();
    // 1.5초마다 리렌더링하여 플래그 변경 감지
    const interval = setInterval(() => setTick(x => x + 1), 1500);
    return () => clearInterval(interval);
  }, []);
  
  return getFlag<T>(key, fallback);
}

/**
 * 기능 게이트 컴포넌트
 */
export function FeatureGate({ 
  name, 
  fallback = null, 
  children 
}: { 
  name: string; 
  fallback?: any; 
  children: any;
}) {
  const enabled = useFlag<boolean>(name, false);
  return enabled ? children : fallback;
}

/**
 * 파일럿 모드 확인
 */
export function usePilotMode(): boolean {
  return useFlag<boolean>('pilot_mode', false);
}

/**
 * 결제 기능 활성화 확인
 */
export function usePaymentsEnabled(): boolean {
  return useFlag<boolean>('payments_enabled', false);
}

/**
 * 검색 v2 활성화 확인
 */
export function useSearchV2(): boolean {
  return useFlag<boolean>('search_v2', false);
}

/**
 * 음성 가입 v2 활성화 확인
 */
export function useVoiceSignupV2(): boolean {
  return useFlag<boolean>('voice_signup_v2', false);
}

/**
 * 모든 플래그 조회 (디버그용)
 */
export function getAllFlags(): Record<string, any> {
  return { ...cache };
}
