import type { Product } from "./types";
import { fmtPrice } from "@/lib/format";
import { categoryLabel } from "./categories";

export default function ProductCard({ p, onClick }: { p: Product; onClick?: () => void }) {
  // 카드에서 커버 선택 (안전한 폴백 체인)
  const src =
    p?.thumbUrl ??
    p?.images?.[0]?.url ??
    '/placeholder.png';
  
  // 디버깅: 콘솔에 아이템 정보 출력
  console.log('[ProductCard] item data:', {
    id: p.id,
    title: p.title,
    thumbUrl: p?.thumbUrl,
    images: p?.images,
    finalSrc: src
  });

  return (
    <button onClick={onClick} className="text-left group">
      <article className="rounded-2xl overflow-hidden border bg-white shadow-sm group-hover:shadow-md transition">
        <img
          src={src}
          alt={p.title ?? '상품 이미지'}
          className="block w-full h-40 object-cover"
          loading="lazy"
          onError={(e) => {
            console.log('[ProductCard] 이미지 로드 실패:', src);
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
        <div className="p-3">
          <div className="text-xs text-slate-500">{categoryLabel(p.category)}</div>
          <div className="font-semibold leading-tight line-clamp-2 mt-0.5">{p.title}</div>
          <div className="mt-1 text-blue-600 font-bold">{fmtPrice(p.price)}</div>
          {p.location?.region && <div className="mt-0.5 text-xs text-slate-500">{p.location.region} {p.location.city ?? ""}</div>}
        </div>
      </article>
    </button>
  );
}