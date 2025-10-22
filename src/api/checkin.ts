import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export async function createCheckinNonce(eventId: string, ttlSec = 7200) {
  const call = httpsCallable(functions, "createCheckinNonce");
  const { data }: any = await call({ eventId, ttlSec });
  return data as { ok: boolean; nonce: string; expAt: number };
}

export async function checkinCall(eventId: string, nonce: string) {
  const call = httpsCallable(functions, "checkin");
  const { data }: any = await call({ eventId, nonce });
  return data as { ok: boolean };
}
