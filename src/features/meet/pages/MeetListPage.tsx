import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MARKET_CATEGORIES } from "@/features/market/categories";
import useMeetings from "../hooks/useMeetings";

export default function MeetListPage() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();

  const region = sp.get("region") || localStorage.getItem("region") || "KR";
  const sport  = sp.get("sport") || "";  // cat id
  const dateFrom = sp.get("from") || new Date().toISOString().slice(0, 10);

  const { items, loading, error } = useMeetings({ sport: sport || undefined, region, dateFrom });

  const set = (k: string, v?: string) => {
    const n = new URLSearchParams(sp);
    if (!v) n.delete(k); else n.set(k, v);
    setSp(n, { replace: true });
  };

  const cats = useMemo(() => [{ id: "", name: "전체" }, ...MARKET_CATEGORIES], []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">모임</h1>
        <p className="text-sm text-gray-500">지역: {region}</p>
      </header>

      <div className="flex flex-wrap gap-2 mb-4">
        {cats.map(c => (
          <button key={c.id}
            onClick={() => set("sport", c.id || undefined)}
            className={`px-3 py-1.5 rounded-full border ${sport===c.id ? "bg-blue-600 text-white" : "bg-white"}`}>
            {c["emoji"] ?? ""} {c.name}
          </button>
        ))}
        <input
          type="date" value={dateFrom}
          onChange={e => set("from", e.target.value)}
          className="ml-auto rounded-lg border px-3 py-1.5"
        />
        <button onClick={() => nav("/meet/new")} className="rounded-lg border px-3 py-1.5">모임 만들기</button>
      </div>

      {loading && <div>불러오는 중...</div>}
      {error && <div className="text-red-500">오류가 발생했습니다.</div>}
      {!loading && items.length === 0 && <div>모임이 없습니다.</div>}

      <ul className="space-y-2">
        {items.map(m => (
          <li key={m.id} className="rounded-xl border bg-white p-4 hover:shadow cursor-pointer"
              onClick={() => nav(`/meet/${m.id}`)}>
            <div className="text-sm text-gray-400">{m.sport} · {m.region}</div>
            <div className="font-semibold text-lg">{m.title}</div>
            <div className="text-sm text-gray-500">{m.date}{m.time ? ` ${m.time}` : ""} · {m.place || "-"}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}