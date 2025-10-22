import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, where, limit as fLimit } from "firebase/firestore";
import type { JobPost } from "../types";

type Params = { sport?: string; region?: string; type?: string; take?: number };

export default function useJobs({ sport, region, type, take = 50 }: Params) {
  const [items, setItems] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const conds: any[] = [];
        if (sport)  conds.push(where("sport", "==", sport));
        if (region) conds.push(where("region", "==", region));
        if (type)   conds.push(where("type", "==", type));
        const q = query(collection(db, "jobs"), ...conds, orderBy("createdAt", "desc"), fLimit(take));
        const snap = await getDocs(q);
        setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as JobPost[]);
      } catch (e) { setError(e); }
      finally { setLoading(false); }
    })();
  }, [sport, region, type, take]);

  return { items, loading, error };
}
