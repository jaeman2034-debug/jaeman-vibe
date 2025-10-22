import React, { useEffect, useMemo, useRef, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { db } from '@/lib/firebase';

function usePop(val: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const prev = useRef<number>(val);
  useEffect(() => {
    if (val !== prev.current && ref.current) {
      ref.current.classList.remove('animate-pop'); // 재적용 위해
      // 다음 프레임에 클래스 추가
      requestAnimationFrame(() => { 
        ref.current && ref.current.classList.add('animate-pop'); 
      });
      prev.current = val;
    }
  }, [val]);
  return ref;
}

export default function LiveBoard() {
  const { id: eventId } = useParams();
  const [courts, setCourts] = useState<any[]>([]);
  const [assign, setAssign] = useState<any[]>([]);
  const [matches, setMatches] = useState<Record<string, any>>({});
  
  // 테마 지원
  const theme = new URLSearchParams(location.search).get('theme') || 'dark';
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme !== 'light');
    document.body.dataset.boardTheme = theme;
  }, [theme]);

  const load = async () => {
    const cs = await getDocs(query(collection(db, `events/${eventId}/courts`)));
    const as = await getDocs(query(
      collection(db, `events/${eventId}/court_assignments`), 
      where('status', 'in', ['running', 'queued'] as any), 
      orderBy('courtId'), 
      orderBy('order')
    ));
    const ms = await getDocs(query(
      collection(db, `events/${eventId}/matches`), 
      where('status', 'in', ['running', 'pending'] as any)
    ));
    setCourts(cs.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    setAssign(as.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    const m: Record<string, any> = {};
    ms.docs.forEach(d => m[d.id] = { id: d.id, ...(d.data() as any) });
    setMatches(m);
  };
  
  useEffect(() => { 
    load(); 
    const t = setInterval(load, 2000); 
    return () => clearInterval(t); 
  }, [eventId]);

  return (
    <div className="min-h-screen p-6 bg-black text-white">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courts.map(c => {
          const q = assign.filter(a => a.courtId === c.id);
          const run = q.find(a => a.status === 'running');
          const next = q.find(a => a.status === 'queued');
          const m = run ? matches[run.matchId] : null;
          
          return (
            <div key={c.id} className="rounded-2xl border border-white/10 p-4 bg-white/5">
              <div className="text-sm opacity-70">{c.name}</div>
              <div className="mt-2">
                {m ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold">{m.teamA}</div>
                      <div ref={usePop(m?.liveA ?? 0)} className="text-4xl font-bold tabular-nums score-pop">{m.liveA ?? 0}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold">{m.teamB}</div>
                      <div ref={usePop(m?.liveB ?? 0)} className="text-4xl font-bold tabular-nums score-pop">{m.liveB ?? 0}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">진행 없음</div>
                )}
              </div>
              <div className="mt-4 text-xs opacity-70">
                {next ? (
                  <>다음: {next.matchId}</>
                ) : (
                  '대기 없음'
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
