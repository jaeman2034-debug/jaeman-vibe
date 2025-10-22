import { messaging } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";
import { db, auth } from "./firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

/**
 * FCM ?�큰 ?�청 �?Firestore ?�?? * @returns FCM ?�큰 ?�는 null
 */
export async function requestAndSaveFCMToken(): Promise<string | null> {
  if (!messaging) {
    console.warn("?�️ FCM??지?�되지 ?�는 ?�경?�니??);
    return null;
  }

  try {
    // ?�림 권한 ?�청
    const permission = await Notification.requestPermission();
    
    if (permission !== "granted") {
      console.warn("?�️ ?�림 권한??거�??�었?�니??);
      return null;
    }

    console.log("???�림 권한 ?�용??);

    // FCM ?�큰 ?�득
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      console.error("??VAPID Key가 ?�정?��? ?�았?�니??);
      return null;
    }

    const token = await getToken(messaging, { vapidKey });

    if (token) {
      console.log("??FCM Token ?�득:", token.substring(0, 20) + "...");

      // Firestore???�큰 ?�??      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          fcmToken: token,
          fcmTokenUpdatedAt: serverTimestamp(),
          platform: "web",
        });
        console.log("??FCM Token??Firestore???�?�되?�습?�다");
      }

      return token;
    } else {
      console.warn("?�️ FCM Token???�득?��? 못했?�니??);
      return null;
    }
  } catch (error) {
    console.error("??FCM Token ?�청 ?�패:", error);
    return null;
  }
}

/**
 * ?�그?�운???�시 ?�림 리스???�정
 */
export function setupForegroundPushListener() {
  if (!messaging) {
    console.warn("?�️ FCM??지?�되지 ?�는 ?�경?�니??);
    return;
  }

  onMessage(messaging, (payload) => {
    console.log("?�� ?�그?�운???�시 ?�신:", payload);

    const { title, body, icon } = payload.notification || {};

    // 브라?��? ?�림 ?�시
    if (title) {
      new Notification(title, {
        body: body || "",
        icon: icon || "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: "yago-vibe-notification",
        requireInteraction: false,
      });
    }

    // 커스?� UI ?�림 (?�택)
    showInAppNotification(title || "YAGO VIBE", body || "???�림???�습?�다.");
  });
}

/**
 * ?�앱 ?�림 ?�시 (?�스??
 */
function showInAppNotification(title: string, body: string) {
  // 기존 ?�림 ?�거
  const existing = document.getElementById("fcm-toast");
  if (existing) existing.remove();

  // ???�림 ?�성
  const toast = document.createElement("div");
  toast.id = "fcm-toast";
  toast.className = "fixed top-4 right-4 z-50 bg-white rounded-xl shadow-lg p-4 max-w-sm animate-slide-in";
  toast.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="text-3xl">?��</div>
      <div class="flex-1">
        <h3 class="font-semibold text-gray-900 mb-1">${title}</h3>
        <p class="text-sm text-gray-600">${body}</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
        ??      </button>
    </div>
  `;

  document.body.appendChild(toast);

  // 5�????�동 ?�거
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

/**
 * 관리자 ?�용: 모든 관리자?�게 ?�시 ?�송 (?�버 ?�이?�용)
 * @param title ?�림 ?�목
 * @param body ?�림 본문
 * @param data 추�? ?�이?? */
export async function sendAdminNotification(
  title: string,
  body: string,
  data?: Record<string, string>
) {
  // ???�수??Firebase Functions?�서 ?�출?�어????  console.log("?�� 관리자 ?�시 ?�송 ?�청:", { title, body, data });
  
  // Firebase Functions?�서 구현:
  // 1. Firestore?�서 role: "admin" ?��? 조회
  // 2. �??��???fcmToken ?�집
  // 3. FCM API�??�괄 ?�송
}

