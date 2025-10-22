import { useEffect, useState } from 'react';
import { oqTake, oqRemove, oqCount } from '@/lib/offlineQueue';
import { flushCheckinsOnce } from '@/lib/flushCheckins';

type Row = { id: string; token: string; ts: number; attempts: number; lastError?: string|null };

export default function StaffQueueDebug() {
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  async function load() {
    const batch = await oqTake(1000);
    setRows(batch); setCount(await oqCount());
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">오프라인 큐 디버그</h1>
      <div className="text-sm text-gray-600">대기: {count}건</div>
      <div className="flex gap-2">
        <button disabled={busy} onClick={async () => { setBusy(true); await flushCheckinsOnce(50); setBusy(false); await load(); }}
          className="px-3 py-1 rounded bg-black text-white disabled:opacity-50">지금 전송</button>
        <button disabled={busy} onClick={async () => { setBusy(true); await oqRemove(rows.map(r => r.id)); setBusy(false); await load(); }}
          className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-50">전체 삭제</button>
        <button onClick={load} className="px-3 py-1 rounded border">새로고침</button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="text-left border-b">
            <th className="py-2 pr-4">토큰</th><th className="py-2 pr-4">시각</th>
            <th className="py-2 pr-4">시도</th><th className="py-2 pr-4">최근 에러</th><th className="py-2 pr-4">액션</th>
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b">
                <td className="py-2 pr-4 break-all">{r.id.slice(0,16)}…</td>
                <td className="py-2 pr-4">{new Date(r.ts).toLocaleString()}</td>
                <td className="py-2 pr-4">{r.attempts || 0}</td>
                <td className="py-2 pr-4">{r.lastError || '-'}</td>
                <td className="py-2 pr-4">
                  <button className="px-2 py-1 rounded border mr-2" onClick={async () => { setBusy(true); await flushCheckinsOnce(1); setBusy(false); await load(); }}>전송</button>
                  <button className="px-2 py-1 rounded border" onClick={async () => { setBusy(true); await oqRemove([r.id]); setBusy(false); await load(); }}>삭제</button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className="py-6 text-gray-500">대기 없음</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}