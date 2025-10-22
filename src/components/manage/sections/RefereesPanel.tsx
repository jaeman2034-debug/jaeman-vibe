import React, { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function RefereesPanel({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<{ uid: string, role: string }[]>([]);
  const [uid, setUid] = useState('');
  
  const load = async () => {
    const qs = await getDocs(collection(db, `events/${eventId}/roles`));
    setRows(qs.docs.map(d => ({ uid: d.id, role: (d.data() as any)?.role || 'staff' })));
  };
  
  useEffect(() => { load(); }, [eventId]);
  
  const addRef = async () => { 
    if (!uid) return; 
    await setDoc(doc(db, `events/${eventId}/roles/${uid}`), { 
      role: 'ref', 
      at: new Date() 
    }, { merge: true }); 
    setUid(''); 
    await load(); 
  };
  
  const del = async (u: string) => { 
    await deleteDoc(doc(db, `events/${eventId}/roles/${u}`)); 
    await load(); 
  };
  
  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">심판 계정</h3>
        <button onClick={load} className="px-3 py-2 rounded-xl border">새로고침</button>
      </div>
      <div className="flex gap-2">
        <input 
          value={uid} 
          onChange={e => setUid(e.target.value)} 
          placeholder="UID" 
          className="border rounded-lg p-2 flex-1"
        />
        <button onClick={addRef} className="px-3 py-2 rounded-xl border">추가</button>
      </div>
      <ul className="divide-y">
        {rows.map(r => (
          <li key={r.uid} className="py-2 flex items-center justify-between">
            <span className="text-sm">{r.uid} · <b>{r.role}</b></span>
            <button 
              onClick={() => del(r.uid)} 
              className="px-3 py-1 rounded-lg border"
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
