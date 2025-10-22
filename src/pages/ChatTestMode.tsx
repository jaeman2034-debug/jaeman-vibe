// ?”§ ?ŒìŠ¤??ëª¨ë“œ: ë¡œê·¸???†ì´??ì±„íŒ…ë°??ŒìŠ¤??ê°€??import { useEffect, useState } from "react";
import { getFirestore, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function ChatTestMode() {
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
        console.log("? ï¸ ë¡œê·¸?¸ë˜ì§€ ?ŠìŒ - ?ŒìŠ¤??ëª¨ë“œë¡?ì§„í–‰");
        // ?”§ ?ŒìŠ¤??ëª¨ë“œ: ë¡œê·¸?????˜ì–´ ?ˆì–´???µê³¼
        setChats([
          { 
            id: "demo-1", 
            productTitle: "?ŒìŠ¤???í’ˆ 1", 
            lastMessage: "?ˆë…•?˜ì„¸?? ?í’ˆ??ê´€?¬ì´ ?ˆì–´??,
            participants: ["demo-user-1", "demo-user-2"]
          },
          { 
            id: "demo-2", 
            productTitle: "?ŒìŠ¤???í’ˆ 2", 
            lastMessage: "ê°€ê²??‘ìƒ ê°€?¥í•œê°€??",
            participants: ["demo-user-1", "demo-user-3"]
          }
        ]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    console.log("?” ì±„íŒ…ë°?ëª©ë¡ ë¡œë”© ?œì‘ - ?¬ìš©??", user.uid);

    // ???¤ì œ Firestore?ì„œ ?°ì´??ê°€?¸ì˜¤ê¸?    const q = query(collection(db, "chats"), orderBy("lastMessageAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChats(data);
        setLoading(false);
        console.log("???¤ì œ ì±„íŒ…ë°?ë¡œë”© ?±ê³µ:", data.length, "ê°?);
      },
      (error) => {
        console.error("??Firestore ?ëŸ¬:", error);
        console.error("?¤ë¥˜ ì½”ë“œ:", error.code);
        console.error("?¤ë¥˜ ë©”ì‹œì§€:", error.message);
        
        // ?ëŸ¬ ë°œìƒ ???°ëª¨ ?°ì´?°ë¡œ ?´ë°±
        setChats([
          { 
            id: "error-demo", 
            productTitle: "Firestore ?°ê²° ?¤ë¥˜", 
            lastMessage: "?¤ì œ ?°ì´?°ë? ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤",
            participants: ["error-user"]
          }
        ]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, db]);

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p>?’¬ ì±„íŒ…ë°©ì„ ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
    </div>
  );

  return (
    <div className="p-4 space-y-2">
      <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 mb-4">
        <div className="flex items-center">
          <span className="text-yellow-600 text-xl mr-2">? ï¸</span>
          <div>
            <h3 className="font-semibold text-yellow-800">?ŒìŠ¤??ëª¨ë“œ</h3>
            <p className="text-sm text-yellow-700">
              {user ? "?¤ì œ Firestore ?°ì´?? : "?°ëª¨ ?°ì´???œì‹œ ì¤?}
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-3">
        ?’¬ ì±„íŒ…ë°?ëª©ë¡ ({chats.length}ê°?
      </h2>
      
      {chats.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">?“­</div>
          <p className="text-gray-600">?±ë¡??ì±„íŒ…ë°©ì´ ?†ìŠµ?ˆë‹¤</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="border rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">
                    {chat.productTitle || "?œëª© ?†ìŒ"}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    ë§ˆì?ë§?ë©”ì‹œì§€: {chat.lastMessage || "?†ìŒ"}
                  </p>
                  <p className="text-xs text-gray-400">
                    ì°¸ì—¬?? {chat.participants?.join(", ") || "?†ìŒ"}
                  </p>
                </div>
                <div className="ml-4">
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">?”§ ?ŒìŠ¤???•ë³´</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>??ë¡œê·¸???íƒœ: {user ? `??${user.email}` : "??ë¡œê·¸???ˆë¨"}</li>
          <li>??Firestore ?°ê²°: {user ? "?¤ì œ ?°ì´?? : "?°ëª¨ ?°ì´??}</li>
          <li>???ë??ˆì´?? http://127.0.0.1:54011/firestore</li>
        </ul>
      </div>
    </div>
  );
}
