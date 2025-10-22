import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { getAuth } from "firebase/auth";

export async function initMessaging() {
  // 개발 모드에서 FCM 스킵
  if (import.meta.env.DEV) {
    console.info('[MSG] Dev mode → skip FCM init');
    return null;
  }

  // messagingSenderId가 없으면 스킵
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  if (!messagingSenderId) {
    console.info('[MSG] No messagingSenderId → skip FCM init');
    return null;
  }

  // Firebase config에서 messagingSenderId 확인
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.messagingSenderId) {
    console.info('[MSG] No messagingSenderId in config → skip FCM init');
    return null;
  }

  if (!(await isSupported())) return null;

  // SW 등록
  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  }

  const messaging = getMessaging(app);
  const vapidKey = import.meta.env.VITE_VAPID_KEY as string; // 콘솔에서 발급한 Web Push 인증서 키
  const token = await getToken(messaging, { vapidKey });

  // 로그인 사용자 토큰 저장
  const auth = getAuth(app);
  const user = auth.currentUser;
  if (user && token) {
    const db = getFirestore(app);
    await setDoc(
      doc(db, "users", user.uid, "fcmTokens", token), // 토큰을 문서ID로
      {
        token,
        ua: navigator.userAgent,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  // 포그라운드 메시지(앱 열려 있을 때)
  onMessage(messaging, ({ notification, data }) => {
    // TODO: 토스트/배너로 보여주기
    console.log("[FCM] onMessage", notification, data);
  });

  return token;
}
