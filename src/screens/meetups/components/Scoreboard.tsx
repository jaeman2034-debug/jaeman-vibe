import { useEffect, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

type Props = { meetupId: string; isHost: boolean; bench: any };
export default function Scoreboard({ meetupId, isHost, bench }: Props){
  const db = getFirestore();
  const [a, setA] = useState<number>(bench?.scoreA ?? 0);
  const [b, setB] = useState<number>(bench?.scoreB ?? 0);
  
  useEffect(()=>{ 
    setA(bench?.scoreA ?? 0); 
    setB(bench?.scoreB ?? 0); 
  }, [bench?.scoreA, bench?.scoreB]);

  const push = (na:number, nb:number)=> 
    updateDoc(doc(db,'meetups', meetupId), { 
      bench: { ...(bench||{}), scoreA: na, scoreB: nb, updatedAt: serverTimestamp() } 
    });

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-sm text-gray-500 mb-1">스코어·타임보드</div>
      <div className="flex items-center gap-4 text-3xl font-bold">
        <span>{a}</span>
        <span className="text-gray-400 text-xl">:</span>
        <span>{b}</span>
      </div>
      {isHost ? (
        <div className="flex gap-2 mt-2">
          <button className="btn" onClick={()=>{ const na=a+1; setA(na); push(na,b); }}>A+1</button>
          <button className="btn" onClick={()=>{ const nb=b+1; setB(nb); push(a,nb); }}>B+1</button>
          <button className="btn" onClick={()=>{ setA(0); setB(0); push(0,0); }}>리셋</button>
        </div>
      ) : (
        <div className="text-xs text-gray-500 mt-1">* 주최자가 조작합니다</div>
      )}
    </div>
  );
}
