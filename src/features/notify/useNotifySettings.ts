import { useEffect, useState } from "react";
import { app } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";
import {
  getFirestore, doc, onSnapshot, setDoc, getDocs, collection, deleteDoc
} from "firebase/firestore";
import { isSupported, getMessaging, getToken, deleteToken } from "firebase/messaging";

type Settings = { notifyTrade?: boolean; notifyChat?: boolean; };

export default function useNotifySettings() {
  const { user } = useAuth();
  const uid = user?.uid;
  const db = getFirestore(app);
  const [settings, setSettings] = useState<Settings>({ notifyTrade: true, notifyChat: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    const ref = doc(db, "users", uid, "settings", "prefs");
    return onSnapshot(ref, (s) => {
      setSettings({ notifyTrade: true, notifyChat: true, ...(s.data() || {}) });
      setLoading(false);
    });
  }, [db, uid]);

  async function save(partial: Partial<Settings>) {
    if (!uid) return;
    await setDoc(doc(db, "users", uid, "settings", "prefs"), partial, { merge: true });
  }

  // 푸시 활성화(권한 요청 + 토큰 저장)
  async function enablePush() {
    // 개발 모드에서 FCM 스킵
    if (import.meta.env.DEV) {
      console.info('[MSG] Dev mode → skip FCM enablePush');
      return;
    }

    if (!uid || !(await isSupported())) return;
    if ("serviceWorker" in navigator) await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging(app);
    const vapidKey = import.meta.env.VITE_VAPID_KEY as string;
    const token = await getToken(messaging, { vapidKey });
    if (!token) return;
    await setDoc(
      doc(db, "users", uid, "fcmTokens", token),
      { token, ua: navigator.userAgent, updatedAt: new Date() },
      { merge: true }
    );
  }

  // 푸시 비활성화(모든 토큰 정리)
  async function disablePush() {
    // 개발 모드에서 FCM 스킵
    if (import.meta.env.DEV) {
      console.info('[MSG] Dev mode → skip FCM disablePush');
      return;
    }

    if (!uid || !(await isSupported())) return;
    const snap = await getDocs(collection(db, "users", uid, "fcmTokens"));
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    const messaging = getMessaging(app);
    try { await deleteToken(messaging); } catch { /* 이미 무효면 무시 */ }
  }

  return { settings, loading, save, enablePush, disablePush };
}
