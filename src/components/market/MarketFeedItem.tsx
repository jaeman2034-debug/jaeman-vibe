import { Link } from "react-router-dom";

function relTime(d?: Date | null) {
  if (!d) return "";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

type Item = {
  id: string;
  title?: string;
  name?: string;
  price?: number;
  region?: string;
  createdAt?: any;
  images?: { url: string }[];
  thumbUrl?: string;
  isSold?: boolean;
};

export default function MarketFeedItem({ it }: { it: Item }) {
  const title = it.title ?? it.name ?? "(제목 없음)";
  const price =
    it.price != null ? `${Number(it.price).toLocaleString()}원` : "가격없음";
  const when = relTime(it.createdAt?.toDate?.() ?? null);
  const region = it.region ?? "근처";
  const src = it.thumbUrl || it.images?.[0]?.url || "/placeholder.svg";

  return (
    <Link
      to={`/app/market/${it.id}`}
      className="flex gap-3 p-4 border-b last:border-b-0 border-neutral-100 dark:border-neutral-800"
    >
      <div className="shrink-0 w-28 h-28 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <img src={src} alt={title} className="thumb" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium leading-snug line-clamp-2">
          {title}
        </div>

        <div className="mt-1 text-xs text-neutral-500">
          <span>📍 {region}</span>
          {when && <span className="before:content-['·'] before:px-1">{when}</span>}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="text-[17px] font-bold">
            {price}
          </div>
          {it.isSold && (
            <span className="px-2 py-0.5 text-xs rounded-md bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              거래완료
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
