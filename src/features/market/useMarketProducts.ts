import { useCallback, useEffect, useRef, useState } from "react";
import { collection, getDocs, limit, orderBy, query, startAfter, where, type DocumentData, type QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import type { Product, MarketFilters } from "./types";

const PAGE = 24;

export function useMarketProducts(filters: MarketFilters) {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [eof, setEof] = useState(false);
  const lastRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  const buildQuery = useCallback(() => {
    const col = collection(db, "products");
    const clauses: any[] = [where("status", "in", ["active", "reserved", "sold"])];

    if (filters.category) clauses.push(where("category", "==", filters.category));
    if (filters.condition) clauses.push(where("condition", "==", filters.condition));
    if (filters.min != null) clauses.push(where("price", ">=", filters.min));
    if (filters.max != null) clauses.push(where("price", "<=", filters.max));

    const hasPriceRange = filters.min != null || filters.max != null;

    if (filters.sort === "latest") {
      if (hasPriceRange) {
        // 🔧 price 범위를 쓰는 순간, 첫 orderBy는 price가 와야 함
        clauses.push(orderBy("price", "asc"));       // 또는 "desc" 취향대로
        clauses.push(orderBy("createdAt", "desc"));  // 2차 정렬로 최신
      } else {
        clauses.push(orderBy("createdAt", "desc"));
      }
    } else if (filters.sort === "price-low") {
      clauses.push(orderBy("price", "asc"));
    } else if (filters.sort === "price-high") {
      clauses.push(orderBy("price", "desc"));
    }

    clauses.push(limit(PAGE));
    if (lastRef.current) clauses.push(startAfter(lastRef.current));

    return query(col, ...clauses);
  }, [filters]);

  const reset = useCallback(() => {
    lastRef.current = null;
    setItems([]); setEof(false);
  }, []);

  const load = useCallback(async () => {
    if (loading || eof) return;
    setLoading(true);
    try {
      const snap = await getDocs(buildQuery());
      if (snap.docs.length === 0) { setEof(true); return; }
      lastRef.current = snap.docs[snap.docs.length - 1];
      let batch = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Product[];

      if (filters.q.trim()) {
        const ql = filters.q.trim().toLowerCase();
        batch = batch.filter(p => p.title?.toLowerCase().includes(ql));
      }
      setItems(prev => [...prev, ...batch]);
    } finally { setLoading(false); }
  }, [buildQuery, filters.q, loading, eof]);

  useEffect(() => { reset(); }, [filters, reset]);

  return { items, loading, eof, load, reset };
} 