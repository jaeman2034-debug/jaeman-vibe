import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PostCard from './PostCard';

export default function PostList({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<any[]>([]);
  
  useEffect(() => {
    const q = query(collection(db, 'events', eventId, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, s => setItems(s.docs.map(d => ({ id: d.id, ...(d.data() as any) }))));
    return () => unsub();
  }, [eventId]);

  if (!items.length) return <div className="text-sm text-gray-500">아직 게시글이 없습니다.</div>;
  
  return (
    <ul className="space-y-3">
      {items.map(p => <PostCard key={p.id} eventId={eventId} post={p} />)}
    </ul>
  );
}
