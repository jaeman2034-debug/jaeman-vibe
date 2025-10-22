// ?§© ChatList ?”ë²„ê·?ë²„ì „ (ë¡œê·¸???°ë™ + ?ë™ ?„í„°ë§?
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
      console.log("??[ChatList] ë¡œê·¸???¬ìš©??", user?.uid);

      if (!user) {
        alert("ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??");
        navigate("/");
        return;
      }

      try {
        console.log("?”¥ Firestore ì¿¼ë¦¬ ?œì‘...");
        const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
        const querySnapshot = await getDocs(q);

        const chatData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("?“¦ ì±„íŒ… ?°ì´??", chatData);
        setChats(chatData);
      } catch (error) {
        console.error("??ì±„íŒ… ?°ì´??ë¡œë“œ ?¤íŒ¨:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 text-lg">
        ì±„íŒ…ë°©ì„ ë¶ˆëŸ¬?¤ëŠ” ì¤?..
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <h3 className="font-semibold text-blue-800 mb-1">?”§ ?”ë²„ê·?ëª¨ë“œ</h3>
        <p className="text-sm text-blue-700">
          ë¡œê·¸???¬ìš©?? {auth.currentUser?.uid || "?†ìŒ"}
        </p>
        <p className="text-sm text-blue-700">
          ì±„íŒ…ë°?ê°œìˆ˜: {chats.length}ê°?        </p>
      </div>

      <h1 className="text-2xl font-bold mb-4 text-center">?’¬ ??ì±„íŒ…ë°?/h1>
      {chats.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">?“­</div>
          <p className="text-gray-500">?„ì§ ì°¸ì—¬ ì¤‘ì¸ ì±„íŒ…ë°©ì´ ?†ìŠµ?ˆë‹¤.</p>
          <p className="text-sm text-gray-400 mt-2">
            ?í’ˆ ?ì„¸ ?˜ì´ì§€?ì„œ ?ë§¤?ì—ê²??°ë½?´ë³´?¸ìš”!
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
              <p className="font-semibold">{chat.productTitle || chat.title || "?œëª© ?†ìŒ"}</p>
              <p className="text-sm text-gray-500">{chat.lastMessage || "ë©”ì‹œì§€ ?†ìŒ"}</p>
              <p className="text-xs text-gray-400 mt-1">
                ì°¸ì—¬?? {chat.participants?.join(", ") || "?†ìŒ"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
