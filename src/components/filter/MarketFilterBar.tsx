import { useQueryParam, useSetQuery } from "@/lib/useQuery";

const SORTS = [
  { key: "new",  label: "최신순" },
  { key: "priceAsc",  label: "가격↑" },
  { key: "priceDesc", label: "가격↓" },
] as const;

export default function MarketFilterBar() {
  const sort = useQueryParam("sort", "new");
  const priceMin = useQueryParam("priceMin", "");
  const priceMax = useQueryParam("priceMax", "");
  const setQuery = useSetQuery();

  return (
    <div className="mb-3 flex flex-wrap items-end gap-2">
      <div className="flex items-center gap-1">
        {SORTS.map(s => (
          <button
            key={s.key}
            onClick={() => setQuery({ sort: s.key })}
            className={
              "px-3 py-1.5 rounded-xl border text-sm " +
              (sort === s.key
                ? "bg-black text-white border-black"
                : "bg-white/70 dark:bg-white/10 border-gray-200/70 dark:border-white/10 hover:opacity-90")
            }
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <label className="text-xs text-gray-500">가격</label>
        <input
          className="w-24 px-2 py-1 rounded-lg border text-sm"
          placeholder="최소"
          value={priceMin}
          onChange={(e) => setQuery({ priceMin: e.target.value })}
        />
        <span className="text-xs text-gray-400">~</span>
        <input
          className="w-24 px-2 py-1 rounded-lg border text-sm"
          placeholder="최대"
          value={priceMax}
          onChange={(e) => setQuery({ priceMax: e.target.value })}
        />
        <button className="px-3 py-1.5 rounded-xl border text-sm"
          onClick={() => setQuery({ priceMin: "", priceMax: "" })}
        >초기화</button>
      </div>
    </div>
  );
}