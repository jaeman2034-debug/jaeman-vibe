import { useEffect, useState } from "react";
import { getFirestore, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";

export type RecItem = {
  id: string;
  title: string;
  price?: number;
  imageUrl?: string;
  href?: string;
  subtitle?: string; // 지역/태그 등
};

async function fetchRecs(collectionName: string, max = 6): Promise<RecItem[]> {
  const db = getFirestore();
  try {
    const ref = collection(db, collectionName);
    const q = query(ref, orderBy("createdAt", "desc"), limit(max));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => {
      const v = d.data() as any;
      return {
        id: d.id,
        title: v.title || v.name || "Untitled",
        price: typeof v.price === "number" ? v.price : undefined,
        imageUrl: v.imageUrl || v.images?.[0],
        href: v.href || `/${collectionName}/${d.id}`,
        subtitle: v.location || v.category || v.tags?.[0],
      } satisfies RecItem;
    });
    return items;
  } catch (e) {
    // 컬렉션이 없을 때를 위해 안전한 더미 반환
    return [];
  }
}

export default function RecommendGrid({ title, collectionName, to }: { title: string; collectionName: string; to: string }) {
  const [items, setItems] = useState<RecItem[] | null>(null);
  useEffect(() => {
    fetchRecs(collectionName).then(setItems);
  }, [collectionName]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Link to={to} className="text-sm font-medium hover:underline">더보기</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {(items ?? Array.from({ length: 6 })).map((it: any, i) => (
          <Card key={it?.id ?? i} item={it ?? undefined} />
        ))}
      </div>
    </section>
  );
}

function Card({ item }: { item?: RecItem }) {
  if (!item) return <div className="aspect-square rounded-2xl border bg-white/60 dark:bg-zinc-950/50 animate-pulse" />;
  return (
    <Link to={item.href || "#"} className="group block rounded-2xl border overflow-hidden bg-white/70 dark:bg-zinc-950/60">
      <div className="aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center text-zinc-400">이미지 없음</div>
        )}
      </div>
      <div className="p-3">
        <div className="font-medium line-clamp-1">{item.title}</div>
        <div className="text-sm text-zinc-500 line-clamp-1">
          {item.price != null ? `${item.price.toLocaleString()}원` : item.subtitle || ""}
        </div>
      </div>
    </Link>
  );
} 