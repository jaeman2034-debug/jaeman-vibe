// src/features/market/status.ts
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type ListingStatus = "selling" | "reserved" | "sold";

export async function setListingStatus(itemId: string, status: ListingStatus) {
  // isSold는 하위호환용(이전 코드에서 참조 가능)
  await updateDoc(doc(db, "market", itemId), {
    status,
    isSold: status === "sold",
    updatedAt: serverTimestamp(),
  });
}
