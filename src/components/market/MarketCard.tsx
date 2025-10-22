import { Link } from "react-router-dom";
import { fmtDistance, distanceKm } from "@/lib/geo";
import { timeAgoFrom } from "@/lib/timeAgo";

type Item = {
  id: string;
  title?: string;
  name?: string;
  price?: number;
  thumbUrl?: string;
  images?: { url: string }[];
  createdAt?: any; // Timestamp
  place?: { name?: string; region?: string; lat?: number; lng?: number };
};

export default function MarketCard({
  item,
  myCoords, // {lat,lng} | null
}: {
  item: Item;
  myCoords?: { lat: number; lng: number } | null;
}) {
  const name = item.title ?? item.name ?? "이름 없음";
  const img = item.thumbUrl ?? item.images?.[0]?.url ?? "/placeholder.png";
  const price =
    item.price != null ? `${item.price.toLocaleString()}원` : "가격없음";

  const dt = item.createdAt?.toDate?.() ?? null;
  const when = timeAgoFrom(dt);

  let dist: string | null = null;
  if (
    myCoords &&
    item.place?.lat != null &&
    item.place?.lng != null
  ) {
    const km = distanceKm(myCoords, {
      lat: item.place.lat!,
      lng: item.place.lng!,
    });
    dist = fmtDistance(km);
  }

  const metaRegion = item.place?.region ?? "KR";
  const metaDong = item.place?.name ?? "알 수 없음";

  return (
    <Link
      to={`/app/market/${item.id}`}
      className="block rounded-2xl border bg-white hover:bg-muted/40 transition-colors"
    >
      <div className="flex gap-4 p-4">
        <div className="shrink-0">
          <div className="w-28 h-28 rounded-xl overflow-hidden border bg-muted">
            <img
              src={img}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-base font-medium leading-snug line-clamp-2">
            {name}
          </div>
          <div className="mt-2 text-xl font-extrabold">{price}</div>
          <div className="mt-2 text-xs text-muted-foreground">
            {metaRegion} · {metaDong}
            {dist && ` · ${dist}`}
            {when && ` · ${when}`}
          </div>
        </div>
      </div>
    </Link>
  );
}