// src/pages/events/EventAudit.tsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query, where, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function EventAudit(){
  const { id } = useParams();
  const [logs, setLogs] = useState<any[]>([]);
  const [cursor, setCursor] = useState<any|null>(null);
  const [filter, setFilter] = useState('');

  useEffect(()=>{
    if(!id) return;
    const base = collection(db,'events',id,'logs');
    const q = filter
      ? query(base, where('action','==', filter), orderBy('at','desc'), limit(50))
      : query(base, orderBy('at','desc'), limit(50));
    const unsub = onSnapshot(q,(s)=>{
      setLogs(s.docs.map(d=> ({ id:d.id, ...(d.data() as any) })));
      setCursor(s.docs.length ? s.docs[s.docs.length-1] : null);
    });
    return ()=>unsub();
  },[id, filter]);

  const loadMore = async ()=>{
    if(!id || !cursor) return;
    const base = collection(db,'events',id,'logs');
    const q = filter
      ? query(base, where('action','==', filter), orderBy('at','desc'), startAfter(cursor), limit(50))
      : query(base, orderBy('at','desc'), startAfter(cursor), limit(50));
    const s = await getDocs(q);
    setLogs(prev=> [...prev, ...s.docs.map(d=> ({ id:d.id, ...(d.data() as any) }))]);
    setCursor(s.docs.length ? s.docs[s.docs.length-1] : null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-3">
        <Link to={`/events/${id}/manage`} className="text-sm text-blue-600 underline">← 관리</Link>
        <h1 className="text-lg font-semibold">감사 로그</h1>
        <div className="ml-auto" />
        <select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded border p-2 text-sm">
          <option value="">전체</option>
          <option value="status.change">status.change</option>
          <option value="announcement.send">announcement.send</option>
          <option value="attend.join">attend.join</option>
          <option value="attend.leave">attend.leave</option>
          <option value="waitlist.promote">waitlist.promote</option>
          <option value="role.set">role.set</option>
          <option value="role.remove">role.remove</option>
          <option value="reminder.3h">reminder.3h</option>
        </select>
      </div>

      <ul className="mt-4 divide-y">
        {logs.map(l=> (
          <li key={l.id} className="py-2 text-sm flex items-center gap-2">
            <span className="text-gray-500">{(l.at?.toDate?.()||new Date()).toLocaleString()}</span>
            <span className="mx-2">·</span>
            <span>{l.action}</span>
            {l.actorId && (<><span className="mx-1">·</span><span className="text-xs text-gray-500">by {l.actorId}</span></>)}
            {l.message && <span className="text-gray-600">— {l.message}</span>}
          </li>
        ))}
      </ul>

      {cursor && (
        <div className="mt-4 text-center">
          <button onClick={loadMore} className="px-4 py-2 rounded-xl border">더 보기</button>
        </div>
      )}
    </div>
  );
}
