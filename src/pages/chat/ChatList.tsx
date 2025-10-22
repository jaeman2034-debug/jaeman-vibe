import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { app } from "@/lib/firebase";
import {
  getFirestore, collection, query, where, onSnapshot, orderBy
} from "firebase/firestore";

type Chat = {
  id: string;
  itemTitle?: string;
  itemThumb?: string | null;
  updatedAt?: any;
};

export default function ChatList() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Chat[]>([]);

  useEffect(() => {
    if (!user) return;
    const db = getFirestore(app);
    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", user.uid),
      orderBy("updatedAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setRows(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, [user]);

  return (
    <main className="max-w-screen-md mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold mb-4">채팅</h1>
      <div className="space-y-3">
        {rows.map(r => (
          <Link key={r.id} to={`/chat/${r.id}`} className="flex gap-3 border rounded-2xl p-3 hover:bg-muted">
            <img src={r.itemThumb ?? "/placeholder.png"} className="w-16 h-16 rounded-xl object-cover border" />
            <div className="flex-1">
              <div className="font-semibold">{r.itemTitle ?? "상품"}</div>
              <div className="text-sm text-muted-foreground">최근 대화로 이동</div>
            </div>
          </Link>
        ))}
        {rows.length === 0 && <div className="text-muted-foreground">채팅이 없습니다.</div>}
      </div>
    </main>
  );
}
