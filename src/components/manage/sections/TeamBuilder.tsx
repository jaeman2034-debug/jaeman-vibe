import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';

type Row = { id: string; position?: string; level?: string; tags?: string[]; note?: string };

export default function TeamBuilder({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [pos, setPos] = useState('');
  const [lv, setLv] = useState('');
  const [tag, setTag] = useState('');
  const [teams, setTeams] = useState<{ name: string; color?: string; uids: string[] }[]>([
    { name: '팀 1', uids: [] },
    { name: '팀 2', uids: [] }
  ]);

  const load = async () => {
    const qs = await getDocs(collection(db, `events/${eventId}/attendees`));
    setRows(qs.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
  };
  useEffect(() => { load(); }, [eventId]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const hitQ = !q || r.id.includes(q) || (r.note || '').includes(q);
      const hitP = !pos || r.position === pos;
      const hitL = !lv || r.level === lv;
      const hitT = !tag || (r.tags || []).some((t: string) => t.toLowerCase().includes(tag.toLowerCase()));
      const inTeam = teams.some(t => t.uids.includes(r.id));
      return hitQ && hitP && hitL && hitT && !inTeam;
    });
  }, [rows, q, pos, lv, tag, teams]);

  const suggest = async (n: number) => {
    const fn = httpsCallable(getFunctions(), 'suggestTeams');
    const { data }: any = await fn({ eventId, teamCount: n });
    setTeams((data.teams as any[]).map((t, i) => ({ name: t.name || `팀 ${i + 1}`, uids: t.uids })));
  };

  const save = async () => {
    const fn = httpsCallable(getFunctions(), 'saveTeams');
    await fn({ eventId, teams });
    alert('팀이 저장되었습니다.');
  };

  // DnD
  const onDrop = (teamIdx: number, uid: string) => {
    // 기존 팀에서 제거
    setTeams(prev => {
      const cp = prev.map(t => ({ ...t, uids: [...t.uids] }));
      cp.forEach(t => t.uids = t.uids.filter(x => x !== uid));
      cp[teamIdx].uids.push(uid);
      return cp;
    });
  };

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">팀 배정</h3>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-xl border" onClick={() => suggest(2)}>자동(2팀)</button>
          <button className="px-3 py-2 rounded-xl border" onClick={() => suggest(4)}>자동(4팀)</button>
          <button className="px-3 py-2 rounded-xl border" onClick={save}>저장</button>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="grid md:grid-cols-4 gap-2">
        <input 
          className="border rounded-lg p-2" 
          placeholder="검색(UID/메모)" 
          value={q} 
          onChange={e => setQ(e.target.value)} 
        />
        <select className="border rounded-lg p-2" value={pos} onChange={e => setPos(e.target.value)}>
          <option value="">포지션</option>
          <option>GK</option>
          <option>DF</option>
          <option>MF</option>
          <option>FW</option>
          <option>G</option>
          <option>F</option>
          <option>C</option>
        </select>
        <select className="border rounded-lg p-2" value={lv} onChange={e => setLv(e.target.value)}>
          <option value="">레벨</option>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
        <input 
          className="border rounded-lg p-2" 
          placeholder="태그 포함" 
          value={tag} 
          onChange={e => setTag(e.target.value)} 
        />
      </div>

      {/* 풀(미배정) */}
      <div className="rounded-xl border p-3">
        <div className="text-sm font-medium mb-2">미배정 ({filtered.length}) — 드래그해서 팀으로 이동</div>
        <div className="flex flex-wrap gap-2">
          {filtered.map(r => (
            <div 
              key={r.id} 
              draggable 
              onDragStart={e => e.dataTransfer.setData('text/plain', r.id)}
              className="px-3 py-1 rounded-lg border text-sm bg-gray-50"
            >
              {r.id}{r.level ? ` · ${r.level}` : ''}{r.position ? ` · ${r.position}` : ''}
            </div>
          ))}
          {!filtered.length && <div className="text-xs text-gray-500">필터에 해당 없음</div>}
        </div>
      </div>

      {/* 팀 보드 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {teams.map((t, idx) => (
          <div 
            key={idx}
            onDragOver={e => e.preventDefault()}
            onDrop={e => onDrop(idx, e.dataTransfer.getData('text/plain'))}
            className="rounded-2xl border p-3 bg-white"
          >
            <div className="flex items-center justify-between mb-2">
              <input 
                className="font-semibold text-lg outline-none" 
                value={t.name}
                onChange={e => setTeams(prev => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
              />
              <div className="text-xs text-gray-500">{t.uids.length}명</div>
            </div>
            <ul className="space-y-1">
              {t.uids.map(uid => (
                <li key={uid} className="flex items-center justify-between rounded-lg border px-2 py-1 text-sm">
                  <span>{uid}</span>
                  <button 
                    className="text-xs text-gray-500" 
                    onClick={() => {
                      setTeams(prev => prev.map((x, i) => i === idx ? { ...x, uids: x.uids.filter(v => v !== uid) } : x));
                    }}
                  >
                    제거
                  </button>
                </li>
              ))}
              {!t.uids.length && <li className="text-xs text-gray-400">드래그하여 추가</li>}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
