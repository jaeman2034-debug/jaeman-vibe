import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { MessageCircle } from "lucide-react";

export default function ChatListPage() {
  const [chats, setChats] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setChats(list);
    });
    return () => unsub();
  }, [user?.uid]);

  // ProtectedRouteê°€ ë¡œê·¸??ì²´í¬ë¥?ì²˜ë¦¬?˜ë?ë¡??¬ê¸°?œëŠ” ?œê±°

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?¤ë” */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-blue-500" />
              ?’¬ ??ì±„íŒ… ëª©ë¡
            </h1>
            <button
              onClick={() => navigate("/market")}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              ë§ˆì¼“?¼ë¡œ
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {chats.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">?„ì§ ?€???´ì—­???†ìŠµ?ˆë‹¤.</p>
            <p className="text-gray-400 text-sm mb-6">
              ?í’ˆ??êµ¬ê²½?˜ê³  ?ë§¤?ì—ê²?ë¬¸ì˜?´ë³´?¸ìš”!
            </p>
            <button
              onClick={() => navigate("/market")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              ë§ˆì¼“ ?˜ëŸ¬ë³´ê¸°
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200"
                onClick={() => navigate(`/chat/${chat.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {chat.lastMessage || "?€?”ë? ?œì‘?´ë³´?¸ìš”."}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      ìµœê·¼ ?…ë°?´íŠ¸:{" "}
                      {chat.updatedAt?.toDate
                        ? chat.updatedAt.toDate().toLocaleString("ko-KR")
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
