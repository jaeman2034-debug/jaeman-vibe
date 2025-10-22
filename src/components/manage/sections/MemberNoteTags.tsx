import React, { useEffect, useState } from 'react';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const POS = ['GK', 'DF', 'MF', 'FW', 'G', 'F', 'C'];

export default function MemberNoteTags({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  
  const load = async () => {
    const qs = await getDocs(collection(db, `events/${eventId}/attendees`));
    setRows(qs.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
  };
  
  useEffect(() => { load(); }, [eventId]);

  const save = async (uid: string, patch: any) => {
    await setDoc(doc(db, `events/${eventId}/attendees/${uid}`), patch, { merge: true });
  };

  return (
    <section className="rounded-xl border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">참가자 메모/태그</h3>
        <button 
          onClick={load} 
          className="px-3 py-2 rounded-xl border hover:bg-gray-50"
        >
          새로고침
        </button>
      </div>
      
      <ul className="divide-y">
        {rows.map(r => (
          <li key={r.id} className="py-3 space-y-2">
            <div className="text-sm font-medium font-mono">{r.id}</div>
            
            <div className="grid md:grid-cols-3 gap-2">
              <select 
                value={r.position || ''} 
                onChange={e => { 
                  r.position = e.target.value || null; 
                  save(r.id, { position: r.position }); 
                }} 
                className="border rounded-lg p-2 text-sm"
              >
                <option value="">포지션</option>
                {POS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              
              <select 
                value={r.level || ''} 
                onChange={e => { 
                  r.level = e.target.value || null; 
                  save(r.id, { level: r.level }); 
                }} 
                className="border rounded-lg p-2 text-sm"
              >
                <option value="">레벨</option>
                {LEVELS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              
              <input 
                defaultValue={(r.tags || []).join(', ')} 
                onBlur={e => save(r.id, { 
                  tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean).slice(0, 8) 
                })}
                placeholder="태그(쉼표로 구분)" 
                className="border rounded-lg p-2 text-sm"
              />
            </div>
            
            <textarea 
              defaultValue={r.note || ''} 
              onBlur={e => save(r.id, { 
                note: e.target.value.slice(0, 500) 
              })}
              placeholder="메모(최대 500자)" 
              className="border rounded-lg p-2 w-full h-20 text-sm resize-none"
            />
            
            <div className="text-xs text-gray-400">
              포지션: {r.position || '미설정'} | 레벨: {r.level || '미설정'} | 태그: {(r.tags || []).length}개
            </div>
          </li>
        ))}
        
        {!rows.length && (
          <li className="py-4 text-sm text-gray-500">참가자가 없습니다.</li>
        )}
      </ul>
    </section>
  );
}
