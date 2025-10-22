import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, orderBy, query, where, limit as fLimit,
} from "firebase/firestore";
import type { Meeting } from "../types";

type Params = { sport?: string; region?: string; dateFrom?: string; take?: number };

export default function useMeetings({ sport, region, dateFrom, take = 50 }: Params) {
  const [items, setItems] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const conds: any[] = [];
        if (sport)  conds.push(where("sport", "==", sport));
        if (region) conds.push(where("region", "==", region));
        if (dateFrom) conds.push(where("date", ">=", dateFrom));
        const q = query(collection(db, "meetings"), ...conds, orderBy("date", "asc"), fLimit(take));
        const snap = await getDocs(q);
        const arr = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Meeting[];
        setItems(arr);
      } catch (e) { setError(e); }
      finally { setLoading(false); }
    })();
  }, [sport, region, dateFrom, take]);

  return { items, loading, error };
}
