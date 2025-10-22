// src/hooks/useFirestoreList.ts
import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection, query, where, orderBy, limit, onSnapshot,
  getFirestore, Query, DocumentData
} from "firebase/firestore";
import { db as defaultDb } from "@/lib/firebase";

/**
 * Firestore ë¦¬ìŠ¤??êµ¬ë…??"?ˆì •???˜ì¡´???¼ë¡œë§???ë²ˆì”© ?Œê²Œ ë§Œë“œ????
 * - React StrictMode?ì„œ??ì¤‘ë³µ ë§ˆìš´??ë°©ì?
 * - ?˜ì¡´?±ì? ë°˜ë“œ??"ì¿¼ë¦¬ ?Œë¼ë¯¸í„°"ë§?
 */
export function useFirestoreList<T = DocumentData>(opts: {
  region?: string;
  pageSize?: number;
  db?: ReturnType<typeof getFirestore>;
}) {
  const { region = "KR", pageSize = 20, db = defaultDb } = opts;

  // 1) ì¿¼ë¦¬ ê°ì²´??useMemoë¡?ê³ ì • (?íƒœê°??£ì? ë§?ê²?)
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

  // 2) êµ¬ë…?€ ì¿¼ë¦¬(q)ë§??˜ì¡´
  useEffect(() => {
    // StrictMode 2ë²?ë§ˆìš´??ê°€??
    if (initializedRef.current) return;
    initializedRef.current = true;

    setLoading(true);                       // ì¿¼ë¦¬ ë°”ë€Œë©´ ?¤ì‹œ ë¡œë”© ?œì‘
    
    let first = true;
    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
        if (first) { setLoading(false); first = false; } // ??ì²??¤ëƒ…?·ì—??ë°˜ë“œ???´ì œ
      },
      (err) => {
        console.error("[FS] onSnapshot error:", err);
        setError(err);
        setLoading(false); // ???ëŸ¬?¬ë„ ë°˜ë“œ???´ì œ
      }
    );
    return () => unsub();
  }, [q]);

  return { items, loading, error };
}
