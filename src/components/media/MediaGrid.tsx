import React, { useEffect, useState } from 'react';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function MediaGrid({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'events', eventId, 'media'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, s => setItems(s.docs.map(d => ({ id: d.id, ...(d.data() as any) }))));
    return () => unsub();
  }, [eventId]);

  const addLink = async () => {
    if (!url.trim()) return;
    await addDoc(collection(db, 'events', eventId, 'media'), {
      kind: 'link',
      url,
      createdAt: serverTimestamp()
    });
    setUrl('');
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input 
          className="flex-1 border rounded-lg p-2" 
          placeholder="이미지/영상/플레이리스트 링크" 
          value={url} 
          onChange={e => setUrl(e.target.value)}
        />
        <button className="px-3 py-2 rounded-xl border" onClick={addLink}>
          추가
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {items.map(m => (
          <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border">
            <div className="p-2 text-xs text-gray-600 truncate">{m.url}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
