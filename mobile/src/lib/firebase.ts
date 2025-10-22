// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import Constants from "expo-constants";

// Expo ?섍꼍?먯꽌 Firebase ?ㅼ젙 媛?몄삤湲?const firebaseConfig = (Constants.expoConfig?.extra as any)?.firebase || {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};

// Firebase ??珥덇린??const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firestore ?몄뒪?댁뒪 ?대낫?닿린
export const db = getFirestore(app);

// ?뚯꽦 濡쒓퉭 ?좏떥由ы떚 (??踰꾩쟾怨??숈씪??援ъ“)
export type VoiceLog = {
  ts?: any;
  type: "start" | "stt" | "nlu" | "query" | "results" | "tts" | "error" | "map";
  text?: string;
  tags?: string[];
  resultCount?: number;
  geo?: { lat: number; lng: number };
  meta?: Record<string, any>;
};

import { addDoc, collection, serverTimestamp, setDoc, doc } from "firebase/firestore";

export async function ensureSession(sessionId?: string) {
  const uid = "mobile-user"; // 紐⑤컮?쇱뿉?쒕뒗 媛꾨떒?섍쾶 泥섎━
  const id = sessionId ?? `mobile-${uid}-${Date.now()}`;
  await setDoc(doc(db, "voiceSessions", id), {
    createdAt: serverTimestamp(),
    createdBy: uid,
    platform: "mobile",
    device: "react-native",
  }, { merge: true });
  return id;
}

export async function logVoice(sessionId: string, payload: VoiceLog) {
  const ref = collection(db, "voiceSessions", sessionId, "logs");
  await addDoc(ref, { ...payload, ts: serverTimestamp() });
}
