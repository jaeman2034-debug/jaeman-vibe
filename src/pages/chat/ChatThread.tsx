import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  getFirestore, collection, query, orderBy, addDoc, serverTimestamp, onSnapshot
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";

export default function ChatThread() {
  const { id } = useParams<{id: string}>();
  const db = getFirestore(app);
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, `chats/${id}/messages`), orderBy("createdAt","asc"));
    return onSnapshot(q, s => {
      setMsgs(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}), 0);
    });
  }, [db, id]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim() || !id) return;
    await addDoc(collection(db, `chats/${id}/messages`), {
      uid: user.uid,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    setText("");
  };

  return (
    <div className="p-3 space-y-3">
      <div className="border rounded p-3 h-[60vh] overflow-auto">
        {msgs.map(m => (
          <div key={m.id} className={`my-1 ${m.uid===user?.uid ? "text-right" : ""}`}>
            <span className="inline-block px-2 py-1 border rounded">{m.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input className="flex-1 h-10 px-3 border rounded" value={text} onChange={e=>setText(e.target.value)} placeholder="메시지 입력..." />
        <button className="h-10 px-4 border rounded">전송</button>
      </form>
    </div>
  );
}
