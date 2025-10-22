// ??ê°œë°œ?? Firebase Auth ?¸ì…˜ ?„ì „ ì´ˆê¸°??import { auth } from "../lib/firebase";

export async function clearAuthSession() {
  try {
    // 1. Firebase ë¡œê·¸?„ì›ƒ
    await auth.signOut();
    
    // 2. LocalStorage?ì„œ Firebase ê´€???°ì´???? œ
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('firebase:') || key.includes('authUser'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`?—‘ï¸??? œ?? ${key}`);
    });
    
    // 3. SessionStorage???•ë¦¬
    sessionStorage.clear();
    
    console.log("??Firebase Auth ?¸ì…˜ ?„ì „ ì´ˆê¸°???„ë£Œ");
    console.log("?”„ ?˜ì´ì§€ë¥??ˆë¡œê³ ì¹¨?˜ë©´ ë¡œê·¸???íƒœê°€ ì´ˆê¸°?”ë©?ˆë‹¤.");
    
    return true;
  } catch (error) {
    console.error("???¸ì…˜ ì´ˆê¸°???¤íŒ¨:", error);
    return false;
  }
}

// ??ê°œë°œ?? ë¸Œë¼?°ì? ì½˜ì†”?ì„œ ?¸ì¶œ ê°€?¥í•˜?„ë¡ ?„ì—­ ?±ë¡
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).clearAuthSession = clearAuthSession;
  console.log("?”§ ê°œë°œ?? window.clearAuthSession() ?¨ìˆ˜ ?¬ìš© ê°€??);
}
