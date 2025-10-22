import { doc, onSnapshot, getFirestore } from 'firebase/firestore';
import app from './firebase';
import { getAuth } from 'firebase/auth';
import { useEffect, useState } from 'react';

const db = getFirestore(app);
let userFlags: Record<string, boolean> = {};

/**
 * 사용자별 실험 플래그 초기화
 */
export function initUserFlags() {
  const auth = getAuth(app);
  
  auth.onAuthStateChanged(user => {
    if (!user) {
      userFlags = {};
      return;
    }
    
    // 필요한 실험만 구독
    const experiments = ['search_v2', 'voice_signup_v2', 'payments_v2'];
    
    experiments.forEach(feature => {
      onSnapshot(
        doc(db, 'experiments', feature, 'allowlist', user.uid),
        snapshot => {
          userFlags[feature] = snapshot.exists();
          console.log(`🧪 User experiment ${feature}:`, snapshot.exists());
        }
      );
    });
  });
}

/**
 * 사용자별 실험 활성화 확인
 */
export function isUserEnabled(key: string): boolean {
  return !!userFlags[key];
}

/**
 * 사용자별 실험 훅
 */
export function useUserExperiment(feature: string): boolean {
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    initUserFlags();
    
    // 1.5초마다 체크
    const interval = setInterval(() => {
      setEnabled(isUserEnabled(feature));
    }, 1500);
    
    return () => clearInterval(interval);
  }, [feature]);
  
  return enabled;
}

/**
 * 통합 기능 활성화 확인 (사용자 오버라이드 우선)
 */
export function useFeatureEnabled(feature: string, globalFallback: boolean = false): boolean {
  const userEnabled = useUserExperiment(feature);
  const globalEnabled = useFlag<boolean>(feature, globalFallback);
  
  return userEnabled || globalEnabled;
}

/**
 * 모든 사용자 실험 플래그 조회
 */
export function getAllUserFlags(): Record<string, boolean> {
  return { ...userFlags };
}
