// src/pages/events/EventCheckin.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function EventCheckin(){
  const { id } = useParams();
  const [sp] = useSearchParams();
  const t = sp.get('t');
  const [msg, setMsg] = useState('처리 중...');
  const fn = httpsCallable(getFunctions(), 'checkInWithToken');

  useEffect(()=>{
    (async()=>{
      try{
        const uid = getAuth().currentUser?.uid; if(!uid){ setMsg('로그인 후 다시 시도하세요'); return; }
        if(!id || !t){ setMsg('잘못된 접근입니다'); return; }
        await fn({ eventId: id, token: t });
        setMsg('✅ 체크인 완료! 즐거운 모임 되세요.');
      }catch(e:any){ setMsg(`체크인 실패: ${e?.message || '오류'}`); }
    })();
  },[id, t]);

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-xl font-semibold">입장 체크인</h1>
      <p className="mt-3">{msg}</p>
      <div className="mt-4">
        <Link to={`/events/${id}`} className="text-blue-600 underline">모임으로 돌아가기</Link>
      </div>
    </div>
  );
}
