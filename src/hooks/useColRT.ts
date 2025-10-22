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

  // ???œì¼ ì¤‘ìš”: ?˜ì¡´?±ì„ "ë¬¸ìž????ë¡??ˆì •??
  const key = useMemo(
    () => `${colPath}::${constraints.map(c => (c as any)?.type ?? (c as any)?.constructor?.name ?? "q").join("|")}`,
    [colPath, ...constraints] // constraints ë°°ì—´ ?ì²´ê°€ ë³€?˜ì? ?Šê²Œ ?ìœ„?ì„œ useMemo ?´ë‘ë©???ì¢‹ìŒ
  );

  useEffect(() => {
    // StrictMode 2ë²?ë§ˆìš´??ê°€??
    if (initializedRef.current) return;
    initializedRef.current = true;

    setLoading(true);                       // ì¿¼ë¦¬ ë°”ë€Œë©´ ?¤ì‹œ ë¡œë”© ?œìž‘
    
    const q = constraints.length
      ? query(collection(db, colPath), ...constraints)
      : collection(db, colPath);

    let first = true;
    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        setData(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
        if (first) { setLoading(false); first = false; } // ??ì²??¤ëƒ…?·ì—??ë°˜ë“œ???´ì œ
      },
      (err) => {
        console.error("[useColRT] onSnapshot error:", err);
        setError(err);
        setLoading(false); // ???ëŸ¬?¬ë„ ë°˜ë“œ???´ì œ
      }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // ??keyë§??˜ì¡´

  return { data, loading, error };
}
