// ??ê°„ë‹¨??ì±„íŒ… ?ŒìŠ¤???˜ì´ì§€
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
        console.log("??ë¡œê·¸?¸ëœ ?¬ìš©??", user.uid);
      } else {
        console.log("? ï¸ ë¡œê·¸?¸ë˜ì§€ ?ŠìŒ");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    console.log("?” ì±„íŒ…ë°?ëª©ë¡ ë¡œë”© ?œì‘ - ?¬ìš©??", user.uid);

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
        console.error("?¤ë¥˜ ì½”ë“œ:", error.code);
        console.error("?¤ë¥˜ ë©”ì‹œì§€:", error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, db]);

  if (!user) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">?”</div>
        <h2 className="text-xl font-semibold mb-2">ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??/h2>
        <p className="text-gray-600">ì±„íŒ… ëª©ë¡??ë³´ë ¤ë©?ë¡œê·¸?¸í•´ì£¼ì„¸??</p>
      </div>
    );
  }

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p>?’¬ ì±„íŒ…ë°©ì„ ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
    </div>
  );

  if (chats.length === 0)
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">?“­</div>
        <h2 className="text-xl font-semibold mb-2">?±ë¡??ì±„íŒ…ë°©ì´ ?†ìŠµ?ˆë‹¤</h2>
        <p className="text-gray-600">?í’ˆ ?ì„¸ ?˜ì´ì§€?ì„œ ?ë§¤?ì—ê²??°ë½?´ë³´?¸ìš”!</p>
      </div>
    );

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-xl font-semibold mb-3">?’¬ ì±„íŒ…ë°?ëª©ë¡ ({chats.length}ê°?</h2>
      {chats.map((chat) => (
        <div
          key={chat.id}
          className="border rounded-lg p-3 hover:bg-gray-100 cursor-pointer"
        >
          <p className="font-medium">{chat.productTitle || "?œëª© ?†ìŒ"}</p>
          <p className="text-sm text-gray-500">
            ë§ˆì?ë§?ë©”ì‹œì§€: {chat.lastMessage || "?†ìŒ"}
          </p>
          <p className="text-xs text-gray-400">
            ì°¸ì—¬?? {chat.participants?.join(", ") || "?†ìŒ"}
          </p>
        </div>
      ))}
    </div>
  );
}
