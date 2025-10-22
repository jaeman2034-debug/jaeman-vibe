import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';

export default function AutomationPanel({ eventId }: { eventId: string }) {
  const [on, setOn] = useState(true);
  
  useEffect(() => {
    const u = onSnapshot(doc(db, 'events', eventId), s => {
      setOn(s.data()?.autoNotify?.occupancy !== false);
    });
    return () => u();
  }, [eventId]);
  
  const toggle = async () => {
    const fn = httpsCallable(getFunctions(), 'setAutomation');
    await fn({ eventId, occupancy: !on });
  };
  
  const reset = async () => {
    await setDoc(doc(db, 'events', eventId), { 
      autoNotify: { occupancy: on, notified80: false, notified100: false } 
    }, { merge: true });
    alert('임계치 알림 상태를 초기화했습니다.');
  };
  
  return (
    <section className="rounded-xl border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">자동 공지(점유율)</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggle} 
            className={`px-3 py-2 rounded-xl border ${
              on ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700'
            }`}
          >
            {on ? 'ON → OFF' : 'OFF → ON'}
          </button>
          <button 
            onClick={reset} 
            className="px-3 py-2 rounded-xl border hover:bg-yellow-50"
          >
            상태 초기화
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        체크인/참가 변경 시 80%/100% 도달에 자동 공지·푸시. (중복 방지)
      </p>
      <div className="text-xs text-gray-400">
        현재 상태: {on ? '활성화' : '비활성화'}
      </div>
    </section>
  );
}
