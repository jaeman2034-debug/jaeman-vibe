import { Link } from "react-router-dom";

export default function MarketItem({ it }: { it: any }) {
  const name = it.title ?? it.name ?? it.id;
  const price = it.price != null ? `${it.price.toLocaleString()}원` : "가격없음";
  const createdAt = it.createdAt?.toDate?.() ?? it.createdAt ?? null;

  return (
    <Link to={`/app/market/${it.id}`} className="flex items-center gap-3 p-3 border rounded hover:bg-muted">
      {it.thumbnailUrl ? (
        <img src={it.thumbnailUrl} alt={name} className="w-12 h-12 object-cover rounded" />
      ) : (
        <div className="w-12 h-12 rounded bg-secondary" />
      )}
      <div className="flex-1">
        <div className="font-medium">{name}</div>
        <div className="text-sm text-muted-foreground">{price}</div>
      </div>
      <div className="text-xs text-muted-foreground">
        {createdAt ? new Intl.DateTimeFormat('ko-KR',{month:'2-digit',day:'2-digit'}).format(createdAt) : null}
      </div>
    </Link>
  );
}
