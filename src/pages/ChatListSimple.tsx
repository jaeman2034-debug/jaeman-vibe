// ??Firestore ?¤ì‹œê°?ì±„íŒ…ë°?ë¡œë”© ?•ìƒ??ë²„ì „
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
      console.warn("? ï¸ ë¡œê·¸?¸ë˜ì§€ ?ŠìŒ: ì±„íŒ… ëª©ë¡ ?œì‹œ ë¶ˆê?");
      setLoading(false);
      return;
    }

    // ??chats ì»¬ë ‰??ê²½ë¡œ ?•í™•??ì§€??    const q = query(collection(db, "chats"), orderBy("lastMessageAt", "desc"));

    // ???¤ì‹œê°??¤ëƒ…??êµ¬ë…
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChats(data);
        setLoading(false);
        console.log("??ì±„íŒ…ë°?ë¡œë”© ?±ê³µ:", data.length, "ê°?);
      },
      (error) => {
        console.error("??Firestore ?ëŸ¬:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, auth]);

  if (loading) return <p>?’¬ ì±„íŒ…ë°©ì„ ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>;

  if (chats.length === 0)
    return <p>?“­ ?±ë¡??ì±„íŒ…ë°©ì´ ?†ìŠµ?ˆë‹¤.</p>;

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-xl font-semibold mb-3">?’¬ ì±„íŒ…ë°?ëª©ë¡</h2>
      {chats.map((chat) => (
        <div
          key={chat.id}
          className="border rounded-lg p-3 hover:bg-gray-100 cursor-pointer"
        >
          <p className="font-medium">{chat.productTitle || "?œëª© ?†ìŒ"}</p>
          <p className="text-sm text-gray-500">
            ë§ˆì?ë§?ë©”ì‹œì§€: {chat.lastMessage || "?†ìŒ"}
          </p>
        </div>
      ))}
    </div>
  );
}
