import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query, where, setDoc, doc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Link, useParams } from 'react-router-dom';
import { db } from '@/lib/firebase';

export default function CourtsBoard() {
  const { id: eventId } = useParams();
  const fn = (n: string) => httpsCallable(getFunctions(), n);
  const [courts, setCourts] = useState<any[]>([]);
  const [assign, setAssign] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');

  const load = async () => {
    const [cs, as, ms] = await Promise.all([
      getDocs(query(collection(db, `events/${eventId}/courts`))),
      getDocs(query(
        collection(db, `events/${eventId}/court_assignments`), 
        orderBy('courtId'), 
        orderBy('order')
      )),
      getDocs(query(
        collection(db, `events/${eventId}/matches`), 
        where('status', 'in', ['pending', 'running'] as any)
      ))
    ]);
    setCourts(cs.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    setAssign(as.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    setMatches(ms.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
  };
  
  useEffect(() => { load(); }, [eventId]);

  const unassigned = useMemo(() => {
    const used = new Set(assign.map(a => a.matchId));
    return matches.filter(m => !used.has(m.id));
  }, [matches, assign]);

  const createCourt = async () => {
    if (!name) return;
    await fn('upsertCourt')({ eventId, name, pin: pin || null, active: true });
    setName('');
    setPin('');
    await load();
  };
  
  const dropToCourt = async (courtId: string, data: string) => {
    const isAssign = data.startsWith('assign:');
    if (isAssign) {
      await fn('moveAssignment')({ 
        eventId, 
        assignmentId: data.replace('assign:', ''), 
        toCourtId: courtId 
      });
    } else {
      await fn('assignMatchToCourt')({ eventId, courtId, matchId: data });
    }
    await load();
  };

  const setDur = async (aId: string, courtId: string, courtName: string) => {
    const v = Number(prompt('이 배정 경기 시간(분)?') || '0');
    if (!v) return;
    await fn('upsertCourt')({ eventId, courtId, name: courtName, active: true }); // (코트 유지용)
    await setDoc(doc(db, `events/${eventId}/court_assignments/${aId}`), { durMin: v }, { merge: true });
    await load();
  };
  
  const start = async (assignmentId: string) => {
    const p = prompt('코트 PIN (스태프는 공백 Enter)') || undefined;
    await fn('startAssignment')({ eventId, assignmentId, pin: p });
    await load();
  };
  
  const scoreDone = async (a: any) => {
    const aScore = Number(prompt('팀 A 점수?') || '0');
    const bScore = Number(prompt('팀 B 점수?') || '0');
    await fn('reportMatch')({ eventId, matchId: a.matchId, scoreA: aScore, scoreB: bScore });
    const p = prompt('코트 PIN (스태프는 공백 Enter)') || undefined;
    await fn('completeAssignment')({ eventId, assignmentId: a.id, pin: p });
    await load();
    await fn('recomputeStandings')({ eventId });
  };

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">코트 보드</h1>
        <Link to={`/events/${eventId}`} className="underline text-sm">이벤트로</Link>
      </div>

      <div className="rounded-xl border p-3 space-y-2">
        <div className="text-sm font-medium">미배정 매치</div>
        <div className="flex flex-wrap gap-2">
          {unassigned.map(m => (
            <div 
              key={m.id} 
              draggable 
              onDragStart={e => e.dataTransfer.setData('text/plain', m.id)}
              className="px-3 py-1 rounded-lg border text-sm bg-gray-50"
            >
              {m.phase === 'bracket' ? 'B' : ''}{m.round} · {m.id} · {m.teamA} vs {m.teamB}
            </div>
          ))}
          {!unassigned.length && (
            <div className="text-xs text-gray-500">모든 매치가 배정됨</div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {courts.map(c => {
          const q = assign.filter(a => a.courtId === c.id);
          const running = q.find(a => a.status === 'running');
          const queued = q.filter(a => a.status !== 'running' && a.status !== 'done');
          
          return (
            <div 
              key={c.id}
              onDragOver={e => e.preventDefault()}
              onDrop={e => dropToCourt(c.id, e.dataTransfer.getData('text/plain'))}
              className="rounded-2xl border p-3"
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">{c.name}</div>
                <Link 
                  className="text-xs underline" 
                  to={`/events/${eventId}/ref/${c.id}`}
                >
                  심판 패드
                </Link>
              </div>

              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">진행 중</div>
                {running ? (
                  <Row 
                    a={running} 
                    onStart={() => {}} 
                    onDone={() => scoreDone(running)}
                  />
                ) : (
                  <div className="text-xs text-gray-400">없음</div>
                )}
              </div>

              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-1">대기열</div>
                <ul className="space-y-1">
                  {queued.map((a, i) => (
                    <li 
                      key={a.id} 
                      draggable 
                      onDragStart={e => e.dataTransfer.setData('text/plain', `assign:${a.id}`)}
                      className="flex items-center justify-between rounded-lg border px-2 py-1 text-sm"
                    >
                      <span>{a.matchId}</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setDur(a.id, c.id, c.name)} 
                          className="text-xs border rounded px-2"
                        >
                          시간
                        </button>
                        <button 
                          onClick={() => start(a.id)} 
                          className="px-2 py-1 rounded-lg border text-xs"
                        >
                          시작
                        </button>
                        <button 
                          onClick={() => scoreDone(a)} 
                          className="px-2 py-1 rounded-lg border text-xs"
                        >
                          완료
                        </button>
                        <UpDown a={a} idx={i} arr={queued} eventId={eventId} />
                      </div>
                    </li>
                  ))}
                  {!queued.length && (
                    <li className="text-xs text-gray-400">없음</li>
                  )}
                </ul>
              </div>
            </div>
          );
        })}
        
        {/* 코트 추가 */}
        <div className="rounded-2xl border p-3">
          <div className="font-semibold mb-2">코트 추가</div>
          <input 
            className="border rounded-lg p-2 mb-2 w-full" 
            placeholder="이름(예: A코트)" 
            value={name} 
            onChange={e => setName(e.target.value)}
          />
          <input 
            className="border rounded-lg p-2 mb-2 w-full" 
            placeholder="PIN(선택)" 
            value={pin} 
            onChange={e => setPin(e.target.value)}
          />
          <button 
            onClick={createCourt} 
            className="px-3 py-2 rounded-xl border w-full"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

function UpDown({ a, idx, arr, eventId }: { a: any; idx: number; arr: any[]; eventId: string }) {
  const move = async (dir: number) => {
    const m: Record<string, number> = {};
    const copy = [...arr];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [copy[idx], copy[j]] = [copy[j], copy[idx]];
    copy.forEach((x, k) => m[x.id] = k + 1);
    await httpsCallable(getFunctions(), 'reorderAssignment')({ 
      eventId, 
      courtId: a.courtId, 
      orderMap: m 
    });
    // 페이지 새로고침은 상위에서 처리
  };

  return (
    <div className="flex gap-1">
      <button 
        onClick={() => move(-1)} 
        className="px-2 py-1 border rounded text-xs"
      >
        ↑
      </button>
      <button 
        onClick={() => move(1)} 
        className="px-2 py-1 border rounded text-xs"
      >
        ↓
      </button>
    </div>
  );
}

function Row({ a, onStart, onDone }: { a: any; onStart: () => void; onDone: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-2 py-1 text-sm">
      <span>{a.matchId}</span>
      <div className="flex gap-2">
        {a.status === 'queued' && (
          <button 
            onClick={onStart} 
            className="px-2 py-1 rounded-lg border text-xs"
          >
            시작
          </button>
        )}
        {a.status !== 'done' && (
          <button 
            onClick={onDone} 
            className="px-2 py-1 rounded-lg border text-xs"
          >
            완료
          </button>
        )}
      </div>
    </div>
  );
}
