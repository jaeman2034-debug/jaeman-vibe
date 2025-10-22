import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import BenchTimer from './components/BenchTimer';
import LofiPlayer from './components/LofiPlayer';
import ReflexGame from './components/ReflexGame';
import TacticsBoard from './components/TacticsBoard';
import Scoreboard from './components/Scoreboard';

export default function BenchPage(){
  const { id } = useParams();
  const nav = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  const currentUser = auth.currentUser;
  const [meetup, setMeetup] = useState<any>(null);
  const [bench, setBench] = useState<any>({});

  useEffect(()=>{
    if (!id) return;
    const ref = doc(db,'meetups', id);
    getDoc(ref).then(s=>{ if(!s.exists()) nav('/meetups'); else setMeetup({ id:s.id, ...s.data() }); });
    const unsub = onSnapshot(ref, s=>{ const d=s.data()||{}; setBench(d.bench||{}); });
    return ()=>unsub();
  },[id, db, nav]);

  const isHost = useMemo(()=> currentUser && meetup?.hostUid === currentUser.uid, [currentUser, meetup]);

  // 이벤트 로깅(n8n 선택)
  useEffect(()=>{
    try{
      const hook = (import.meta as any).env.VITE_N8N_WEBHOOK_BENCH_EVENT;
      hook && fetch(hook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({t:'BENCH_OPEN', meetupId:id, uid: currentUser?.uid||null})});
    }catch{}
  },[id, currentUser]);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <button className="text-sm text-gray-500" onClick={()=>nav(-1)}>← 돌아가기</button>
        <div className="text-sm text-gray-500">{isHost? '주최자 모드' : '참가자 모드'}</div>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <div className="md:col-span-2"><BenchTimer meetupId={id!} isHost={!!isHost} bench={bench} /></div>
        <div className="md:col-span-2"><Scoreboard meetupId={id!} isHost={!!isHost} bench={bench} /></div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-white p-3"><LofiPlayer/></div>
        <div className="rounded-2xl border bg-white p-3"><ReflexGame meetupId={id!} /></div>
        <div className="rounded-2xl border bg-white p-3 md:col-span-1"><TacticsBoard/></div>
      </div>
    </div>
  );
}
