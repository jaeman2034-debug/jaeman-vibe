import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import type { Meeting } from "../types";

export default function MeetDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [item, setItem] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, "meetings", id));
      setItem(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) }) : null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-4">불러오는 중...</div>;
  if (!item) return <div className="p-4">존재하지 않는 모임입니다.</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <button onClick={() => nav(-1)} className="mb-4 rounded-lg border px-3 py-1.5">뒤로</button>
      <h1 className="text-2xl font-bold">{item.title}</h1>
      <p className="text-sm text-gray-500 mt-1">{item.sport} · {item.region}</p>
      <div className="mt-3 text-gray-700">
        <div>일시: {item.date}{item.time ? ` ${item.time}` : ""}</div>
        <div>장소: {item.place || "-"}</div>
      </div>
    </div>
  );
}