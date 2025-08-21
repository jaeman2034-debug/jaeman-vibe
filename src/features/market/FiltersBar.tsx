import { useEffect, useState } from "react";
import type { MarketFilters } from "./types";
import { flattenCategories, categoryTree } from "./categories";

const catOptions = flattenCategories(categoryTree);

export default function FiltersBar({ value, onChange }: { value: MarketFilters; onChange: (v: MarketFilters) => void }) {
  const [local, setLocal] = useState<MarketFilters>(value);
  useEffect(() => setLocal(value), [value]);

  return (
    <div className="rounded-2xl border bg-white p-3 md:p-4 shadow-sm">
      <div className="grid gap-2 md:grid-cols-[1fr_220px_160px_160px_160px]">
        <input
          value={local.q}
          onChange={e => setLocal({ ...local, q: e.target.value })}
          placeholder="검색어 (예: 글러브, 배트)"
          className="rounded-xl border px-3 py-2 bg-white"
        />
        <select
          value={local.category ?? ""}
          onChange={e => setLocal({ ...local, category: e.target.value || null })}
          className="rounded-xl border px-3 py-2 bg-white"
        >
          <option value="">전체 카테고리</option>
          {catOptions.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
        <select
          value={local.condition ?? ""}
          onChange={e => setLocal({ ...local, condition: (e.target.value || null) as any })}
          className="rounded-xl border px-3 py-2 bg-white"
        >
          <option value="">전체 상태</option>
          <option value="new">새상품</option>
          <option value="like-new">거의 새것</option>
          <option value="good">양호</option>
          <option value="fair">보통</option>
        </select>
        <div className="flex gap-2">
          <input
            inputMode="numeric" placeholder="최소가"
            value={local.min ?? ""}
            onChange={e => setLocal({ ...local, min: e.target.value ? Number(e.target.value.replace(/\D/g,"")) : null })}
            className="w-full rounded-xl border px-3 py-2 bg-white"
          />
          <input
            inputMode="numeric" placeholder="최대가"
            value={local.max ?? ""}
            onChange={e => setLocal({ ...local, max: e.target.value ? Number(e.target.value.replace(/\D/g,"")) : null })}
            className="w-full rounded-xl border px-3 py-2 bg-white"
          />
        </div>
        <select
          value={local.sort}
          onChange={e => setLocal({ ...local, sort: e.target.value as any })}
          className="rounded-xl border px-3 py-2 bg-white"
        >
          <option value="latest">최신순</option>
          <option value="price-low">가격 낮은순</option>
          <option value="price-high">가격 높은순</option>
        </select>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button onClick={() => onChange(local)} className="rounded-xl bg-blue-600 text-white px-4 py-2">적용</button>
        <button
          onClick={() => onChange({ q:"", category:null, min:null, max:null, condition:null, sort:"latest" })}
          className="rounded-xl border px-4 py-2"
        >초기화</button>
      </div>
    </div>
  );
} 