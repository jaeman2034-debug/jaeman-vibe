import React, { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';

export default function BanPanel({ eventId }: { eventId: string }) {
  const [list, setList] = useState<any[]>([]);
  const [target, setTarget] = useState(''); 
  const [days, setDays] = useState(7); 
  const [reason, setReason] = useState('');
  
  const load = async () => {
    const qs = await getDocs(collection(db, `events/${eventId}/bans`));
    setList(qs.docs.map(d => ({ uid: d.id, ...(d.data() as any) })));
  };
  
  useEffect(() => { load(); }, [eventId]);

  const ban = async () => {
    if (!target) return;
    const fn = httpsCallable(getFunctions(), 'banUser');
    await fn({ eventId, targetUid: target, days, reason });
    setTarget(''); 
    setReason(''); 
    await load();
  };
  
  const unban = async (uid: string) => {
    const fn = httpsCallable(getFunctions(), 'unbanUser');
    await fn({ eventId, targetUid: uid }); 
    await load();
  };

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">강퇴/차단</h3>
        <button onClick={load} className="px-3 py-2 rounded-xl border hover:bg-gray-50">
          새로고침
        </button>
      </div>
      
      <div className="grid md:grid-cols-4 gap-2">
        <input 
          value={target} 
          onChange={e => setTarget(e.target.value)} 
          className="border rounded-lg p-2" 
          placeholder="UID"
        />
        <input 
          type="number" 
          min={1} 
          value={days} 
          onChange={e => setDays(Number(e.target.value))} 
          className="border rounded-lg p-2" 
          placeholder="일수"
        />
        <input 
          value={reason} 
          onChange={e => setReason(e.target.value)} 
          className="border rounded-lg p-2" 
          placeholder="사유(선택)"
        />
        <button 
          onClick={ban} 
          className="px-3 py-2 rounded-xl border hover:bg-red-50 text-red-600"
        >
          차단
        </button>
      </div>
      
      <ul className="mt-2 divide-y">
        {list.map(b => (
          <li key={b.uid} className="py-2 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-mono">{b.uid}</div>
              <div className="text-gray-500">
                {b.until?.toDate ? b.until.toDate().toLocaleString() : ''}
                {b.reason && ` · ${b.reason}`}
              </div>
            </div>
            <button 
              onClick={() => unban(b.uid)} 
              className="px-3 py-1 rounded-lg border hover:bg-green-50 text-green-600"
            >
              해제
            </button>
          </li>
        ))}
        {!list.length && (
          <li className="py-3 text-sm text-gray-500">차단된 사용자가 없습니다</li>
        )}
      </ul>
    </section>
  );
}
