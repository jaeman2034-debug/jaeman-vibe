// ??Firestore ?�시�?채팅�?로딩 ?�상??버전
import { useEffect, useState } from "react";
import { getFirestore, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function ChatListSimple() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      console.warn("?�️ 로그?�되지 ?�음: 채팅 목록 ?�시 불�?");
      setLoading(false);
      return;
    }

    // ??chats 컬렉??경로 ?�확??지??    const q = query(collection(db, "chats"), orderBy("lastMessageAt", "desc"));

    // ???�시�??�냅??구독
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChats(data);
        setLoading(false);
        console.log("??채팅�?로딩 ?�공:", data.length, "�?);
      },
      (error) => {
        console.error("??Firestore ?�러:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, auth]);

  if (loading) return <p>?�� 채팅방을 불러?�는 �?..</p>;

  if (chats.length === 0)
    return <p>?�� ?�록??채팅방이 ?�습?�다.</p>;

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-xl font-semibold mb-3">?�� 채팅�?목록</h2>
      {chats.map((chat) => (
        <div
          key={chat.id}
          className="border rounded-lg p-3 hover:bg-gray-100 cursor-pointer"
        >
          <p className="font-medium">{chat.productTitle || "?�목 ?�음"}</p>
          <p className="text-sm text-gray-500">
            마�?�?메시지: {chat.lastMessage || "?�음"}
          </p>
        </div>
      ))}
    </div>
  );
}
