import { auth, app } from "@/firebase";
import { addDoc, collection, serverTimestamp, getFirestore } from "firebase/firestore";

const db = getFirestore(app);

export async function saveChatLog(userText: string, botText: string) {
      // db는 이미 위에서 정의됨
  const uid = auth.currentUser?.uid ?? "anon";
  // 로그인 사용자는 users/{uid}/chats, 비로그인은 공용 chats
  const col = uid === "anon" ? collection(db, "chats") : collection(db, "users", uid, "chats");
  await addDoc(col, { uid, userText, botText, ts: serverTimestamp() });
} 