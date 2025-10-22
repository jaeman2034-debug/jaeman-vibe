import React from "react";

type Item = {
  id: string;
  title: string;
  price: number;
  photoUrl?: string;
  district?: string;
  createdAt?: { seconds: number }; // Firestore Timestamp
  status: "selling" | "reserved" | "sold";
};

function timeAgo(seconds?: number) {
  if (!seconds) return "";
  const diff = Date.now() - seconds * 1000;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

export default function MarketItemCard({ item, onClick }: { item: Item; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex gap-3 rounded-xl border border-neutral-200 p-3 hover:shadow-sm cursor-pointer bg-white"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        {item.photoUrl ? (
          <img src={item.photoUrl} alt={item.title} className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="font-semibold truncate">{item.title}</div>
        <div className="mt-1 text-rose-600 font-bold">
          {item.price.toLocaleString()}원
          {item.status === "sold" && <span className="ml-2 text-xs text-neutral-500">(판매완료)</span>}
        </div>
        <div className="mt-1 text-xs text-neutral-500">
          {item.district ?? "KR"} · {timeAgo(item.createdAt?.seconds)}
        </div>
      </div>
    </div>
  );
}
