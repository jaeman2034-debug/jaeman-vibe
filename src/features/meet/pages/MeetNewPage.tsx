import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MARKET_CATEGORIES } from "@/features/market/categories";

export default function MeetNewPage() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [sport, setSport] = useState(MARKET_CATEGORIES[0].id);
  const [region] = useState(localStorage.getItem("region") || "KR");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("19:00");
  const [place, setPlace] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert("제목을 입력해주세요");
    const ref = await addDoc(collection(db, "meetings"), {
      title, sport, region, date, time, place,
      createdAt: serverTimestamp(),
    });
    // 생성 후 해당 카테고리 필터로 이동
    nav(`/meet?sport=${encodeURIComponent(sport)}&region=${encodeURIComponent(region)}`);
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">모임 만들기</h1>
      <form onSubmit={submit} className="space-y-3">
        <input 
          className="w-full rounded-lg border px-3 py-2" 
          placeholder="제목"
          value={title} 
          onChange={e => setTitle(e.target.value)} 
        />
        <select 
          className="w-full rounded-lg border px-3 py-2"
          value={sport} 
          onChange={e => setSport(e.target.value)}
        >
          {MARKET_CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input 
            type="date" 
            className="rounded-lg border px-3 py-2"
            value={date} 
            onChange={e => setDate(e.target.value)} 
          />
          <input 
            type="time" 
            className="rounded-lg border px-3 py-2"
            value={time} 
            onChange={e => setTime(e.target.value)} 
          />
        </div>
        <input 
          className="w-full rounded-lg border px-3 py-2" 
          placeholder="장소(선택)"
          value={place} 
          onChange={e => setPlace(e.target.value)} 
        />
        <button 
          type="submit"
          className="rounded-lg bg-blue-600 text-white px-4 py-2 w-full"
        >
          등록
        </button>
        <button 
          type="button" 
          className="rounded-lg border px-4 py-2 w-full" 
          onClick={() => nav(-1)}
        >
          취소
        </button>
      </form>
    </div>
  );
}