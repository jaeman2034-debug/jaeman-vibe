import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { MarketFilters } from "./types";
import { useMarketProducts } from "./useMarketProducts";
import { useDebounced } from "@/hooks/useDebounced";
import FiltersBar from "./FiltersBar";
import ProductCard from "./ProductCard";

export default function MarketPage() {
  const [filters, setFilters] = useState<MarketFilters>({ q:"", category:null, min:null, max:null, condition:null, sort:"latest" });
  const debounced = useDebounced(filters, 300);
  const { items, loading, eof, load, reset } = useMarketProducts(debounced);

  useEffect(() => { reset(); }, [debounced, reset]);
  useEffect(() => { load(); }, [debounced, load]);

  useEffect(() => {
    const onScroll = () => {
      if (loading || eof) return;
      const nearBottom = window.innerHeight + window.scrollY > document.body.offsetHeight - 400;
      if (nearBottom) load();
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading, eof, load]);

  const countLabel = useMemo(() => (items?.length ?? 0) + (eof ? "" : "+"), [items, eof]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl font-bold">스포츠 마켓</h1>
        <Link 
          to="/market/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          상품 등록
        </Link>
      </div>
      <FiltersBar value={filters} onChange={setFilters} />
      <div className="mt-4 text-sm text-slate-600">검색 결과 <b>{countLabel}</b> 건</div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map(p => <ProductCard key={p.id} p={p} onClick={()=>{/* TODO: 상세 이동 */}} />)}
        {loading && <SkeletonMany />}
      </div>

      {!loading && items.length === 0 && <EmptyState />}

      {!eof && !loading && (
        <div className="mt-6 flex justify-center">
          <button onClick={load} className="rounded-xl border px-4 py-2">더 보기</button>
        </div>
      )}
    </div>
  );
}

function SkeletonMany() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl overflow-hidden border bg-white">
          <div className="aspect-[4/3] bg-slate-100" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-slate-100 rounded" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
            <div className="h-4 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </>
  );
}
function EmptyState() {
  return (
    <div className="mt-16 text-center text-slate-500">
      조건에 맞는 상품이 없습니다.
      <div className="mt-2 text-sm">필터를 변경해 보세요.</div>
    </div>
  );
} 