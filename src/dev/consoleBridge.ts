// src/dev/consoleBridge.ts
import * as fs from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

declare global {
  interface Window {
    fs: typeof fs;
    db: typeof db;
    auth: typeof auth;
    loginGoogle: () => Promise<any>;
    logout: () => Promise<void>;
    seedMarket?: (overrides?: Partial<Record<string, any>>) => Promise<string>;
  }
}

const defaults = {
  title: '테스트 축구화',
  price: 25000,
  category: '축구화',
  region: '송산2동',
  status: 'active',
  published: true,
};

if (import.meta.env.DEV) {
  // Firestore 헬퍼
  (window as any).fs = fs;
  (window as any).db = db;
  
  // Auth 헬퍼
  (window as any).auth = auth;
  (window as any).loginGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
  (window as any).logout = () => signOut(auth);
  
  // Auth 상태 모니터링
  onAuthStateChanged(auth, (u) => console.log('[Auth] user =', u?.uid ?? null));
  
  // 시드 데이터 함수
  (window as any).seedMarket = async (overrides = {}) => {
    const id = crypto.randomUUID();
    await fs.setDoc(fs.doc(db, 'market', id), {
      ...defaults,
      ...overrides,
      createdAt: fs.serverTimestamp(),
    });
    return id;
  };
  
  console.log('🔧 콘솔 브릿지 준비됨: window.fs, window.db, window.auth, window.loginGoogle(), window.logout()');
}
