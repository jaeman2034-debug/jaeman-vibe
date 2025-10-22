import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getFirestore, doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp, getDoc
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";

type Msg = {
  id: string;
  text: string;
  senderUid: string;
  createdAt?: any;
};

export default function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const db = getFirestore(app);

  const [title, setTitle] = useState<string>("채팅");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const boxRef = useRef<HTMLDivElement | null>(null);

  // 상단 타이틀용 채팅/아이템 정보
  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "chats", id), (d) => {
      const data = d.data();
      setTitle(data?.itemTitle ?? "채팅");
    });
    return () => unsub();
  }, [db, id]);

  // 메시지 스트림
  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "chats", id, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const arr: Msg[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setMsgs(arr);
      setTimeout(() => boxRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }), 0);
    });
    return () => unsub();
  }, [db, id]);

  const send = async () => {
    if (!id || !user || !text.trim()) return;
    await addDoc(collection(db, "chats", id, "messages"), {
      text: text.trim(),
      senderUid: user.uid,
      type: "text",
      createdAt: serverTimestamp(),
    });
    setText("");
    setTimeout(() => boxRef.current?.scrollTo({ top: 1e9 }), 0);
  };

  return (
    <main className="max-w-screen-md mx-auto h-[calc(100dvh-0px)] flex flex-col">
      <header className="px-4 py-3 border-b text-lg font-semibold">{title}</header>

      <div ref={boxRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-2 bg-slate-50">
        {msgs.map(m => {
          const mine = m.senderUid === user?.uid;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`px-3 py-2 rounded-2xl max-w-[70%] text-sm
                 ${mine ? "bg-orange-500 text-white" : "bg-white border"}`}>
                {m.text}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t flex gap-2">
        <input
          value={text}
          onChange={(e)=>setText(e.target.value)}
          onKeyDown={(e)=> e.key==="Enter" && send()}
          placeholder="메시지를 입력하세요"
          className="flex-1 border rounded-xl px-3 py-2"
        />
        <button onClick={send} className="px-4 py-2 rounded-xl bg-black text-white">전송</button>
      </div>
    </main>
  );
}
