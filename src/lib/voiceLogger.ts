import { addDoc, collection, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export type VoiceLog = {
  ts?: any;
  type: "start" | "stt" | "nlu" | "query" | "results" | "tts" | "error" | "map";
  text?: string;
  tags?: string[];
  resultCount?: number;
  geo?: { lat: number; lng: number };
  meta?: Record<string, any>;
};

export async function ensureSession(sessionId?: string) {
  const uid = auth.currentUser?.uid ?? "anon";
  const id = sessionId ?? `${uid}-${Date.now()}`;
  await setDoc(doc(db, "voiceSessions", id), {
    createdAt: serverTimestamp(),
    createdBy: uid,
    ua: navigator.userAgent,
    device: (navigator as any).userAgentData?.platform ?? null,
  }, { merge: true });
  return id;
}

export async function logVoice(sessionId: string, payload: VoiceLog) {
  const ref = collection(db, "voiceSessions", sessionId, "logs");
  await addDoc(ref, { ...payload, ts: serverTimestamp() });
}
