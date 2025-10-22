import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MARKET_CATEGORIES } from "@/features/market/categories";

const TYPES = [
  { id: "fulltime",  name: "정규직" },
  { id: "parttime",  name: "파트타임" },
  { id: "coach",     name: "코치" },
  { id: "referee",   name: "심판" },
  { id: "etc",       name: "기타" },
];

export default function JobNewPage() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [sport, setSport] = useState(MARKET_CATEGORIES[0].id);
  const [region] = useState(localStorage.getItem("region") || "KR");
  const [type, setType] = useState(TYPES[0].id);
  const [pay, setPay] = useState("");
  const [contact, setContact] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert("제목을 입력해주세요.");
    await addDoc(collection(db, "jobs"), {
      title, sport, region, type, pay, contact,
      createdAt: serverTimestamp(),
    });
    nav(`/jobs?sport=${encodeURIComponent(sport)}&region=${encodeURIComponent(region)}&type=${encodeURIComponent(type)}`);
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">공고 등록</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full rounded-lg border px-3 py-2" placeholder="제목"
               value={title} onChange={e=>setTitle(e.target.value)} />
        <select className="w-full rounded-lg border px-3 py-2"
                value={sport} onChange={e=>setSport(e.target.value)}>
          {MARKET_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>
        <select className="w-full rounded-lg border px-3 py-2"
                value={type} onChange={e=>setType(e.target.value)}>
          {TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input className="w-full rounded-lg border px-3 py-2" placeholder="급여(옵션) 예: 시급 15,000원"
               value={pay} onChange={e=>setPay(e.target.value)} />
        <input className="w-full rounded-lg border px-3 py-2" placeholder="연락처/링크(옵션)"
               value={contact} onChange={e=>setContact(e.target.value)} />
        <button className="rounded-lg bg-blue-600 text-white px-4 py-2 w-full">등록</button>
        <button type="button" className="rounded-lg border px-4 py-2 w-full" onClick={()=>nav(-1)}>취소</button>
      </form>
    </div>
  );
}