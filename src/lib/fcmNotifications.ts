import { messaging } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";
import { db, auth } from "./firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

/**
 * FCM ? í° ?”ì²­ ë°?Firestore ?€?? * @returns FCM ? í° ?ëŠ” null
 */
export async function requestAndSaveFCMToken(): Promise<string | null> {
  if (!messaging) {
    console.warn("? ï¸ FCM??ì§€?ë˜ì§€ ?ŠëŠ” ?˜ê²½?…ë‹ˆ??);
    return null;
  }

  try {
    // ?Œë¦¼ ê¶Œí•œ ?”ì²­
    const permission = await Notification.requestPermission();
    
    if (permission !== "granted") {
      console.warn("? ï¸ ?Œë¦¼ ê¶Œí•œ??ê±°ë??˜ì—ˆ?µë‹ˆ??);
      return null;
    }

    console.log("???Œë¦¼ ê¶Œí•œ ?ˆìš©??);

    // FCM ? í° ?ë“
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      console.error("??VAPID Keyê°€ ?¤ì •?˜ì? ?Šì•˜?µë‹ˆ??);
      return null;
    }

    const token = await getToken(messaging, { vapidKey });

    if (token) {
      console.log("??FCM Token ?ë“:", token.substring(0, 20) + "...");

      // Firestore??? í° ?€??      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          fcmToken: token,
          fcmTokenUpdatedAt: serverTimestamp(),
          platform: "web",
        });
        console.log("??FCM Token??Firestore???€?¥ë˜?ˆìŠµ?ˆë‹¤");
      }

      return token;
    } else {
      console.warn("? ï¸ FCM Token???ë“?˜ì? ëª»í–ˆ?µë‹ˆ??);
      return null;
    }
  } catch (error) {
    console.error("??FCM Token ?”ì²­ ?¤íŒ¨:", error);
    return null;
  }
}

/**
 * ?¬ê·¸?¼ìš´???¸ì‹œ ?Œë¦¼ ë¦¬ìŠ¤???¤ì •
 */
export function setupForegroundPushListener() {
  if (!messaging) {
    console.warn("? ï¸ FCM??ì§€?ë˜ì§€ ?ŠëŠ” ?˜ê²½?…ë‹ˆ??);
    return;
  }

  onMessage(messaging, (payload) => {
    console.log("?“© ?¬ê·¸?¼ìš´???¸ì‹œ ?˜ì‹ :", payload);

    const { title, body, icon } = payload.notification || {};

    // ë¸Œë¼?°ì? ?Œë¦¼ ?œì‹œ
    if (title) {
      new Notification(title, {
        body: body || "",
        icon: icon || "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: "yago-vibe-notification",
        requireInteraction: false,
      });
    }

    // ì»¤ìŠ¤?€ UI ?Œë¦¼ (? íƒ)
    showInAppNotification(title || "YAGO VIBE", body || "???Œë¦¼???ˆìŠµ?ˆë‹¤.");
  });
}

/**
 * ?¸ì•± ?Œë¦¼ ?œì‹œ (? ìŠ¤??
 */
function showInAppNotification(title: string, body: string) {
  // ê¸°ì¡´ ?Œë¦¼ ?œê±°
  const existing = document.getElementById("fcm-toast");
  if (existing) existing.remove();

  // ???Œë¦¼ ?ì„±
  const toast = document.createElement("div");
  toast.id = "fcm-toast";
  toast.className = "fixed top-4 right-4 z-50 bg-white rounded-xl shadow-lg p-4 max-w-sm animate-slide-in";
  toast.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="text-3xl">?””</div>
      <div class="flex-1">
        <h3 class="font-semibold text-gray-900 mb-1">${title}</h3>
        <p class="text-sm text-gray-600">${body}</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
        ??      </button>
    </div>
  `;

  document.body.appendChild(toast);

  // 5ì´????ë™ ?œê±°
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

/**
 * ê´€ë¦¬ì ?„ìš©: ëª¨ë“  ê´€ë¦¬ì?ê²Œ ?¸ì‹œ ?„ì†¡ (?œë²„ ?¬ì´?œìš©)
 * @param title ?Œë¦¼ ?œëª©
 * @param body ?Œë¦¼ ë³¸ë¬¸
 * @param data ì¶”ê? ?°ì´?? */
export async function sendAdminNotification(
  title: string,
  body: string,
  data?: Record<string, string>
) {
  // ???¨ìˆ˜??Firebase Functions?ì„œ ?¸ì¶œ?˜ì–´????  console.log("?“¤ ê´€ë¦¬ì ?¸ì‹œ ?„ì†¡ ?”ì²­:", { title, body, data });
  
  // Firebase Functions?ì„œ êµ¬í˜„:
  // 1. Firestore?ì„œ role: "admin" ? ì? ì¡°íšŒ
  // 2. ê°?? ì???fcmToken ?˜ì§‘
  // 3. FCM APIë¡??¼ê´„ ?„ì†¡
}

