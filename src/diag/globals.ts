// src/diag/globals.ts
import { db, auth } from "@/lib/firebase";
import * as firestore from "firebase/firestore";
import { signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';

/** 간단한 유틸 (핑 / 네트워크 확인) */
export async function httpPing(url: string, timeoutMs = 1500): Promise<boolean> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store", signal: ctrl.signal });
    if (res.ok) return true;
    // 서버가 HEAD를 지원하지 않을 경우 404여도 살아있을 수 있음 → GET no-cors로 시도
    await fetch(url, { method: "GET", cache: "no-store", mode: "no-cors", signal: ctrl.signal });
    return true;
  } catch {
    try {
      await fetch(url, { method: "GET", cache: "no-store", mode: "no-cors", signal: ctrl.signal });
      return true;
    } catch {
      return false;
    }
  } finally {
    clearTimeout(id);
  }
}

/** 콘솔에서 바로 쓸 수 있도록 window에 fs/db/auth 설치 */
export function installDiagAPI() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (!w.fs || !w.db) {
    w.db = db;
    w.fs = firestore; // ← onSnapshot 포함한 전체 모듈
    console.log("[diag] window.fs, window.db installed with full Firestore API");
  }
  
  // 디버그용 전역 유틸 추가
  w.auth = auth;
  w.signInAnonymously = () => signInAnonymously(auth);
  
  return { db: w.db, fs: w.fs, auth: w.auth };
}

/** 전역 에러 훅 초기화 (1회만 설치) */
export function installGlobalErrorHooks() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.__errorHooksInstalled) return;
  w.__errorHooksInstalled = true;

  window.addEventListener("error", (e) => {
    console.error("[global-error]", e.message, e.error ?? e);
  });
  window.addEventListener("unhandledrejection", (e) => {
    console.error("[global-unhandledrejection]", e.reason);
  });
  console.log("[diag] global error hooks installed");
}

/** 개발용 정리 유틸리티 */
export function cleanupDevHandles() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  delete w.fs;
  delete w.db;
  delete w.auth;
  delete w.signInAnonymously;
  delete w.__errorHooksInstalled;
  console.log("[diag] 개발용 전역 핸들 정리 완료");
}

/** 테스트 문서 삭제 */
export async function deleteTestDoc(collection: string, docId: string) {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(firestore.doc(db, collection, docId));
  console.log(`[diag] 테스트 문서 삭제: ${collection}/${docId}`);
}

// 콘솔에서 바로 쓸 수 있도록 전역에 붙입니다.
Object.assign(window as any, {
  anon: () => signInAnonymously(auth), // 익명 로그인
  signout: () => signOut(auth),        // 로그아웃
  auth,                                // 현재 auth 인스턴스
  // 디버그용 오버레이 무력화
  disableOverlays: () => {
    document.documentElement.setAttribute('data-no-overlay', '1');
    console.log('✅ [DEBUG] Overlays disabled');
  },
  enableOverlays: () => {
    document.documentElement.removeAttribute('data-no-overlay');
    console.log('✅ [DEBUG] Overlays enabled');
  }
});

console.log('[diag] globals installed: anon, signout, auth, disableOverlays, enableOverlays');

// (선택) TS 경고 제거
declare global {
  interface Window {
    anon: () => Promise<any>;
    signout: () => Promise<void>;
    auth: typeof auth;
    disableOverlays: () => void;
    enableOverlays: () => void;
  }
}
export {};

// 상태 변화 로깅(선택)
onAuthStateChanged(auth, (u) => {
  console.log('[auth] user:', u?.uid ?? null);
});

// 개발 환경이면 자동 설치(선택)
if (import.meta.env.DEV) {
  try { installDiagAPI(); installGlobalErrorHooks(); } catch {}
}