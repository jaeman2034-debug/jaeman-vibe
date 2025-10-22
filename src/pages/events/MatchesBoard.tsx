import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Link, useParams } from 'react-router-dom';
import { db } from '@/lib/firebase';

export default function MatchesBoard() {
  const { id: eventId } = useParams();
  const [phase, setPhase] = useState<'all' | 'group' | 'bracket'>('all');
  const [status, setStatus] = useState<'all' | 'pending' | 'running' | 'done'>('all');
  const [rows, setRows] = useState<any[]>([]);
  const fn = (name: string) => httpsCallable(getFunctions(), name);

  const load = async () => {
    let q: any = query(
      collection(db, `events/${eventId}/matches`), 
      orderBy('round', 'asc'), 
      orderBy('order', 'asc')
    );
    if (phase !== 'all') {
      q = query(
        collection(db, `events/${eventId}/matches`), 
        where('phase', '==', phase), 
        orderBy('round', 'asc'), 
        orderBy('order', 'asc')
      );
    }
    const snap = await getDocs(q);
    let arr = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    if (status !== 'all') arr = arr.filter(r => (r.status || 'pending') === status);
    setRows(arr);
  };
  
  useEffect(() => { 
    load(); 
    // eslint-disable-next-line 
  }, [eventId, phase, status]);

  const genRR = async () => { 
    await fn('generateRoundRobin')({ eventId }); 
    await load(); 
  };
  
  const genSE = async () => { 
    await fn('generateSingleElim')({ eventId }); 
    await load(); 
  };
  
  const score = async (id: string) => {
    const mode = prompt('모드 선택: 1=점수(한 경기), 2=세트') || '1';
    if (mode === '2') {
      const a = prompt('팀A 세트 점수 콤마(예: 25,20,15)') || '';
      const b = prompt('팀B 세트 점수 콤마(예: 20,25,13)') || '';
      const setsA = a.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      const setsB = b.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      await fn('reportMatch')({ eventId, matchId: id, setsA, setsB });
    } else {
      const sa = Number(prompt('팀 A 점수?') || '0');
      const sb = Number(prompt('팀 B 점수?') || '0');
      await fn('reportMatch')({ eventId, matchId: id, scoreA: sa, scoreB: sb });
    }
    await load();
    await fn('recomputeStandings')({ eventId });
  };

  const adv = async () => {
    const n = Number(prompt('브래킷으로 진출할 팀 수(N)?') || '0');
    if (!n) return;
    await fn('advanceTopToBracket')({ eventId, topN: n });
    await load();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">매치 보드</h1>
        <Link className="underline text-sm" to={`/events/${eventId}`}>이벤트로</Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={genRR} className="px-3 py-2 rounded-xl border">라운드로빈 생성</button>
        <button onClick={genSE} className="px-3 py-2 rounded-xl border">토너먼트 생성</button>
        <button onClick={adv} className="px-3 py-2 rounded-xl border">상위 N 브래킷 진출</button>
        <select 
          value={phase} 
          onChange={e => setPhase(e.target.value as any)} 
          className="border rounded-lg p-2"
        >
          <option value="all">전체 페이즈</option>
          <option value="group">그룹</option>
          <option value="bracket">토너먼트</option>
        </select>
        <select 
          value={status} 
          onChange={e => setStatus(e.target.value as any)} 
          className="border rounded-lg p-2"
        >
          <option value="all">전체 상태</option>
          <option value="pending">대기</option>
          <option value="running">진행</option>
          <option value="done">완료</option>
        </select>
        <button 
          onClick={() => fn('recomputeStandings')({ eventId })} 
          className="px-3 py-2 rounded-xl border"
        >
          랭킹 재계산
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 w-16">R</th>
              <th className="p-2">팀 A</th>
              <th className="p-2">팀 B</th>
              <th className="p-2 w-24">스코어</th>
              <th className="p-2 w-24">상태</th>
              <th className="p-2 w-36">액션</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.phase?.[0] === 'b' ? `B${r.round}` : r.round}</td>
                <td className="p-2">{r.teamA}</td>
                <td className="p-2">{r.teamB}</td>
                <td className="p-2">{(r.scoreA ?? '-')} : {(r.scoreB ?? '-')}</td>
                <td className="p-2">{r.status || 'pending'}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button 
                      className="px-2 py-1 rounded-lg border text-xs" 
                      onClick={() => score(r.id)}
                    >
                      스코어
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">매치 없음</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
