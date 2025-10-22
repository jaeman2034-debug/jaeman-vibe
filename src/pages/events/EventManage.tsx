// src/pages/events/EventManage.tsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, runTransaction } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import QRCode from 'qrcode';
import { db } from '@/lib/firebase';
import type { EventDoc } from './EventList';

export default function EventManage(){
  const { id } = useParams();
  const [ev, setEv] = useState<(EventDoc & { id:string })|null>(null);
  const [att, setAtt] = useState<{uid:string, joinedAt:any}[]>([]);
  const [roles, setRoles] = useState<{uid:string, role:string}[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [newStaffUid, setNewStaffUid] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const uid = getAuth().currentUser?.uid;
  const fns = getFunctions();
  const callSetStatus = httpsCallable(fns, 'setEventStatus');
  const callSendAnnouncement = httpsCallable(fns, 'moderateAnnouncement');
  const callSetRole = httpsCallable(fns,'setEventRole');
  const callCreateCheckinToken = httpsCallable(fns, 'createCheckinToken');
  const callFinalizeEvent = httpsCallable(fns, 'finalizeEvent');

  useEffect(()=>{
    if(!id) return;
    const ref = doc(db,'events',id);
    const unsub = onSnapshot(ref,(s)=> s.exists() && setEv({ id:s.id, ...(s.data() as EventDoc) }));
    const ar = query(collection(db,'events',id,'attendees'), orderBy('joinedAt','asc'));
    const unsub2 = onSnapshot(ar,(s)=> setAtt(s.docs.map(d=>({ uid:d.id, ...(d.data() as any) }))));
    const rr = collection(db,'events',id,'roles');
    const unsubR = onSnapshot(rr,(s)=> setRoles(s.docs.map(d=> ({ uid:d.id, ...(d.data() as any) }))));
    const lr = query(collection(db,'events',id,'logs'), orderBy('at','desc'), limit(20));
    const unsubL = onSnapshot(lr,(s)=> setLogs(s.docs.map(d=> ({ id:d.id, ...(d.data() as any) }))));
    return ()=>{unsub();unsub2();unsubR();unsubL();}
  },[id]);

  if(!ev) return <div className="p-4">불러오는 중...</div>;
  const isHost = uid === ev.hostId;
  if(!isHost) return <div className="p-4">권한이 없습니다.</div>;

  const setStatus = async (status: EventDoc['status']) => {
    if(!id) return;
    await callSetStatus({ eventId: id, status });
  };

  const kick = async (kUid:string) => {
    if(!id) return;
    // 강퇴 = attendee 문서 삭제
    await runTransaction(db, async tx => {
      const eRef = doc(db,'events',id);
      const aRef = doc(db,'events',id,'attendees',kUid);
      tx.delete(aRef);
      // 카운트는 Functions 또는 별도 트랜잭션 로직에 의해 업데이트됨
    });
  };

  const startCheckin = async ()=>{
    if(!id) return;
    const { data }: any = await callCreateCheckinToken({ eventId: id, ttlSec: 900 });
    const url = `${location.origin}/events/${id}/checkin?t=${data.token}`;
    setQrUrl(await QRCode.toDataURL(url));
    setQrOpen(true);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Link to={`/events/${id}`} className="text-sm text-blue-600 underline">← 상세</Link>
        <h1 className="text-lg font-semibold">호스트 관리</h1>
        <div className="ml-auto text-sm text-gray-500">상태: {ev.status}</div>
      </div>

      <div className="flex gap-2">
        <button onClick={()=>setStatus('open')} className="px-3 py-2 rounded-xl border">열기</button>
        <button onClick={()=>setStatus('closed')} className="px-3 py-2 rounded-xl border">마감</button>
        <button onClick={()=>setStatus('canceled')} className="px-3 py-2 rounded-xl border">취소</button>
        <button onClick={startCheckin} className="px-3 py-2 rounded-xl border">체크인 시작(QR)</button>
        <button onClick={async()=> { await callFinalizeEvent({ eventId: id }); alert('정산 완료'); }} className="px-3 py-2 rounded-xl border">정산/마감</button>
      </div>

      <div>
        <h2 className="font-semibold">공지 보내기</h2>
        <div className="mt-2 flex gap-2">
          <input value={msg} onChange={e=>setMsg(e.target.value)} className="flex-1 rounded-xl border p-2" placeholder="메시지" />
          <button onClick={async()=>{ await callSendAnnouncement({ eventId: id, message: msg }); setMsg(''); }} className="px-3 py-2 rounded-xl border">발송</button>
        </div>
      </div>

      <div className="rounded-xl border p-3">
        <h2 className="font-semibold">관리자(Staff)</h2>
        <div className="mt-2 flex items-center gap-2">
          <input value={newStaffUid} onChange={e=>setNewStaffUid(e.target.value)} placeholder="사용자 UID" className="rounded border p-2" />
          <button onClick={async()=>{ await callSetRole({ eventId:id, targetUid:newStaffUid, role:'staff' }); setNewStaffUid(''); }} className="px-3 py-2 rounded-xl border">지정</button>
        </div>
        <ul className="mt-3 divide-y">
          {roles.map(r=> (
            <li key={r.uid} className="py-2 flex items-center gap-2">
              <span className="text-sm">{r.uid}</span>
              <span className="text-xs text-gray-500">{r.role}</span>
              <div className="ml-auto" />
              {r.role==='staff' && <button onClick={async()=> callSetRole({ eventId:id, targetUid:r.uid, role:'member' })} className="text-sm px-2 py-1 rounded border">해제</button>}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border p-3">
        <h2 className="font-semibold">최근 로그</h2>
        <ul className="mt-2 divide-y">
          {logs.map(l=> (
            <li key={l.id} className="py-2 text-sm flex items-center gap-2">
              <span className="text-gray-500">{(l.at?.toDate?.()||new Date()).toLocaleString()}</span>
              <span className="mx-2">·</span>
              <span>{l.action}</span>
              {l.message && <span className="text-gray-600">— {l.message}</span>}
            </li>
          ))}
        </ul>
        <a className="text-sm text-blue-600 underline" href={`/events/${id}/audit`}>전체 로그 보기</a>
      </div>

      <div className="rounded-xl border p-3">
        <h2 className="font-semibold">결제 관리</h2>
        <div className="mt-2 flex gap-2">
          <Link to={`/events/${id}/payments`} className="px-3 py-2 rounded-xl border">결제 내역</Link>
          <Link to={`/events/${id}/analytics`} className="px-3 py-2 rounded-xl border">체크인 대시보드</Link>
        </div>
      </div>

      <div>
        <h2 className="font-semibold">참가자 ({att.length}/{ev.capacity})</h2>
        <ul className="mt-2 divide-y">
          {att.map(a => (
            <li key={a.uid} className="py-2 flex items-center gap-2">
              <span className="text-sm">{a.uid}</span>
              <div className="ml-auto" />
              <button onClick={()=>kick(a.uid)} className="text-sm px-2 py-1 rounded border">강퇴</button>
            </li>
          ))}
        </ul>
      </div>

      {qrOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40" onClick={()=>setQrOpen(false)}>
          <div className="bg-white rounded-2xl p-4 w-[90vw] max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="font-semibold mb-2">입장 체크인</div>
            {qrUrl ? <img src={qrUrl} alt="QR" className="w-full"/> : <div className="h-64"/>}
            <div className="text-xs text-gray-500 mt-2">유효기간 15분</div>
          </div>
        </div>
      )}
    </div>
  );
}
