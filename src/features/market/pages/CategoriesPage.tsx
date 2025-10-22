import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MARKET_CATEGORIES } from "../categories";

export default function CategoriesPage() {
  const nav = useNavigate();

  // 지역을 로컬스토리지에서 읽어 반영(기본값 KR)
  const region = useMemo(() => localStorage.getItem("region") || "KR", []);

  const onSelect = (catId: string) => {
    // 마켓 목록으로 이동(필터 쿼리)
    nav(`/market?cat=${encodeURIComponent(catId)}&region=${encodeURIComponent(region)}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">카테고리</h1>
        <p className="text-sm text-gray-500 mt-1">지역: {region}</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {MARKET_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="rounded-2xl border bg-white px-4 py-5 text-left shadow-sm hover:shadow-md transition"
            aria-label={`${c.name} 카테고리로 이동`}
          >
            <div className="text-2xl mb-2">{c.emoji ?? "📦"}</div>
            <div className="font-medium">{c.name}</div>
            <div className="text-xs text-gray-400 mt-1">#{c.id}</div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <button onClick={() => nav(-1)} className="rounded-xl px-4 py-2 border">
          뒤로
        </button>
        <button onClick={() => nav("/app/market")} className="rounded-xl px-4 py-2 border">
          마켓 전체 보기
        </button>
      </div>
    </div>
  );
}