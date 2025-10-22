import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';

type Ann = { id:string; title?:string; text?:string; pinned?:boolean; createdAt?:any };

export default function AnnouncePanel({ eventId }:{ eventId:string }){
  const [items, setItems] = useState<Ann[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ann|null>(null);

  useEffect(()=>{
    const q = query(collection(db,'events',eventId,'announcements'), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q,s=>setItems(s.docs.map(d=>({ id:d.id, ...(d.data() as any) }))));
    return ()=>unsub();
  },[eventId]);

  const togglePin = async (id:string, pinned:boolean)=>{
    const fn = httpsCallable(getFunctions(), 'togglePinAnnouncement');
    await fn({ eventId, annId: id, pinned: !pinned });
  };

  const openCreate = ()=>{ setEditing(null); setOpen(true); };
  const openEdit = (a:Ann)=>{ setEditing(a); setOpen(true); };

  const del = async(id:string)=>{
    if(!confirm('이 공지를 삭제할까요?')) return;
    const fn = httpsCallable(getFunctions(), 'deleteAnnouncement');
    await fn({ eventId, annId: id });
  };

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">공지 관리</h3>
        <button onClick={openCreate} className="px-3 py-2 rounded-xl border">+ 새 공지</button>
      </div>

      {!items.length && <div className="text-sm text-gray-500">공지 없음</div>}
      <ul className="space-y-2">
        {items.map(a=>(
          <li key={a.id} className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{a.title || a.text?.slice(0,30) || a.id}</div>
              {a.text && <div className="text-xs text-gray-500 truncate">{a.text}</div>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>togglePin(a.id, !!a.pinned)}
                className={`px-3 py-1 rounded-lg border ${a.pinned?'bg-yellow-100':''}`}>
                {a.pinned?'핀 해제':'핀 고정'}
              </button>
              <button onClick={()=>openEdit(a)} className="px-3 py-1 rounded-lg border">수정</button>
              <button onClick={()=>del(a.id)} className="px-3 py-1 rounded-lg border text-red-600">삭제</button>
            </div>
          </li>
        ))}
      </ul>

      {open && (
        <AnnounceModal
          eventId={eventId}
          initial={editing ?? undefined}
          onClose={()=>setOpen(false)}
        />
      )}
    </section>
  );
}

function AnnounceModal({ eventId, initial, onClose }:{
  eventId:string; initial?:Ann; onClose:()=>void
}){
  const [title,setTitle]=useState(initial?.title||'');
  const [text,setText]=useState(initial?.text||'');
  const [err,setErr]=useState('');

  const save = async ()=>{
    try{
      const f = getFunctions();
      if(initial){
        const fn = httpsCallable(f, 'updateAnnouncement');
        await fn({ eventId, annId: initial.id, title, text });
      }else{
        const fn = httpsCallable(f, 'createAnnouncement');
        await fn({ eventId, title, text });
      }
      onClose();
    }catch(e:any){
      setErr(e?.message || '저장 실패');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center" onClick={onClose}>
      <div className="bg-white rounded-2xl p-4 w-[92vw] max-w-md" onClick={e=>e.stopPropagation()}>
        <div className="font-semibold mb-2">{initial?'공지 수정':'새 공지'}</div>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="제목(선택)"
               className="w-full border rounded-lg p-2 mb-2"/>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="내용"
                  className="w-full border rounded-lg p-2 h-32"/>
        {err && <div className="mt-2 text-sm text-red-600">{err}</div>}
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onClose} className="px-3 py-2 rounded-xl border">취소</button>
          <button onClick={save} className="px-3 py-2 rounded-xl bg-black text-white">저장</button>
        </div>
      </div>
    </div>
  );
}