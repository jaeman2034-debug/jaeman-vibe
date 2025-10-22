import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { QRCodeSVG } from 'qrcode.react';

export default function Pass(){
  const { id: eventId } = useParams();
  const [token,setToken]=useState<string>(''); const [exp,setExp]=useState<number>(0);
  const renew = async ()=>{
    const fn = httpsCallable(getFunctions(), 'issueUserPass');
    const { data }: any = await fn({ eventId, ttlMinutes: 10 });
    setToken(data.token); setExp(data.exp);
  };
  useEffect(()=>{ if(eventId) renew(); },[eventId]);

  const left = Math.max(0, Math.floor((exp - Date.now())/1000));
  useEffect(()=>{ if(!exp) return; const t=setInterval(()=>{ if(Date.now()>exp) clearInterval(t); else { /* rerender */ } },1000); return ()=>clearInterval(t); },[exp]);

  return (
    <div className="max-w-sm mx-auto p-6 text-center space-y-4">
      <h1 className="text-2xl font-semibold">내 출석 QR</h1>
      {token ? <QRCodeSVG value={token} size={220}/> : <div className="text-sm text-gray-600">발급 중…</div>}
      <div className="text-sm text-gray-600">유효시간: {left}s</div>
      <button onClick={renew} className="px-3 py-2 rounded-xl border">다시 발급</button>
    </div>
  );
}
