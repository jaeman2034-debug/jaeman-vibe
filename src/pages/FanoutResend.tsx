import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function FanoutResend(){
  const [eventId,setE]=useState(''); const [regId,setR]=useState(''); const [msg,setM]=useState('');
  async function go(){
    try{
      const r:any = await httpsCallable(getFunctions(),'enqueueFanout')({eventId:eventId.trim(),registrationId:regId.trim(),reason:'manual'});
      setM(`재전송 큐잉 완료: ${r.data?.id}`);
    }catch(e:any){ setM(e?.message||String(e)); }
  }
  return (
    <div className="p-6 space-y-3">
      <h1 className="text-xl font-bold">팬-아웃 재전송</h1>
      <input className="border p-2 rounded w-full" placeholder="eventId" value={eventId} onChange={e=>setE(e.target.value)} />
      <input className="border p-2 rounded w-full" placeholder="registrationId" value={regId} onChange={e=>setR(e.target.value)} />
      <button onClick={go} className="px-3 py-1 rounded bg-black text-white">재전송</button>
      <div className="text-sm text-gray-600">{msg}</div>
    </div>
  );
}