import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection, query, where, orderBy, limit,
  startAfter, getDocs, QueryConstraint, Timestamp, DocumentData
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Opts = {
  path: string;
  filters?: QueryConstraint[];
  order?: QueryConstraint[];
  pageSize?: number;
};

export function useColQuery<T = DocumentData>({ path, filters = [], order = [], pageSize = 24 }: Opts) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ended, setEnded] = useState(false);
  const lastSnapRef = useRef<any>(null);

  const baseQuery = useMemo(() => {
    return query(
      collection(db, path),
      ...filters,
      ...order,
      limit(pageSize)
    );
  }, [db, path, JSON.stringify(filters), JSON.stringify(order), pageSize]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setEnded(false);
      lastSnapRef.current = null;
      try {
        const snap = await getDocs(baseQuery);
        if (!alive) return;
        const arr = snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
        setItems(arr);
        lastSnapRef.current = snap.docs.at(-1);
        if (snap.docs.length < pageSize) setEnded(true);
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [baseQuery, pageSize]);

  const loadMore = async () => {
    if (ended || loadingMore || !lastSnapRef.current) return;
    setLoadingMore(true);
    try {
      const q2 = query(baseQuery, startAfter(lastSnapRef.current));
      const snap = await getDocs(q2);
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
      setItems(prev => [...prev, ...arr]);
      lastSnapRef.current = snap.docs.at(-1);
      if (snap.docs.length < pageSize) setEnded(true);
    } finally {
      setLoadingMore(false);
    }
  };

  return { items, loading, loadMore, loadingMore, ended };
}
