import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!roomId) return;
    const q = query(
      collection(db, "chats", roomId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setMessages(list);
    });
    return () => unsub();
  }, [roomId]);

  const sendMessage = async () => {
    if (!text.trim() || !user || !roomId) return;
    
    try {
      await addDoc(collection(db, "chats", roomId, "messages"), {
        text,
        sender: user.uid,
        createdAt: serverTimestamp(),
      });
      
      // ì±„íŒ…ë°©ì˜ lastMessage ?…ë°?´íŠ¸
      await updateDoc(doc(db, "chats", roomId), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      });
      
      setText("");
    } catch (error) {
      console.error("??ë©”ì‹œì§€ ?„ì†¡ ?¤íŒ¨:", error);
      alert("ë©”ì‹œì§€ ?„ì†¡???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    }
  };

  // ProtectedRouteê°€ ë¡œê·¸??ì²´í¬ë¥?ì²˜ë¦¬?˜ë?ë¡??¬ê¸°?œëŠ” ?œê±°

  return (
    <div className="flex flex-col h-[100vh] bg-gray-50">
      {/* ?ë‹¨ ?¤ë” */}
      <div className="bg-white shadow p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/chatlist")}
            className="text-gray-600 hover:text-gray-800 transition"
          >
            ??          </button>
          <div>
            <h1 className="text-lg font-bold">?’¬ ì±„íŒ…ë°?/h1>
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {user?.email || "?µëª…"}
        </span>
      </div>

      {/* ì±„íŒ… ë©”ì‹œì§€ ?ì—­ */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">?’¬</div>
            <p>?„ì§ ë©”ì‹œì§€ê°€ ?†ìŠµ?ˆë‹¤.</p>
            <p className="text-sm">ì²?ë©”ì‹œì§€ë¥?ë³´ë‚´ë³´ì„¸??</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.sender === user?.uid
                  ? "ml-auto bg-blue-500 text-white"
                  : "mr-auto bg-gray-200 text-gray-800"
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <p className="text-xs opacity-70 mt-1">
                {msg.createdAt?.toDate?.()?.toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit"
                }) || "?„ì†¡ ì¤?.."}
              </p>
            </div>
          ))
        )}
      </div>

      {/* ?…ë ¥ì°?*/}
      <div className="p-3 bg-white border-t flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="ë©”ì‹œì§€ë¥??…ë ¥?˜ì„¸??
          className="flex-1 border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          ?„ì†¡
        </button>
      </div>
    </div>
  );
}
