import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MARKET_CATEGORIES } from "@/features/market/categories";
import useJobs from "../hooks/useJobs";

const JOB_TYPES = [
  { id: "", name: "전체" },
  { id: "fulltime",  name: "정규직" },
  { id: "parttime",  name: "파트타임" },
  { id: "coach",     name: "코치" },
  { id: "referee",   name: "심판" },
  { id: "etc",       name: "기타" },
];

export default function JobListPage() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();

  const region = sp.get("region") || localStorage.getItem("region") || "KR";
  const sport  = sp.get("sport") || "";
  const type   = sp.get("type")  || "";

  const { items, loading, error } = useJobs({
    sport: sport || undefined, region, type: type || undefined,
  });

  const set = (k: string, v?: string) => {
    const n = new URLSearchParams(sp);
    if (!v) n.delete(k); else n.set(k, v);
    setSp(n, { replace: true });
  };

  const cats = useMemo(() => [{ id: "", name: "전체" }, ...MARKET_CATEGORIES], []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">구인 · 구직</h1>
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

        <select
          value={type}
          onChange={e => set("type", e.target.value || undefined)}
          className="ml-auto rounded-lg border px-3 py-1.5"
        >
          {JOB_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <button onClick={() => nav("/jobs/new")} className="rounded-lg border px-3 py-1.5">공고 등록</button>
      </div>

      {loading && <div>불러오는 중...</div>}
      {error && <div className="text-red-500">오류가 발생했습니다.</div>}
      {!loading && items.length === 0 && <div>공고가 없습니다.</div>}

      <ul className="space-y-2">
        {items.map(j => (
          <li key={j.id} className="rounded-xl border bg-white p-4 hover:shadow cursor-pointer"
              onClick={() => nav(`/jobs/${j.id}`)}>
            <div className="text-sm text-gray-400">{j.sport} · {j.region} · {j.type}</div>
            <div className="font-semibold text-lg">{j.title}</div>
            {j.pay && <div className="text-sm text-gray-500">{j.pay}</div>}
            {j.contact && <div className="text-xs text-gray-400 mt-1">{j.contact}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}