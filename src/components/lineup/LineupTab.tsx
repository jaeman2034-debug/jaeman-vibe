import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useIsStaff } from '@/hooks/useIsStaff';
import PollCreateModal from './PollCreateModal';
import PollCard from './PollCard';

export default function LineupTab({ eventId, evTitle }:{ eventId:string; evTitle:string }){
  const [rows,setRows]=useState<any[]>([]);
  const [open,setOpen]=useState(false);
  const isStaff = useIsStaff(eventId);

  useEffect(()=>{
    const q = query(collection(db,'events',eventId,'polls'), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q,s=>setRows(s.docs.map(d=>({ id:d.id, ...(d.data() as any) }))));
    return ()=>unsub();
  },[eventId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">라인업/포지션 투표</h3>
        {isStaff && <button onClick={()=>setOpen(true)} className="px-3 py-2 rounded-xl border">+ 새 투표</button>}
      </div>
      {!rows.length && <div className="text-sm text-gray-500">아직 투표가 없습니다.</div>}
      <ul className="space-y-3">
        {rows.map(p=><PollCard key={p.id} eventId={eventId} evTitle={evTitle} poll={p}/>)}
      </ul>
      {open && <PollCreateModal eventId={eventId} onClose={()=>setOpen(false)} />}
    </div>
  );
}
