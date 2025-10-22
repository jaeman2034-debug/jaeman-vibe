import { useCallback, useEffect, useRef, useState } from "react";
import { collection, getDocs, limit, orderBy, query, startAfter, where, type DocumentData, type QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, MarketFilters } from "./types";

const PAGE = 24;

export function useMarketProducts(filters: MarketFilters) {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [eof, setEof] = useState(false);
  const lastRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  const buildQuery = useCallback(() => {
    const col = collection(db, "market");
    
    // 간단한 쿼리로 시작 (인덱스 회피)
    const clauses: any[] = [
      limit(PAGE)
    ];
    
    // 기본 필터만 적용 (복합 쿼리 방지)
    if (filters.category) clauses.push(where("category", "==", filters.category));
    if (filters.condition) clauses.push(where("condition", "==", filters.condition));
    
    // 복잡한 필터는 클라이언트에서 처리
    return query(col, ...clauses);
  }, [filters.category, filters.condition]);

  const reset = useCallback(() => {
    lastRef.current = null;
    setItems([]); 
    setEof(false); 
  }, []);

  const load = useCallback(async () => {
    if (loading || eof) return;
    setLoading(true);
    
    try {
      const snap = await getDocs(buildQuery());
      if (snap.docs.length === 0) { 
        setEof(true); 
        return; 
      }
      
      lastRef.current = snap.docs[snap.docs.length - 1];
      
      let batch = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Product[];
      
      // 클라이언트에서 필터링 및 정렬 (인덱스 회피)
      
      // 상태 필터 (marketItems 컬렉션에 맞게 수정)
      batch = batch.filter(p => 
        p.deleted === false && 
        p.isSold === false
      );
      
      // 가격범위 필터
      if (filters.min != null) {
        batch = batch.filter(p => p.price >= filters.min!);
      }
      if (filters.max != null) {
        batch = batch.filter(p => p.price <= filters.max!);
      }
      
      // 지역 필터
      if (filters.region) {
        batch = batch.filter(p => p.region === filters.region);
      }
      
      // 정렬 (createdAt 기준)
      batch.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
        return bTime - aTime; // 최신순
      });
      
      setItems(prev => [...prev, ...batch]);
    } catch (error) {
      console.error("상품 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [buildQuery, loading, eof, filters.min, filters.max, filters.region]);

  useEffect(() => {
    reset();
    load();
  }, [filters]);

  return { items, loading, eof, load, reset };
}