import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';

export default function PollCard({ eventId, poll, evTitle }:{ eventId:string; poll:any; evTitle:string }){
  const uid = getAuth().currentUser?.uid;
  const [votes,setVotes]=useState<any[]>([]);
  useEffect(()=>{
    const q = query(collection(db,'events',eventId,'polls',poll.id,'votes'), orderBy('votedAt','asc'));
    const unsub = onSnapshot(q,s=>setVotes(s.docs.map(d=>({ id:d.id, ...(d.data() as any) }))));
    return ()=>unsub();
  },[eventId, poll.id]);

  const counts = useMemo(()=>{
    const arr = Array(poll.options.length).fill(0);
    for(const v of votes) if (typeof v.optionIndex==='number') arr[v.optionIndex] = (arr[v.optionIndex]||0)+1;
    return arr as number[];
  },[votes, poll.options]);

  const my = votes.find(v=>v.id===uid);
  const closed = !!(poll.closesAt?.toDate && poll.closesAt.toDate() < new Date());

  const vote = async(idx:number)=>{
    if(!uid) return alert('로그인이 필요합니다');
    if(closed) return alert('마감된 투표입니다');
    await setDoc(doc(db,'events',eventId,'polls',poll.id,'votes', uid), {
      optionIndex: idx,
      votedAt: new Date()
    }, { merge:true });
  };

  const saveSnapshot = ()=>{
    const w=900,h=600, pad=32;
    const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#111827'; ctx.font='bold 24px system-ui';
    ctx.fillText(`${evTitle} — ${poll.title}`, pad, pad+4);
    ctx.font='14px system-ui'; ctx.fillStyle='#6b7280';
    ctx.fillText(new Date().toLocaleString(), pad, pad+28);

    const max = Math.max(1, ...counts);
    const barW = w - pad*2 - 160;
    let y = pad+60;
    for(let i=0;i<poll.options.length;i++){
      const name = poll.options[i];
      const v = counts[i]||0;
      ctx.fillStyle='#374151'; ctx.font='16px system-ui';
      ctx.fillText(name, pad, y+18);
      // bar
      const bw = Math.round((v/max)*barW);
      ctx.fillStyle='#d1d5db'; ctx.fillRect(pad+160, y, barW, 22);
      ctx.fillStyle='#111827'; ctx.fillRect(pad+160, y, bw, 22);
      ctx.fillStyle='#111827'; ctx.font='bold 14px system-ui';
      ctx.fillText(String(v), pad+160 + barW + 8, y+18);
      y += 36;
    }
    // download
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `lineup_${poll.id}.png`;
    a.click();
  };

  return (
    <li className="rounded-xl border p-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">{poll.title}</div>
        <div className="text-xs text-gray-500">
          {closed ? '마감됨' : (poll.closesAt?.toDate ? `마감: ${poll.closesAt.toDate().toLocaleString()}` : '마감 없음')}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {poll.options.map((opt:string, idx:number)=>(
          <button key={idx} onClick={()=>vote(idx)}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border
               ${my?.optionIndex===idx ? 'bg-black text-white' : 'bg-white'}`}
            disabled={closed}>
            <span className="truncate text-left">{opt}</span>
            <span className="text-sm opacity-80">{counts[idx]||0}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <span className="text-sm text-gray-500">내 선택: {typeof my?.optionIndex==='number' ? poll.options[my.optionIndex] : '없음'}</span>
        <div className="flex-1" />
        <button onClick={saveSnapshot} className="px-3 py-2 rounded-xl border">스냅샷 저장</button>
      </div>
    </li>
  );
}
