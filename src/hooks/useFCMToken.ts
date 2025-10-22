import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import app from "../lib/firebase";

export const useFCMToken = () => {
  const requestPermission = async () => {
    try {
      // FCM ì§€???¬ë? ?•ì¸
      const supported = await isSupported();
      if (!supported) {
        console.warn("? ï¸ ??ë¸Œë¼?°ì???FCM??ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.");
        return;
      }

      // ?Œë¦¼ ê¶Œí•œ ?”ì²­
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        console.log("???Œë¦¼ ê¶Œí•œ ?ˆìš©??);

        const messaging = getMessaging(app);
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

        if (!vapidKey) {
          console.error("??VITE_FIREBASE_VAPID_KEYê°€ ?¤ì •?˜ì? ?Šì•˜?µë‹ˆ??);
          return;
        }

        // FCM ? í° ê°€?¸ì˜¤ê¸?        const currentToken = await getToken(messaging, { vapidKey });

        if (currentToken) {
          console.log("??FCM ? í° ?ë“:", currentToken);

          // ?„ì¬ ë¡œê·¸???¬ìš©??          const user = auth.currentUser;
          
          if (user) {
            // Firestore users ì»¬ë ‰?˜ì— fcmToken ?€??            await setDoc(
              doc(db, "users", user.uid),
              { 
                fcmToken: currentToken,
                fcmTokenUpdatedAt: new Date().toISOString(),
                email: user.email || "?µëª…",
                uid: user.uid
              },
              { merge: true }
            );
            console.log("??FCM ? í° Firestore ?€???„ë£Œ:", user.uid);
          } else {
            console.warn("? ï¸ ë¡œê·¸?¸ë˜ì§€ ?Šì•„ FCM ? í°???€?¥í•  ???†ìŠµ?ˆë‹¤.");
          }
        } else {
          console.warn("? ï¸ FCM ? í°??ê°€?¸ì˜¬ ???†ìŠµ?ˆë‹¤.");
        }
      } else if (permission === "denied") {
        console.warn("? ï¸ ?Œë¦¼ ê¶Œí•œ??ê±°ë??˜ì—ˆ?µë‹ˆ??");
      } else {
        console.log("?¹ï¸ ?Œë¦¼ ê¶Œí•œ??ê¸°ë³¸ê°?default)?…ë‹ˆ??");
      }
    } catch (error: any) {
      console.error("??FCM ? í° ?”ì²­ ?¤ë¥˜:", error);
    }
  };

  return { requestPermission };
};

