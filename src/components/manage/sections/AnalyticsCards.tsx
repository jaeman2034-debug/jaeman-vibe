import React, { useEffect, useState } from 'react';
import { Timestamp, collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AnalyticsCards({ eventId, capacity }: { eventId:string; capacity?:number }){
  const [total,setTotal] = useState<number>(0);
  const [today,setToday] = useState<number>(0);

  useEffect(()=>{ (async()=>{
    const pres = collection(db,'events',eventId,'presence');
    // 전체 체크인 수
    const all = await getCountFromServer(pres); setTotal(all.data().count);

    // 오늘자 체크인 수(한국시간 기준 00:00)
    const now = new Date(); const kst = new Date(now.toLocaleString('en-US', { timeZone:'Asia/Seoul' }));
    const start = new Date(kst.getFullYear(), kst.getMonth(), kst.getDate());
    const snap = await getCountFromServer(query(pres, where('checkedInAt','>=', Timestamp.fromDate(start))));
    setToday(snap.data().count);
  })(); },[eventId]);

  const cap = capacity ?? 0;
  return (
    <section className="rounded-xl border p-4 grid grid-cols-3 gap-3 text-center">
      <div className="p-3 rounded-lg bg-gray-50">
        <div className="text-xs text-gray-500">총 체크인</div>
        <div className="text-xl font-semibold">{total}</div>
      </div>
      <div className="p-3 rounded-lg bg-gray-50">
        <div className="text-xs text-gray-500">오늘 체크인</div>
        <div className="text-xl font-semibold">{today}</div>
      </div>
      <div className="p-3 rounded-lg bg-gray-50">
        <div className="text-xs text-gray-500">잔여 좌석</div>
        <div className="text-xl font-semibold">{Math.max(0, cap - total)}</div>
      </div>
    </section>
  );
}
