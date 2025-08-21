import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getFirestore, collection, getDocs, limit, orderBy, query, startAfter } from "firebase/firestore";

export type GridItem = { id: string; title: string; imageUrl?: string; price?: number; subtitle?: string; href: string };

export default function InfiniteGrid({
  collectionName,
  pageSize = 24,
  whereEquals,
  orderByField = "createdAt",
  orderDirection: "desc" | "asc" = "desc",
}: {
  collectionName: string;
  pageSize?: number;
  whereEquals?: Array<{ field: string; value: any }>;
  orderByField?: string;
  orderDirection?: "desc" | "asc";
}) {
  const [items, setItems] = useState<GridItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const lastDocRef = useRef<any>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  async function loadMore() {
    if (loading || done) return;
    setLoading(true);
    const db = getFirestore();
    const ref = collection(db, collectionName);

    // 기본 정렬: 최신순 (createdAt desc)
    let base: any = query(ref, orderBy(orderByField as any, orderDirection), limit(pageSize));
    (whereEquals || []).forEach((w) => {
      base = query(base, where(w.field as any, "==", w.value));
    });

    const q = lastDocRef.current ? query(base, startAfter(lastDocRef.current)) : base;
    const snap = await getDocs(q);
    if (snap.docs.length === 0) { setDone(true); setLoading(false); return; }
    lastDocRef.current = snap.docs[snap.docs.length - 1];
    const newItems = snap.docs.map((d) => {
      const v = d.data() as any;
      return {
        id: d.id,
        title: v.title || v.name || "Untitled",
        imageUrl: v.imageUrl || v.images?.[0],
        price: v.price,
        subtitle: v.location || v.category || v.tags?.[0],
        href: `/${collectionName}/${d.id}`,
      } as GridItem;
    });
    setItems((prev) => [...prev, ...newItems]);
    setLoading(false);
  }

  useEffect(() => { loadMore(); }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) loadMore(); });
    }, { rootMargin: "600px" });
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [sentinelRef.current]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((it) => (
          <Link key={it.id} to={it.href} className="group block rounded-2xl border overflow-hidden bg-white/70 dark:bg-zinc-950/60">
            <div className="aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
              {it.imageUrl ? (
                <img loading="lazy" src={it.imageUrl} alt={it.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center text-zinc-400">이미지 없음</div>
              )}
            </div>
            <div className="p-3">
              <div className="font-medium line-clamp-1">{it.title}</div>
              <div className="text-sm text-zinc-500 line-clamp-1">
                {it.price != null ? `${it.price.toLocaleString()}원` : it.subtitle || ""}
              </div>
            </div>
          </Link>
        ))}
        {/* 로딩 플레이스홀더 */}
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl border bg-white/60 dark:bg-zinc-950/50 animate-pulse" />
        ))}
      </div>
      <div ref={sentinelRef} />
      {done && items.length === 0 && (
        <div className="text-center text-sm text-zinc-500">표시할 항목이 없습니다.</div>
      )}
    </div>
  );
} 