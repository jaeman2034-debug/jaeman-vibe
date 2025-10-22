import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export async function join(eventId: string) {
  const call = httpsCallable(functions, "joinEvent");
  try {
    const res: any = await call({ eventId });
    return res.data;
  } catch (e: any) {
    console.error("[joinEvent] fail:", {
      code: e.code, message: e.message, details: e.details, name: e.name, stack: e.stack
    });
    throw e; // UI에서 code/message 표시
  }
}

export async function leave(eventId: string) {
  const call = httpsCallable(functions, "leaveEvent");
  try {
    const res: any = await call({ eventId });
    return res.data;
  } catch (e: any) {
    console.error("[leaveEvent] fail:", {
      code: e.code, message: e.message, details: e.details, name: e.name, stack: e.stack
    });
    throw e; // UI에서 code/message 표시
  }
}
