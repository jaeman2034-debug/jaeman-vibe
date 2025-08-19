import type { Product } from "./types";
import { fmtPrice } from "@/lib/format";
import { categoryLabel } from "./categories";

export default function ProductCard({ p, onClick }: { p: Product; onClick?: () => void }) {
  const img = p.images?.[0] ?? "/placeholder.svg";
  return (
    <button onClick={onClick} className="text-left group">
      <div className="rounded-2xl overflow-hidden border bg-white shadow-sm group-hover:shadow-md transition">
        <div className="aspect-[4/3] bg-slate-100">
          <img src={img} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="p-3">
          <div className="text-xs text-slate-500">{categoryLabel(p.category)}</div>
          <div className="font-semibold leading-tight line-clamp-2 mt-0.5">{p.title}</div>
          <div className="mt-1 text-blue-600 font-bold">{fmtPrice(p.price)}</div>
          {p.location?.region && <div className="mt-0.5 text-xs text-slate-500">{p.location.region} {p.location.city ?? ""}</div>}
        </div>
      </div>
    </button>
  );
}