// ?”¥ Firebase Cloud Messaging - AI ?¸ì‹œ ë¦¬í¬???œìŠ¤??import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';

const messaging = getMessaging(app);

export async function requestFCMToken(): Promise<string | null> {
  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
    });
    
    if (token) {
      console.log('??FCM Token:', token);
      
      // Firestore??? í° ?€??(ê´€ë¦¬ì??
      await saveFCMTokenToFirestore(token);
      
      return token;
    } else {
      console.warn('? ï¸ FCM Token??ë°›ì„ ???†ìŠµ?ˆë‹¤. ê¶Œí•œ???•ì¸?´ì£¼?¸ìš”.');
      return null;
    }
  } catch (err) {
    console.error('??FCM Token ?”ì²­ ?¤íŒ¨:', err);
    return null;
  }
}

// Firestore??FCM ? í° ?€??async function saveFCMTokenToFirestore(token: string) {
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    
    const tokenRef = doc(db, 'adminFCMTokens', 'admin');
    await setDoc(tokenRef, {
      token: token,
      timestamp: new Date(),
      type: 'admin'
    }, { merge: true });
    
    console.log('??FCM ? í° Firestore???€???„ë£Œ');
  } catch (error) {
    console.error('??FCM ? í° Firestore ?€???¤íŒ¨:', error);
  }
}

// ?¬ê·¸?¼ìš´??ë©”ì‹œì§€ ?˜ì‹  ë¦¬ìŠ¤??export function listenMessages() {
  onMessage(messaging, (payload) => {
    console.log('?’¬ ?¬ê·¸?¼ìš´???Œë¦¼ ?˜ì‹ :', payload);
    
    // ?¬ê·¸?¼ìš´?œì—?œë„ ?Œë¦¼ ?œì‹œ
    if (payload.notification) {
      const title = payload.notification.title || 'AI ë¦¬í¬???„ì°©';
      const body = payload.notification.body || '?¤ëŠ˜???”ì•½ ë¦¬í¬?¸ë? ?¤ì–´ë³´ì„¸??';
      
      // ë¸Œë¼?°ì? ?Œë¦¼ ?œì‹œ
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

// ?Œë¦¼ ê¶Œí•œ ?”ì²­
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('? ï¸ ??ë¸Œë¼?°ì????Œë¦¼??ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('? ï¸ ?Œë¦¼ ê¶Œí•œ??ê±°ë??˜ì—ˆ?µë‹ˆ?? ?¤ì •?ì„œ ë³€ê²½í•´ì£¼ì„¸??');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('???Œë¦¼ ê¶Œí•œ ?”ì²­ ?¤íŒ¨:', error);
    return false;
  }
}

// FCM ì´ˆê¸°??(???œì‘ ???¸ì¶œ)
export async function initializeFCM(): Promise<boolean> {
  try {
    // 1. ?Œë¦¼ ê¶Œí•œ ?”ì²­
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return false;
    }

    // 2. FCM ? í° ?”ì²­
    const token = await requestFCMToken();
    if (!token) {
      return false;
    }

    // 3. ë©”ì‹œì§€ ë¦¬ìŠ¤???±ë¡
    listenMessages();

    console.log('??FCM ì´ˆê¸°???„ë£Œ');
    return true;
  } catch (error) {
    console.error('??FCM ì´ˆê¸°???¤íŒ¨:', error);
    return false;
  }
}

export { messaging };
