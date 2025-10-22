// ?�� ChatList ?�버�?버전 (로그???�동 + ?�동 ?�터�?
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export default function ChatListDebug() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChats = async () => {
      const user = auth.currentUser;
      console.log("??[ChatList] 로그???�용??", user?.uid);

      if (!user) {
        alert("로그?�이 ?�요?�니??");
        navigate("/");
        return;
      }

      try {
        console.log("?�� Firestore 쿼리 ?�작...");
        const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
        const querySnapshot = await getDocs(q);

        const chatData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("?�� 채팅 ?�이??", chatData);
        setChats(chatData);
      } catch (error) {
        console.error("??채팅 ?�이??로드 ?�패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 text-lg">
        채팅방을 불러?�는 �?..
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <h3 className="font-semibold text-blue-800 mb-1">?�� ?�버�?모드</h3>
        <p className="text-sm text-blue-700">
          로그???�용?? {auth.currentUser?.uid || "?�음"}
        </p>
        <p className="text-sm text-blue-700">
          채팅�?개수: {chats.length}�?        </p>
      </div>

      <h1 className="text-2xl font-bold mb-4 text-center">?�� ??채팅�?/h1>
      {chats.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">?��</div>
          <p className="text-gray-500">?�직 참여 중인 채팅방이 ?�습?�다.</p>
          <p className="text-sm text-gray-400 mt-2">
            ?�품 ?�세 ?�이지?�서 ?�매?�에�??�락?�보?�요!
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {chats.map((chat) => (
            <li
              key={chat.id}
              onClick={() => navigate(`/chat/${chat.productId || chat.id}`)}
              className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
            >
              <p className="font-semibold">{chat.productTitle || chat.title || "?�목 ?�음"}</p>
              <p className="text-sm text-gray-500">{chat.lastMessage || "메시지 ?�음"}</p>
              <p className="text-xs text-gray-400 mt-1">
                참여?? {chat.participants?.join(", ") || "?�음"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
