// src/hooks/useColRT.ts
import { useEffect, useMemo, useState, useRef } from "react";
import { collection, onSnapshot, query, QueryConstraint } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useColRT<T = any>(
  colPath: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const initializedRef = useRef(false);

  // ???�일 중요: ?�존?�을 "문자????�??�정??
  const key = useMemo(
    () => `${colPath}::${constraints.map(c => (c as any)?.type ?? (c as any)?.constructor?.name ?? "q").join("|")}`,
    [colPath, ...constraints] // constraints 배열 ?�체가 변?��? ?�게 ?�위?�서 useMemo ?�두�???좋음
  );

  useEffect(() => {
    // StrictMode 2�?마운??가??
    if (initializedRef.current) return;
    initializedRef.current = true;

    setLoading(true);                       // 쿼리 바뀌면 ?�시 로딩 ?�작
    
    const q = constraints.length
      ? query(collection(db, colPath), ...constraints)
      : collection(db, colPath);

    let first = true;
    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        setData(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
        if (first) { setLoading(false); first = false; } // ??�??�냅?�에??반드???�제
      },
      (err) => {
        console.error("[useColRT] onSnapshot error:", err);
        setError(err);
        setLoading(false); // ???�러?�도 반드???�제
      }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // ??key�??�존

  return { data, loading, error };
}
