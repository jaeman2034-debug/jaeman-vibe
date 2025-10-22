import {
  getFirestore, collection, query, where, limit, getDocs,
  addDoc, serverTimestamp, updateDoc, doc
} from "firebase/firestore";

export async function ensureOpenReservation(db: ReturnType<typeof getFirestore>, p: {
  productId: string; productName: string; sellerUid: string; buyerUid: string; priceAt?: number; chatId?: string;
}) {
  const q = query(
    collection(db, "reservations"),
    where("productId","==", p.productId),
    where("members","array-contains", p.buyerUid),
    limit(10)
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find(d => {
    const x = d.data();
    return x.members?.includes(p.sellerUid)
      && ["requested","confirmed"].includes(x.status);
  });
  if (existing) return { id: existing.id, data: existing.data() };

  const ref = await addDoc(collection(db,"reservations"), {
    productId: p.productId,
    productName: p.productName,
    sellerUid: p.sellerUid,
    buyerUid: p.buyerUid,
    members: [p.sellerUid, p.buyerUid],
    status: "requested",
    priceAt: p.priceAt ?? null,
    chatId: p.chatId ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, data: null };
}

export async function setReservationStatus(db: ReturnType<typeof getFirestore>, id: string, next: "confirmed"|"completed"|"canceled") {
  const ref = doc(db, "reservations", id);
  const base: any = { status: next, updatedAt: serverTimestamp() };
  if (next === "confirmed") base.confirmedAt = serverTimestamp();
  if (next === "completed") base.completedAt = serverTimestamp();
  if (next === "canceled")  base.canceledAt  = serverTimestamp();
  await updateDoc(ref, base);
}
