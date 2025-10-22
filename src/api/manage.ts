import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export async function setEventStatus(eventId: string, status: "open"|"closed") {
  const call = httpsCallable(functions, "setEventStatus");
  const { data }: any = await call({ eventId, status }); 
  return data;
}

export async function pinNotice(eventId: string, title: string, body: string) {
  const call = httpsCallable(functions, "pinNotice");
  const { data }: any = await call({ eventId, title, body }); 
  return data;
}

export async function kickAttendee(eventId: string, targetUid: string, reason?: string) {
  const call = httpsCallable(functions, "kickAttendee");
  const { data }: any = await call({ eventId, targetUid, reason }); 
  return data;
}
