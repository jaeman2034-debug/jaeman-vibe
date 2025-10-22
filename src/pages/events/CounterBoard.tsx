import React, { useEffect, useMemo, useRef, useState } from 'react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams, Link } from 'react-router-dom';

function useCounts(eventId?: string) {
  const [att, setAtt] = useState(0);   // 참가자 수
  const [pre, setPre] = useState(0);   // 체크인 수
  const [cap, setCap] = useState<number | undefined>(undefined);
  
  useEffect(() => {
    if (!eventId) return;
    
    const u1 = onSnapshot(collection(db, `events/${eventId}/attendees`), s => setAtt(s.size));
    const u2 = onSnapshot(collection(db, `events/${eventId}/presence`), s => setPre(s.size));
    getDoc(doc(db, 'events', eventId)).then(s => setCap((s.data() as any)?.capacity));
    
    return () => { u1(); u2(); };
  }, [eventId]);
  
  return { att, pre, cap };
}

function useOneShotBeep() {
  const fired = useRef<{ [k: string]: boolean }>({});
  
  return (id: string, volume = 0.3) => {
    if (fired.current[id]) return;
    fired.current[id] = true;
    
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 880;
    g.gain.value = volume;
    o.connect(g).connect(ctx.destination);
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, 180);
  };
}

export default function CounterBoard() {
  const { id: eventId } = useParams();
  const { att, pre, cap } = useCounts(eventId);
  const pct = useMemo(() => (cap ? Math.min(100, Math.round((pre / cap) * 100)) : 0), [pre, cap]);
  const beepOnce = useOneShotBeep();
  
  useEffect(() => {
    if (!cap || cap <= 0) return;
    if (pct >= 50) beepOnce('50');
    if (pct >= 80) beepOnce('80');
    if (pct >= 100) beepOnce('100', 0.5);
  }, [pct, cap, beepOnce]);

  return (
    <div className="min-h-screen px-6 py-6 bg-white dark:bg-black text-black dark:text-white">
      <div className="flex items-center justify-between">
        <Link to={`/events/${eventId}`} className="text-sm underline opacity-70">
          이벤트로
        </Link>
        <div className="text-sm opacity-70">정원: {cap ?? '-'}</div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <Card title="체크인" big>{pre.toLocaleString()}</Card>
        <Card title="참가자">{att.toLocaleString()}</Card>
        <Card title="진행률">{cap ? `${pct}%` : '-'}</Card>
      </div>

      <div className="mt-10 w-full h-6 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-black dark:bg-white transition-all duration-500" 
          style={{ width: `${pct}%` }} 
        />
      </div>

      <div className="mt-10 grid md:grid-cols-2 gap-6">
        <Milestone label="50% 돌파" active={pct >= 50} />
        <Milestone label="80% 임박" active={pct >= 80} />
        <Milestone label="정원 100%" active={pct >= 100} />
      </div>

      <p className="mt-8 text-xs opacity-60">
        임계치 도달 시 1회 음향 알림. 새로고침 시 초기화.
      </p>
    </div>
  );
}

function Card({ title, children, big }: { title: string; children: any; big?: boolean }) {
  return (
    <div className="p-6 rounded-2xl border dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-center">
      <div className="text-sm opacity-70">{title}</div>
      <div className={`font-bold ${big ? 'text-7xl' : 'text-4xl'} tracking-tight`}>
        {children}
      </div>
    </div>
  );
}

function Milestone({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border text-center ${
      active 
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900' 
        : 'dark:border-gray-800'
    }`}>
      {label}
    </div>
  );
}
