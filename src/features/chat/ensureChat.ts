import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp,
  collection, addDoc, query, where, getDocs, limit
} from "firebase/firestore";
import { app } from "@/lib/firebase";

export type EnsureChatParams = {
  itemId: string;
  itemTitle: string;
  itemThumb?: string | null;
  sellerUid: string;
  buyerUid: string;   // 현재 로그인 유저
};

export async function ensureChat(p: EnsureChatParams): Promise<string> {
  const db = getFirestore(app);

  // 1) 이미 존재하는지(아이템+멤버 조합) 간단 조회
  const q = query(
    collection(db, "chats"),
    where("itemId", "==", p.itemId),
    where("members", "array-contains", p.buyerUid),
    limit(5)
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find(d => {
    const m = d.data()?.members || [];
    return m.includes(p.sellerUid) && m.includes(p.buyerUid);
  });
  if (existing) return existing.id;

  // 2) 없으면 생성
  const chatRef = doc(collection(db, "chats"));
  await setDoc(chatRef, {
    itemId: p.itemId,
    itemTitle: p.itemTitle,
    itemThumb: p.itemThumb ?? null,
    sellerUid: p.sellerUid,
    buyerUid: p.buyerUid,
    members: [p.sellerUid, p.buyerUid],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: "채팅을 시작했어요.",
    lastSenderUid: p.buyerUid,
  });

  // 3) 시스템 웰컴 메시지
  await addDoc(collection(chatRef, "messages"), {
    text: "문의 채팅을 시작했어요.",
    senderUid: p.buyerUid,
    type: "text",
    createdAt: serverTimestamp(),
  });

  return chatRef.id;
}