import { useEffect, useState } from "react";
import { onSnapshot, Query } from "firebase/firestore";

export function useColQueryRT<T = any>(q: Query | null | undefined) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    // 쿼리가 없으면 즉시 로딩 해제
    setLoading(true);

    // 쿼리가 없으면 구독 취소가 불가능하므로 즉시 해제하고 빈 결과 반환
    if (!q) {
      setData([]);
      setLoading(false);
      return;
    }

    let first = true;
    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        const next = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setData(prev => {
          // 얕은 비교로 동일 결과 세트면 setState 생략 → 재렌더 루프 방지
          if (prev.length === next.length && prev.every((p, i) => p.id === next[i].id)) return prev;
          return next;
        });
        if (first) { setLoading(false); first = false; }
      },
      (err) => { setError(err); setLoading(false); }
    );
    return () => unsub();
  }, [q]); // 의존성은 쿼리만

  return { data, loading, error };
}