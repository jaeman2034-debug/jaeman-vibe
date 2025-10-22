import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import app from "../lib/firebase";

export const useFCMToken = () => {
  const requestPermission = async () => {
    try {
      // FCM 지???��? ?�인
      const supported = await isSupported();
      if (!supported) {
        console.warn("?�️ ??브라?��???FCM??지?�하지 ?�습?�다.");
        return;
      }

      // ?�림 권한 ?�청
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        console.log("???�림 권한 ?�용??);

        const messaging = getMessaging(app);
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

        if (!vapidKey) {
          console.error("??VITE_FIREBASE_VAPID_KEY가 ?�정?��? ?�았?�니??);
          return;
        }

        // FCM ?�큰 가?�오�?        const currentToken = await getToken(messaging, { vapidKey });

        if (currentToken) {
          console.log("??FCM ?�큰 ?�득:", currentToken);

          // ?�재 로그???�용??          const user = auth.currentUser;
          
          if (user) {
            // Firestore users 컬렉?�에 fcmToken ?�??            await setDoc(
              doc(db, "users", user.uid),
              { 
                fcmToken: currentToken,
                fcmTokenUpdatedAt: new Date().toISOString(),
                email: user.email || "?�명",
                uid: user.uid
              },
              { merge: true }
            );
            console.log("??FCM ?�큰 Firestore ?�???�료:", user.uid);
          } else {
            console.warn("?�️ 로그?�되지 ?�아 FCM ?�큰???�?�할 ???�습?�다.");
          }
        } else {
          console.warn("?�️ FCM ?�큰??가?�올 ???�습?�다.");
        }
      } else if (permission === "denied") {
        console.warn("?�️ ?�림 권한??거�??�었?�니??");
      } else {
        console.log("?�️ ?�림 권한??기본�?default)?�니??");
      }
    } catch (error: any) {
      console.error("??FCM ?�큰 ?�청 ?�류:", error);
    }
  };

  return { requestPermission };
};

