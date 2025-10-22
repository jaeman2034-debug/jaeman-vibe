import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import type { JobPost } from "../types";

export default function JobDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [item, setItem] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, "jobs", id));
      setItem(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) }) : null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-4">불러오는 중...</div>;
  if (!item) return <div className="p-4">존재하지 않는 공고입니다.</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <button onClick={() => nav(-1)} className="mb-4 rounded-lg border px-3 py-1.5">뒤로</button>
      <h1 className="text-2xl font-bold">{item.title}</h1>
      <p className="text-sm text-gray-500 mt-1">{item.sport} · {item.region} · {item.type}</p>
      {item.pay && <div className="mt-3">급여: {item.pay}</div>}
      {item.contact && <div className="mt-1 text-sm text-gray-600">연락: {item.contact}</div>}
    </div>
  );
}