import { useEffect, useState } from "react";
import {
  collection, query, where, orderBy, limit, onSnapshot,
  getFirestore, QueryConstraint, DocumentData
} from "firebase/firestore";
import { app } from "@/lib/firebase";

type Item = { id: string } & DocumentData;

export function useActiveProductsKR(opts?: {
  max?: number;
  category?: string | null;
  text?: string | null;
  includeSold?: boolean;
}) {
  const max = opts?.max ?? 50;
  const category = opts?.category ?? null;
  const text = (opts?.text ?? "").trim().toLowerCase();
  const includeSold = !!opts?.includeSold;
  const db = getFirestore(app);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cons: QueryConstraint[] = [];
    // 필요할 때만 판매완료 제외
    if (!includeSold) cons.push(where("isSold", "==", false));
    if (category) cons.push(where("category", "==", category));
    cons.push(orderBy("createdAt", "desc"), limit(max));

    const q = query(collection(db, "market"), ...cons);

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        // 최초 캐시 이벤트 무시
        if (snap.metadata.fromCache && !snap.metadata.hasPendingWrites) return;

        let next = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (text) {
          const inc = (s?: string) => s?.toLowerCase().includes(text);
          next = next.filter((x) => inc(x.title) || inc(x.name));
        }
        setItems(next);
        setLoading(false);
      },
      (err) => {
        console.error("[useActiveProductsKR]", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [db, max, category, includeSold, text]);

  return { items, loading };
}