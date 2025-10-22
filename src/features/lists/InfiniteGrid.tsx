import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, limit, orderBy, query, startAfter, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type GridItem = {
  id: string;
  title: string;
  imageUrl?: string;
  price?: number;
  subtitle?: string;
  href: string;
};

type Props = {
  collectionName: string;
  pageSize?: number;
  whereEquals?: Array<{ field: string; value: any }>;
  orderByField?: string;
  orderDirection?: "desc" | "asc";
};

export default function InfiniteGrid({
  collectionName,
  pageSize = 24,
  whereEquals,
  orderByField = "createdAt",
  orderDirection = "desc",
}: Props) {
  const [items, setItems] = useState<GridItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const lastDocRef = useRef<any>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  async function loadMore() {
    if (loading || done) return;
    setLoading(true);
    
    try {
      const ref = collection(db, collectionName);
      
      // 간단한 쿼리로 시작 (인덱스 회피)
      let base: any = query(ref, limit(pageSize));
      
      // where 조건을 클라이언트에서 처리 (인덱스 회피)
      const snap = await getDocs(base);
      let filteredDocs = snap.docs;
      
      // market 컬렉션에 대한 기본 필터 적용
      if (collectionName === 'market') {
        filteredDocs = filteredDocs.filter(doc => {
          const data = doc.data();
          return data.deleted === false && data.isSold === false;
        });
      }
      
      // where 조건을 클라이언트에서 적용
      if (whereEquals && whereEquals.length > 0) {
        filteredDocs = filteredDocs.filter(doc => {
          const data = doc.data();
          return whereEquals.every(w => data[w.field] === w.value);
        });
      }
      
      // 정렬을 클라이언트에서 처리 (인덱스 회피)
      filteredDocs.sort((a, b) => {
        const aValue = a.data()[orderByField];
        const bValue = b.data()[orderByField];
        
        if (orderByField === 'createdAt') {
          const aTime = aValue?.toMillis?.() || aValue || 0;
          const bTime = bValue?.toMillis?.() || bValue || 0;
          return orderDirection === 'desc' ? bTime - aTime : aTime - bTime;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return orderDirection === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return orderDirection === 'desc' ? bValue - aValue : aValue - aValue;
        }
        
        return 0;
      });
      
      // 페이지네이션 처리
      if (lastDocRef.current) {
        const lastDocIndex = filteredDocs.findIndex(doc => doc.id === lastDocRef.current.id);
        if (lastDocIndex !== -1) {
          filteredDocs = filteredDocs.slice(lastDocIndex + 1);
        }
      }
      
      // 페이지 크기 제한
      filteredDocs = filteredDocs.slice(0, pageSize);
      
      if (filteredDocs.length === 0) {
        setDone(true);
        setLoading(false);
        return;
      }
      
      lastDocRef.current = filteredDocs[filteredDocs.length - 1];
      
      const newItems = filteredDocs.map((d) => {
        const v = d.data() as any;
        const src =
          v.thumbUrl ??
          v.images?.[0]?.url ??
          '/placeholder.png';
        
        // 디버깅: 콘솔에 아이템 정보 출력
        console.log('[InfiniteGrid] item data:', {
          id: d.id,
          title: v.title,
          thumbUrl: v.thumbUrl,
          images: v.images,
          finalSrc: src
        });
        
        return {
          id: d.id,
          title: v.title || v.name || "Untitled",
          imageUrl: src,
          price: v.price,
          subtitle: v.location || v.category || v.tags?.[0],
          href: `/${collectionName}/${d.id}`,
        } as GridItem;
      });
      
      setItems((prev) => [...prev, ...newItems]);
    } catch (error) {
      console.warn('InfiniteGrid loadMore failed:', error);
      // 에러가 발생해도 로딩 상태는 해제
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMore();
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) loadMore();
      });
    }, { rootMargin: "600px" });
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [sentinelRef.current]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((it) => (
          <Link key={it.id} to={it.href} className="group block rounded-2xl border overflow-hidden bg-white/70 dark:bg-zinc-950/60">
            <img
              src={it.imageUrl}
              alt={it.title ?? '상품 이미지'}
              className="block w-full h-40 object-cover"
              loading="lazy"
              onError={(e) => {
                console.log('[InfiniteGrid] 이미지 로드 실패:', it.imageUrl);
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
            <div className="p-3">
              <div className="font-medium line-clamp-1">{it.title}</div>
              <div className="text-sm text-zinc-500 line-clamp-1">
                {it.price != null ? `${it.price.toLocaleString()}원` : it.subtitle || ""}
              </div>
            </div>
          </Link>
        ))}
        {/* 로딩 스켈레톤 */}
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