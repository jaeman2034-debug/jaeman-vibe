// ?�� Firebase Cloud Messaging - AI ?�시 리포???�스??import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';

const messaging = getMessaging(app);

export async function requestFCMToken(): Promise<string | null> {
  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
    });
    
    if (token) {
      console.log('??FCM Token:', token);
      
      // Firestore???�큰 ?�??(관리자??
      await saveFCMTokenToFirestore(token);
      
      return token;
    } else {
      console.warn('?�️ FCM Token??받을 ???�습?�다. 권한???�인?�주?�요.');
      return null;
    }
  } catch (err) {
    console.error('??FCM Token ?�청 ?�패:', err);
    return null;
  }
}

// Firestore??FCM ?�큰 ?�??async function saveFCMTokenToFirestore(token: string) {
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    
    const tokenRef = doc(db, 'adminFCMTokens', 'admin');
    await setDoc(tokenRef, {
      token: token,
      timestamp: new Date(),
      type: 'admin'
    }, { merge: true });
    
    console.log('??FCM ?�큰 Firestore???�???�료');
  } catch (error) {
    console.error('??FCM ?�큰 Firestore ?�???�패:', error);
  }
}

// ?�그?�운??메시지 ?�신 리스??export function listenMessages() {
  onMessage(messaging, (payload) => {
    console.log('?�� ?�그?�운???�림 ?�신:', payload);
    
    // ?�그?�운?�에?�도 ?�림 ?�시
    if (payload.notification) {
      const title = payload.notification.title || 'AI 리포???�착';
      const body = payload.notification.body || '?�늘???�약 리포?��? ?�어보세??';
      
      // 브라?��? ?�림 ?�시
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-96.png',
          tag: 'ai-report',
          requireInteraction: true
        });
      }
    }
  });
}

// ?�림 권한 ?�청
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('?�️ ??브라?��????�림??지?�하지 ?�습?�다.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('?�️ ?�림 권한??거�??�었?�니?? ?�정?�서 변경해주세??');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('???�림 권한 ?�청 ?�패:', error);
    return false;
  }
}

// FCM 초기??(???�작 ???�출)
export async function initializeFCM(): Promise<boolean> {
  try {
    // 1. ?�림 권한 ?�청
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return false;
    }

    // 2. FCM ?�큰 ?�청
    const token = await requestFCMToken();
    if (!token) {
      return false;
    }

    // 3. 메시지 리스???�록
    listenMessages();

    console.log('??FCM 초기???�료');
    return true;
  } catch (error) {
    console.error('??FCM 초기???�패:', error);
    return false;
  }
}

export { messaging };
