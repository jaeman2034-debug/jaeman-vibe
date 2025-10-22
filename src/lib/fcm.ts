import { getMessaging, getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function initializeFCM() {
  try {
    // FCM 초기화 (권한 요청 없이)
    const messaging = getMessaging();
    console.log('FCM 초기화 완료');
    return messaging;
  } catch (error) {
    console.error('FCM 초기화 실패:', error);
    return null;
  }
}

export async function ensureFcmToken(uid: string) {
  try {
    const messaging = getMessaging();
    const token = await getToken(messaging, { 
      vapidKey: import.meta.env.VITE_VAPID_KEY 
    });
    
    if (token) {
      await setDoc(doc(db, 'users', uid), { 
        profile: { fcmToken: token }
      }, { merge: true });
      return token;
    }
    return null;
  } catch (error) {
    console.error('FCM 토큰 등록 실패:', error);
    return null;
  }
}