import { collection, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useRef, useState } from 'react';

export function useMarketInfinite({ pageSize = 12, category, includeSold }: {
  pageSize?: number; 
  category?: string|null; 
  includeSold?: boolean;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const cursorRef = useRef<any>(null);

  const buildQ = (after?: any) => {
    const cons:any[] = [orderBy('createdAt','desc'), limit(pageSize)];
    cons.unshift(where('deleted','==',false));
    if (!includeSold) cons.unshift(where('status','==','selling'));
    if (category) cons.unshift(where('category','==',category));
    let qy = query(collection(db,'market'), ...cons);
    if (after) qy = query(collection(db,'market'), ...cons, startAfter(after));
    return qy;
  };

  const loadMore = async () => {
    if (done) return;
    setLoading(true);
    const qy = buildQ(cursorRef.current);
    const snap = await getDocs(qy);
    if (snap.empty) { setDone(true); setLoading(false); return; }
    cursorRef.current = snap.docs[snap.docs.length-1];
    setItems(prev => [...prev, ...snap.docs.map(d=>({id:d.id, ...d.data()}))]);
    setLoading(false);
  };

  useEffect(() => { // 초기화
    setItems([]); setDone(false); cursorRef.current = null;
    void loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, includeSold]);

  return { items, loading, done, loadMore };
}
