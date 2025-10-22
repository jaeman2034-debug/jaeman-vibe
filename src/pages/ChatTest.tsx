// ??간단??채팅 ?�스???�이지
import { useEffect, useState } from "react";
import { getFirestore, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function ChatTest() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        console.log("??로그?�된 ?�용??", user.uid);
      } else {
        console.log("?�️ 로그?�되지 ?�음");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    console.log("?�� 채팅�?목록 로딩 ?�작 - ?�용??", user.uid);

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
        console.error("?�류 코드:", error.code);
        console.error("?�류 메시지:", error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, db]);

  if (!user) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">?��</div>
        <h2 className="text-xl font-semibold mb-2">로그?�이 ?�요?�니??/h2>
        <p className="text-gray-600">채팅 목록??보려�?로그?�해주세??</p>
      </div>
    );
  }

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p>?�� 채팅방을 불러?�는 �?..</p>
    </div>
  );

  if (chats.length === 0)
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">?��</div>
        <h2 className="text-xl font-semibold mb-2">?�록??채팅방이 ?�습?�다</h2>
        <p className="text-gray-600">?�품 ?�세 ?�이지?�서 ?�매?�에�??�락?�보?�요!</p>
      </div>
    );

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-xl font-semibold mb-3">?�� 채팅�?목록 ({chats.length}�?</h2>
      {chats.map((chat) => (
        <div
          key={chat.id}
          className="border rounded-lg p-3 hover:bg-gray-100 cursor-pointer"
        >
          <p className="font-medium">{chat.productTitle || "?�목 ?�음"}</p>
          <p className="text-sm text-gray-500">
            마�?�?메시지: {chat.lastMessage || "?�음"}
          </p>
          <p className="text-xs text-gray-400">
            참여?? {chat.participants?.join(", ") || "?�음"}
          </p>
        </div>
      ))}
    </div>
  );
}
