// src/hooks/useFirestoreQuery.ts
import { useEffect, useMemo, useState, useRef } from "react";
import type { Query, DocumentData, Unsubscribe } from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";

export function useFirestoreQuery<T = DocumentData>(
  buildQuery: () => Query<T>,
  deps: any[] = []
) {
  // 쿼리 객체??참조가 ?�정?�이?�야 ??
  const q = useMemo(buildQuery, deps);
  
  // ??StrictMode 가?? ?�펙??중복 ?�행 방�?
  const initRef = useRef(false);

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    // ??StrictMode?�서 ??번째 마운??무시
    if (initRef.current) return;
    initRef.current = true;
    
    setLoading(true);
    setError(null);

    let first = true;
    const unsub: Unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        setData(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
        if (first) { setLoading(false); first = false; } // ??�??�냅?�에??반드???�제
      },
      (e) => {
        console.error("[fs] snapshot error", e);
        setError(e);
        setLoading(false); // ???�러?�도 반드???�제
      }
    );

    // ⬅️ ?�구??방�?: 반드???�린??반환
    return () => {
      initRef.current = false; // ?�린????가??리셋
      unsub();
    };
  }, [q]);

  return { data, loading, error };
}
