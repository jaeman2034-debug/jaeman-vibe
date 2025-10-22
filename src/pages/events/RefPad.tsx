import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query, where, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Link, useParams } from 'react-router-dom';
import { db } from '@/lib/firebase';

export default function RefPad() {
  const { id: eventId, courtId } = useParams();
  const fn = (n: string) => httpsCallable(getFunctions(), n);
  const [pin, setPin] = useState('');
  const [court, setCourt] = useState<any>(null);
  const [asns, setAsns] = useState<any[]>([]);
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [remain, setRemain] = useState<number>(0);

  const load = async () => {
    const c = await getDoc(doc(db, `events/${eventId}/courts/${courtId}`));
    setCourt({ id: c.id, ...(c.data() as any) });
    const qs = await getDocs(query(
      collection(db, `events/${eventId}/court_assignments`), 
      where('courtId', '==', courtId), 
      orderBy('order', 'asc')
    ));
    setAsns(qs.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
  };
  
  useEffect(() => { load(); }, [eventId, courtId]);

  const running = useMemo(() => asns.find(a => a.status === 'running'), [asns]);
  const queued = useMemo(() => asns.find(a => a.status === 'queued'), [asns]);
  const DUR = (running?.durMin ?? 20) * 60; // 초

  // 타이머 효과
  useEffect(() => {
    let t: any;
    const tick = () => {
      if (!running?.startedAt?.toDate) return setRemain(0);
      const started = running.startedAt.toDate().getTime() / 1000 | 0;
      const now = Date.now() / 1000 | 0;
      const left = Math.max(0, DUR - (now - started));
      setRemain(left);
      // 임계 알림
      if (left === 60) speak('1분 남았습니다');       // TTS
      if ([300, 60, 30, 10].includes(left)) beep();      // 비프
    };
    tick();
    t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [running?.id, DUR]);

  function beep(freq = 880, ms = 120, vol = 0.5) {
    const C = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = C.createOscillator();
    const g = C.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g).connect(C.destination);
    o.start();
    setTimeout(() => { o.stop(); C.close(); }, ms);
  }

  function speakKo(txt: string) {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = 'ko-KR';
      window.speechSynthesis.speak(u);
    }
  }

  async function countdown() {
    speakKo('카운트다운 시작');
    await new Promise(r => setTimeout(r, 300));
    [3, 2, 1].forEach((n, i) => setTimeout(() => {
      speakKo(String(n));
      beep(700 + i * 80, 180, 0.6);
    }, i * 900));
    setTimeout(() => { 
      speakKo('시작'); 
      beep(1200, 400, 0.7); 
    }, 3 * 900);
  }

  const startNext = async () => {
    const target = running || queued;
    if (!target) return alert('대기열이 없습니다.');
    await fn('startAssignment')({ eventId, assignmentId: target.id, pin });
    await load();
  };

  const call = (n: string) => httpsCallable(getFunctions(), n);
  
  const bump = async (side: 'A' | 'B', delta: number) => {
    if (!running) return;
    const na = Math.max(0, (running.liveA ?? 0) + (side === 'A' ? delta : 0));
    const nb = Math.max(0, (running.liveB ?? 0) + (side === 'B' ? delta : 0));
    await call('updateLiveScore')({ eventId, matchId: running.matchId, a: na, b: nb });
    await load();
  };

  const submit = async () => {
    if (!running) return alert('진행 중인 경기가 없습니다.');
    await fn('reportMatch')({ eventId, matchId: running.matchId, scoreA, scoreB });
    await fn('completeAssignment')({ eventId, assignmentId: running.id, pin });
    setScoreA(0);
    setScoreB(0);
    await load();
    await httpsCallable(getFunctions(), 'recomputeStandings')({ eventId });
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">심판 패드</h1>
        <Link to={`/events/${eventId}/courts`} className="underline text-sm">코트 보드</Link>
      </div>
      
      <div className="rounded-xl border p-3">
        <div className="text-sm">코트: <b>{court?.name || courtId}</b></div>
        <input 
          value={pin} 
          onChange={e => setPin(e.target.value)} 
          placeholder="PIN" 
          className="border rounded-lg p-2 w-full mt-2"
        />
      </div>

      {running && (
        <div className="rounded-xl border p-3 text-center">
          <div className="text-sm text-gray-500">남은 시간</div>
          <div className="text-4xl font-bold tabular-nums">
            {Math.floor(remain / 60)}:{String(remain % 60).padStart(2, '0')}
          </div>
          <div className="flex gap-2 justify-center mt-2">
            <button 
              onClick={() => speakKo('다음 팀 입장 준비해 주세요')} 
              className="px-3 py-2 rounded-xl border"
            >
              입장 호출
            </button>
            <button 
              onClick={() => { beep(1200, 400, 0.7); }} 
              className="px-3 py-2 rounded-xl border"
            >
              비프
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={countdown} 
              className="px-3 py-2 rounded-xl border w-full"
            >
              3-2-1 카운트다운
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border p-3 space-y-2">
        <div className="text-sm font-medium">현재 경기</div>
        {running ? (
          <div className="space-y-2">
            <div className="text-lg font-bold">{running.matchId}</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 justify-center">
                <button 
                  onClick={() => bump('A', -1)} 
                  className="px-3 py-2 border rounded"
                >
                  -
                </button>
                <div className="text-3xl font-bold tabular-nums">
                  {running.liveA ?? 0}
                </div>
                <button 
                  onClick={() => bump('A', +1)} 
                  className="px-3 py-2 border rounded"
                >
                  +
                </button>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <button 
                  onClick={() => bump('B', -1)} 
                  className="px-3 py-2 border rounded"
                >
                  -
                </button>
                <div className="text-3xl font-bold tabular-nums">
                  {running.liveB ?? 0}
                </div>
                <button 
                  onClick={() => bump('B', +1)} 
                  className="px-3 py-2 border rounded"
                >
                  +
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                value={scoreA} 
                onChange={e => setScoreA(Number(e.target.value))} 
                className="border rounded-lg p-3 text-center text-2xl" 
                placeholder="최종 A"
              />
              <input 
                type="number" 
                value={scoreB} 
                onChange={e => setScoreB(Number(e.target.value))} 
                className="border rounded-lg p-3 text-center text-2xl" 
                placeholder="최종 B"
              />
            </div>
            <button 
              onClick={submit} 
              className="px-3 py-2 rounded-xl border w-full"
            >
              스코어 제출 & 완료
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-500">없음</div>
        )}
      </div>

      <div className="rounded-xl border p-3 space-y-2">
        <div className="text-sm font-medium">다음 경기</div>
        {queued ? (
          <div className="space-y-2">
            <div>{queued.matchId}</div>
            {!running && (
              <button 
                onClick={startNext} 
                className="px-3 py-2 rounded-xl border w-full"
              >
                시작
              </button>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">대기 없음</div>
        )}
      </div>
    </div>
  );
}
