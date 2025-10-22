import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function PollCreateModal({ eventId, onClose }:{ eventId:string; onClose:()=>void }){
  const [title,setTitle]=useState('포지션 투표');
  const [opts,setOpts]=useState('GK\nDF\nMF\nFW');
  const [minutes,setMinutes]=useState(60);

  const create = async ()=>{
    const options = opts.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,20);
    if(!options.length) return alert('옵션을 입력하세요');
    const closesAt = minutes>0 ? Timestamp.fromDate(new Date(Date.now()+minutes*60000)) : null;
    await addDoc(collection(db,'events',eventId,'polls'), {
      title: title.slice(0,80),
      options,
      closesAt,
      createdAt: serverTimestamp()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center" onClick={onClose}>
      <div className="bg-white rounded-2xl p-4 w-[92vw] max-w-md" onClick={e=>e.stopPropagation()}>
        <div className="font-semibold mb-2">새 투표</div>
        <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded-lg p-2 mb-2" placeholder="제목"/>
        <textarea value={opts} onChange={e=>setOpts(e.target.value)} className="w-full border rounded-lg p-2 h-28" placeholder="옵션을 줄바꿈으로 구분"/>
        <div className="flex items-center gap-2 mt-2 text-sm">
          <label>마감(분):</label>
          <input type="number" min={0} value={minutes} onChange={e=>setMinutes(Number(e.target.value))} className="w-24 border rounded-lg p-2"/>
          <span className="text-gray-500">0이면 마감 없음</span>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onClose} className="px-3 py-2 rounded-xl border">취소</button>
          <button onClick={create} className="px-3 py-2 rounded-xl bg-black text-white">생성</button>
        </div>
      </div>
    </div>
  );
}
