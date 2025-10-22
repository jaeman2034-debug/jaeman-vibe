// src/pages/settings/NotificationsSettings.tsx
import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function NotificationsSettings(){
  const uid = getAuth().currentUser?.uid;
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<any>({
    categories: { announce: true, status: true, reminder: true, promote: true },
    dnd: { enabled: false, start: '22:00', end: '08:00', tz: 'Asia/Seoul' },
  });

  useEffect(()=>{ (async()=>{
    if(!uid) return setLoading(false);
    const ref = doc(db,'users',uid,'prefs','notifications');
    const snap = await getDoc(ref);
    if (snap.exists()) setPrefs(snap.data());
    setLoading(false);
  })(); },[uid]);

  const save = async ()=>{
    if(!uid) return;
    await setDoc(doc(db,'users',uid,'prefs','notifications'), prefs, { merge:true });
    alert('저장되었습니다');
  };

  if(!uid) return <div className="p-4">로그인이 필요합니다</div>;
  if(loading) return <div className="p-4">불러오는 중...</div>;

  const C = prefs.categories;
  const D = prefs.dnd;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-semibold">알림 설정</h1>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold">카테고리</h2>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {[
            ['announce','공지'],['status','상태 변경'],['reminder','리마인더'],['promote','대기자 승격']
          ].map(([k,label])=> (
            <label key={k} className="flex items-center gap-2">
              <input type="checkbox" checked={!!C[k]} onChange={e=> setPrefs((p:any)=> ({...p, categories:{...p.categories, [k]: e.target.checked}}))} /> {label}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold">야간 무음(Do Not Disturb)</h2>
        <label className="flex items-center gap-2 mt-2">
          <input type="checkbox" checked={D.enabled} onChange={e=> setPrefs((p:any)=> ({...p, dnd:{...p.dnd, enabled:e.target.checked}}))} /> 활성화
        </label>
        <div className="mt-2 flex items-center gap-3">
          <div>
            <div className="text-xs text-gray-500">시작</div>
            <input type="time" value={D.start} onChange={e=> setPrefs((p:any)=> ({...p, dnd:{...p.dnd, start:e.target.value}}))} className="rounded border p-2" />
          </div>
          <div>
            <div className="text-xs text-gray-500">종료</div>
            <input type="time" value={D.end} onChange={e=> setPrefs((p:any)=> ({...p, dnd:{...p.dnd, end:e.target.value}}))} className="rounded border p-2" />
          </div>
          <div>
            <div className="text-xs text-gray-500">시간대</div>
            <input value={D.tz} onChange={e=> setPrefs((p:any)=> ({...p, dnd:{...p.dnd, tz:e.target.value}}))} className="rounded border p-2" />
          </div>
        </div>
      </section>

      <div className="flex gap-2">
        <button onClick={save} className="px-4 py-2 rounded-xl bg-black text-white">저장</button>
      </div>
    </div>
  );
}
