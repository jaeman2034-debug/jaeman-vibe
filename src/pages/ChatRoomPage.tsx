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
      
      // 채팅방의 lastMessage ?�데?�트
      await updateDoc(doc(db, "chats", roomId), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      });
      
      setText("");
    } catch (error) {
      console.error("??메시지 ?�송 ?�패:", error);
      alert("메시지 ?�송???�패?�습?�다.");
    }
  };

  // ProtectedRoute가 로그??체크�?처리?��?�??�기?�는 ?�거

  return (
    <div className="flex flex-col h-[100vh] bg-gray-50">
      {/* ?�단 ?�더 */}
      <div className="bg-white shadow p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/chatlist")}
            className="text-gray-600 hover:text-gray-800 transition"
          >
            ??          </button>
          <div>
            <h1 className="text-lg font-bold">?�� 채팅�?/h1>
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {user?.email || "?�명"}
        </span>
      </div>

      {/* 채팅 메시지 ?�역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">?��</div>
            <p>?�직 메시지가 ?�습?�다.</p>
            <p className="text-sm">�?메시지�?보내보세??</p>
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
                }) || "?�송 �?.."}
              </p>
            </div>
          ))
        )}
      </div>

      {/* ?�력�?*/}
      <div className="p-3 bg-white border-t flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지�??�력?�세??
          className="flex-1 border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          ?�송
        </button>
      </div>
    </div>
  );
}
