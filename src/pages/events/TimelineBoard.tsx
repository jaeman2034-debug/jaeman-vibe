import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useParams, Link } from 'react-router-dom';
import { db } from '@/lib/firebase';

export default function TimelineBoard() {
  const { id: eventId } = useParams();
  const [rows, setRows] = useState<any[]>([]);
  
  const load = async () => {
    const qs = await getDocs(query(collection(db, `events/${eventId}/timeline`), orderBy('order', 'asc')));
    setRows(qs.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
  };
  
  useEffect(() => { load(); }, [eventId]);

  const current = useMemo(() => rows.find(r => r.status === 'running'), [rows]);
  const next = useMemo(() => rows.find(r => r.status !== 'done' && r.id !== current?.id), [rows, current]);

  const startNext = async () => {
    const fn = httpsCallable(getFunctions(), 'timeline.startNext');
    await fn({ eventId });
    await load();
  };
  
  const markDone = async (id: string) => {
    const fn = httpsCallable(getFunctions(), 'timeline.markDone');
    await fn({ eventId, id });
    await load();
  };

  return (
    <div className="min-h-screen p-6 bg-white dark:bg-black text-black dark:text-white">
      <div className="flex items-center justify-between">
        <Link to={`/events/${eventId}`} className="text-sm underline opacity-70">이벤트로</Link>
        <div className="flex gap-2">
          <button onClick={startNext} className="px-3 py-2 rounded-xl border">다음 시작</button>
          {current && (
            <button onClick={() => markDone(current.id)} className="px-3 py-2 rounded-xl border">
              현재 완료
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        <Card title="현재 진행" big>
          {current ? (
            <div>
              <div className="text-3xl font-bold">{current.title}</div>
              <div className="text-sm opacity-70">{current.type} · {current.durMin}분</div>
            </div>
          ) : '없음'}
        </Card>
        <Card title="다음">
          {next ? (
            <div>
              <div className="text-xl font-semibold">{next.title}</div>
              <div className="text-sm opacity-70">{next.type} · {next.durMin}분</div>
            </div>
          ) : '끝'}
        </Card>
        <Card title="진행률">
          <Progress rows={rows} />
        </Card>
      </div>

      <div className="mt-6 rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="p-2 text-left w-16">#</th>
              <th className="p-2 text-left">제목</th>
              <th className="p-2 text-left w-24">유형</th>
              <th className="p-2 text-left w-24">상태</th>
              <th className="p-2 text-left w-24">시간</th>
              <th className="p-2 text-left w-28">액션</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.order}</td>
                <td className="p-2">{r.title}</td>
                <td className="p-2">{r.type}</td>
                <td className="p-2">{r.status || 'pending'}</td>
                <td className="p-2">{r.durMin}분</td>
                <td className="p-2">
                  {r.status !== 'done' && (
                    <button 
                      onClick={() => markDone(r.id)} 
                      className="px-2 py-1 rounded-lg border text-xs"
                    >
                      완료
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">타임라인 없음</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, big, children }: { title: string; big?: boolean; children: any }) {
  return (
    <div className="p-5 rounded-2xl border dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
      <div className="text-sm opacity-70">{title}</div>
      <div className={`${big ? 'text-2xl' : ''}`}>{children}</div>
    </div>
  );
}

function Progress({ rows }: { rows: any[] }) {
  const total = rows.length || 1;
  const done = rows.filter(r => r.status === 'done').length;
  const pct = Math.round((done / total) * 100);
  
  return (
    <div className="space-y-2">
      <div className="w-full h-4 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-black dark:bg-white" 
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-sm">{done}/{total} · {pct}%</div>
    </div>
  );
}
