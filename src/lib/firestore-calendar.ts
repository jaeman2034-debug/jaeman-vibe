import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface CalendarEvent {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type?: "team" | "academy" | "tournament" | "other";
  location?: string;
  description?: string;
  createdBy?: string;
  color?: string;
  teamId?: string;
}

const COLLECTION = "schedules";

/**
 * ?�정 ?�성
 */
export async function createSchedule(event: Omit<CalendarEvent, "id">) {
  const docData = {
    ...event,
    start: Timestamp.fromDate(event.start),
    end: Timestamp.fromDate(event.end),
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, COLLECTION), docData);
  console.log("??Schedule created:", docRef.id);
  return docRef.id;
}

/**
 * ?�정 ?�정
 */
export async function updateSchedule(id: string, event: Partial<CalendarEvent>) {
  const docRef = doc(db, COLLECTION, id);
  const updateData: any = { ...event };
  
  if (event.start) {
    updateData.start = Timestamp.fromDate(event.start);
  }
  if (event.end) {
    updateData.end = Timestamp.fromDate(event.end);
  }
  
  updateData.updatedAt = serverTimestamp();
  
  await updateDoc(docRef, updateData);
  console.log("??Schedule updated:", id);
}

/**
 * ?�정 ??��
 */
export async function deleteSchedule(id: string) {
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
  console.log("??Schedule deleted:", id);
}

/**
 * ?��??�정 ?�시�?구독
 */
export function subscribeSchedules(
  teamId: string | null,
  callback: (events: CalendarEvent[]) => void
) {
  let q;
  
  if (teamId) {
    q = query(collection(db, COLLECTION), where("teamId", "==", teamId));
  } else {
    // ?�체 ?�정 조회 (관리자)
    q = query(collection(db, COLLECTION));
  }

  return onSnapshot(q, (snapshot) => {
    const events: CalendarEvent[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "",
        start: data.start?.toDate() || new Date(),
        end: data.end?.toDate() || new Date(),
        allDay: data.allDay || false,
        type: data.type || "other",
        location: data.location || "",
        description: data.description || "",
        createdBy: data.createdBy || "",
        color: data.color || "#3b82f6",
        teamId: data.teamId || "",
      };
    });
    
    callback(events);
  });
}

/**
 * ?�스???�이???�성
 */
export async function seedDemoSchedules() {
  const base = new Date();
  base.setHours(10, 0, 0, 0);

  await createSchedule({
    title: "?�흘FC60 ?�련",
    allDay: false,
    start: base,
    end: new Date(base.getTime() + 2 * 60 * 60 * 1000),
    type: "team",
    location: "?�천종합?�동??,
    createdBy: "system",
    color: "#3b82f6",
    teamId: "soheul60",
  });

  await createSchedule({
    title: "U-12 ?�카?��? ?�슨",
    allDay: false,
    start: new Date(base.getTime() + 24 * 60 * 60 * 1000),
    end: new Date(base.getTime() + 26 * 60 * 60 * 1000),
    type: "academy",
    location: "?�흘구장 A",
    createdBy: "system",
    color: "#8b5cf6",
    teamId: "academy",
  });

  await createSchedule({
    title: "모비?�배 ?�선",
    allDay: true,
    start: new Date(base.getTime() + 3 * 24 * 60 * 60 * 1000),
    end: new Date(base.getTime() + 4 * 24 * 60 * 60 * 1000),
    type: "tournament",
    location: "?�천B",
    createdBy: "system",
    color: "#f59e0b",
  });

  console.log("??Demo schedules created!");
}

