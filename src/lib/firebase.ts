import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// 개발 중 빠른 진단
if (!firebaseConfig.apiKey) {
  console.error('[FB] Missing VITE_FIREBASE_API_KEY (.env.local 확인)');
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// App Check 초기화 (프로덕션 보호)
if (import.meta.env.VITE_RECAPTCHA_V3_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_V3_KEY),
    isTokenAutoRefreshEnabled: true
  });
  console.log('[App Check] enabled');
} else {
  console.warn('[App Check] VITE_RECAPTCHA_V3_KEY not found - disabled');
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// ✅ 리전 고정
const functions = getFunctions(app, import.meta.env.VITE_FN_REGION || "us-central1");
console.log('[fn region]', import.meta.env.VITE_FN_REGION);

// (선택) 개발 모드에서만 에뮬레이터
const useEmu = import.meta.env.VITE_USE_EMULATORS === '1' && import.meta.env.DEV;
if (useEmu) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  console.log('✅ [EMU] connected');
}

export { app, auth, db, storage, functions, googleProvider };

// 콘솔 편의
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).auth = auth;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).db = db;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  import('firebase/firestore').then(fs => {
    (window as any).fs = fs;
  });
}