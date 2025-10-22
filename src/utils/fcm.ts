/**
 * 🔔 FCM (Firebase Cloud Messaging) 초기화
 * 
 * 기능:
 * 1. FCM 토큰 요청 및 저장
 * 2. 푸시 알림 수신 처리
 * 3. 사용자별 알림 설정 관리
 */

import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getAuth } from "firebase/auth";

// FCM VAPID Key (Firebase Console → Project Settings → Cloud Messaging)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * FCM 토큰 요청 및 저장
 */
export async function requestFCMToken(): Promise<string | null> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.log("🔐 로그인이 필요합니다 - FCM 토큰 요청 불가");
      return null;
    }

    // 알림 권한 요청
    const permission = await Notification.requestPermission();
    
    if (permission !== "granted") {
      console.log("🔔 알림 권한이 거부되었습니다");
      return null;
    }

    console.log("✅ 알림 권한 허용됨");

    // FCM 토큰 요청
    const messaging = getMessaging();
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (token) {
      console.log("🔔 FCM 토큰 획득:", token);
      
      // 사용자 문서에 토큰 저장
      await setDoc(doc(db, "users", user.uid), {
        fcmToken: token,
        lastTokenUpdate: serverTimestamp(),
      }, { merge: true });

      return token;
    } else {
      console.log("❌ FCM 토큰 획득 실패");
      return null;
    }
  } catch (error) {
    console.error("❌ FCM 토큰 요청 오류:", error);
    return null;
  }
}

/**
 * FCM 메시지 수신 처리
 */
export function setupFCMListener() {
  const messaging = getMessaging();
  
  onMessage(messaging, (payload) => {
    console.log("🔔 FCM 메시지 수신:", payload);
    
    // 브라우저 알림 표시
    if (payload.notification) {
      new Notification(payload.notification.title || "새 알림", {
        body: payload.notification.body,
        icon: payload.notification.icon || "/icons/icon-192.svg",
        badge: "/icons/icon-192.svg",
        tag: payload.messageId,
        requireInteraction: true,
      });
    }
  });
}

/**
 * FCM 초기화 (앱 시작 시 호출)
 */
export async function initializeFCM(): Promise<void> {
  try {
    console.log("🔔 FCM 초기화 시작...");
    
    // 토큰 요청
    await requestFCMToken();
    
    // 메시지 리스너 설정
    setupFCMListener();
    
    console.log("✅ FCM 초기화 완료");
  } catch (error) {
    console.error("❌ FCM 초기화 실패:", error);
  }
}