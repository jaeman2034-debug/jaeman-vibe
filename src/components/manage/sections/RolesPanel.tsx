import React, { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function RolesPanel({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<{ uid: string }[]>([]);
  const [uid, setUid] = useState('');
  
  const load = async () => {
    const qs = await getDocs(collection(db, `events/${eventId}/roles`));
    setRows(qs.docs.map(d => ({ uid: d.id })));
  };
  
  useEffect(() => { load(); }, [eventId]);

  const add = async () => {
    if (!uid) return;
    await setDoc(doc(db, `events/${eventId}/roles/${uid}`), { 
      at: new Date(),
      role: 'staff' // 기본값으로 staff 역할 부여
    });
    setUid(''); 
    await load();
  };
  
  const del = async (u: string) => {
    if (!confirm('스태프 해제할까요?')) return;
    await deleteDoc(doc(db, `events/${eventId}/roles/${u}`)); 
    await load();
  };

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">역할 관리(스태프)</h3>
        <button onClick={load} className="px-3 py-2 rounded-xl border hover:bg-gray-50">
          새로고침
        </button>
      </div>
      
      <div className="flex gap-2">
        <input 
          value={uid} 
          onChange={e => setUid(e.target.value)} 
          placeholder="UID 입력"
          className="border rounded-lg p-2 flex-1"
        />
        <button 
          onClick={add} 
          className="px-3 py-2 rounded-xl border hover:bg-gray-50"
        >
          추가
        </button>
      </div>
      
      <ul className="mt-2 divide-y">
        {rows.map(r => (
          <li key={r.uid} className="py-2 flex items-center justify-between">
            <span className="text-sm font-mono">{r.uid}</span>
            <button 
              onClick={() => del(r.uid)} 
              className="px-3 py-1 rounded-lg border hover:bg-red-50 text-red-600"
            >
              해제
            </button>
          </li>
        ))}
        {!rows.length && (
          <li className="py-3 text-sm text-gray-500">스태프 없음</li>
        )}
      </ul>
    </section>
  );
}
