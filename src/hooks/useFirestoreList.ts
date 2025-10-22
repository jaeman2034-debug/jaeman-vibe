// src/hooks/useFirestoreList.ts
import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection, query, where, orderBy, limit, onSnapshot,
  getFirestore, Query, DocumentData
} from "firebase/firestore";
import { db as defaultDb } from "@/lib/firebase";

/**
 * Firestore 리스??구독??"?�정???�존???�로�???번씩 ?�게 만드????
 * - React StrictMode?�서??중복 마운??방�?
 * - ?�존?��? 반드??"쿼리 ?�라미터"�?
 */
export function useFirestoreList<T = DocumentData>(opts: {
  region?: string;
  pageSize?: number;
  db?: ReturnType<typeof getFirestore>;
}) {
  const { region = "KR", pageSize = 20, db = defaultDb } = opts;

  // 1) 쿼리 객체??useMemo�?고정 (?�태�??��? �?�?)
  const q: Query = useMemo(() => {
    return query(
      collection(db, "products"),
      where("region", "==", region),
      where("published", "==", true),
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );
  }, [db, region, pageSize]);

  const initializedRef = useRef(false);
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  // 2) 구독?� 쿼리(q)�??�존
  useEffect(() => {
    // StrictMode 2�?마운??가??
    if (initializedRef.current) return;
    initializedRef.current = true;

    setLoading(true);                       // 쿼리 바뀌면 ?�시 로딩 ?�작
    
    let first = true;
    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
        if (first) { setLoading(false); first = false; } // ??�??�냅?�에??반드???�제
      },
      (err) => {
        console.error("[FS] onSnapshot error:", err);
        setError(err);
        setLoading(false); // ???�러?�도 반드???�제
      }
    );
    return () => unsub();
  }, [q]);

  return { items, loading, error };
}
