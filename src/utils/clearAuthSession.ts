// ??개발?? Firebase Auth ?�션 ?�전 초기??import { auth } from "../lib/firebase";

export async function clearAuthSession() {
  try {
    // 1. Firebase 로그?�웃
    await auth.signOut();
    
    // 2. LocalStorage?�서 Firebase 관???�이????��
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('firebase:') || key.includes('authUser'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`?���???��?? ${key}`);
    });
    
    // 3. SessionStorage???�리
    sessionStorage.clear();
    
    console.log("??Firebase Auth ?�션 ?�전 초기???�료");
    console.log("?�� ?�이지�??�로고침?�면 로그???�태가 초기?�됩?�다.");
    
    return true;
  } catch (error) {
    console.error("???�션 초기???�패:", error);
    return false;
  }
}

// ??개발?? 브라?��? 콘솔?�서 ?�출 가?�하?�록 ?�역 ?�록
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).clearAuthSession = clearAuthSession;
  console.log("?�� 개발?? window.clearAuthSession() ?�수 ?�용 가??);
}
