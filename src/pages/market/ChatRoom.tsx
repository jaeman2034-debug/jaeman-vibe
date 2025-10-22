import React, { useEffect, useState, useRef } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import app from "../../lib/firebase";

interface ChatRoomProps {
  chatId: string;
  currentUser: string;
  targetUser: string;
  onClose: () => void;
}

export default function ChatRoom({ chatId, currentUser, targetUser, onClose }: ChatRoomProps) {
  const db = getFirestore(app);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ???¤ì‹œê°?ë©”ì‹œì§€ ?˜ì‹ 
  useEffect(() => {
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setMessages(list);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [chatId]);

  // ??ë©”ì‹œì§€ ?„ì†¡
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: message,
      sender: currentUser,
      receiver: targetUser,
      createdAt: serverTimestamp(),
    });
    setMessage("");
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white shadow-xl rounded-xl flex flex-col border border-gray-200">
      <div className="bg-[#FF7E36] text-white p-3 flex justify-between items-center rounded-t-xl">
        <h3 className="font-semibold">?’¬ {targetUser} ?˜ê³¼??ì±„íŒ…</h3>
        <button onClick={onClose} className="text-sm text-white/80 hover:text-white">??/button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 h-64">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender === currentUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`rounded-lg px-3 py-2 text-sm max-w-[70%] ${
                m.sender === currentUser
                  ? "bg-[#FF7E36] text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-2 border-t flex items-center space-x-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="ë©”ì‹œì§€ ?…ë ¥..."
          className="flex-1 border rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-[#FF7E36]"
        />
        <button
          type="submit"
          className="bg-[#FF7E36] text-white text-sm px-3 py-1 rounded-lg hover:bg-[#ff6716]"
        >
          ?„ì†¡
        </button>
      </form>
    </div>
  );
}
