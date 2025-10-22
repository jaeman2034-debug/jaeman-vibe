import { useEffect, useRef, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

type Props = { meetupId: string; isHost: boolean; bench: any };
export default function BenchTimer({ meetupId, isHost, bench }: Props){
  const db = getFirestore();
  const [sec, setSec] = useState<number>(bench?.timeLeft ?? 0);
  const [running, setRunning] = useState<boolean>(false);
  const timerRef = useRef<any>();

  useEffect(()=>{ setSec(bench?.timeLeft ?? 0); }, [bench?.timeLeft]);

  useEffect(()=>{
    if (!running) return;
    timerRef.current = setInterval(async ()=>{
      setSec(s=>{
        const n = Math.max(0, s-1);
        if (isHost) {
          updateDoc(doc(db,'meetups', meetupId), { bench: { ...(bench||{}), timeLeft:n, updatedAt: serverTimestamp() } }).catch(()=>{});
        }
        if (n===0) {
          try { navigator.vibrate?.(200); } catch {}
        }
        return n;
      });
    }, 1000);
    return ()=> clearInterval(timerRef.current);
  }, [running, meetupId, isHost, db, bench]);

  const setPreset = (m:number)=>{ setSec(m*60); };

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-sm text-gray-500 mb-1">휴식 타이머</div>
      <div className="text-3xl font-bold mb-2 tabular-nums">{Math.floor(sec/60).toString().padStart(2,'0')}:{(sec%60).toString().padStart(2,'0')}</div>
      <div className="flex gap-2 mb-2">
        <button className="btn" onClick={()=>setPreset(1)}>1분</button>
        <button className="btn" onClick={()=>setPreset(3)}>3분</button>
        <button className="btn" onClick={()=>setPreset(5)}>5분</button>
      </div>
      <div className="flex gap-2">
        {isHost ? (
          <>
            <button className="btn-primary" onClick={()=>setRunning(true)}>시작</button>
            <button className="btn" onClick={()=>setRunning(false)}>일시정지</button>
          </>
        ) : (
          <span className="text-xs text-gray-500">* 호스트가 조작합니다</span>
        )}
      </div>
    </div>
  );
}
