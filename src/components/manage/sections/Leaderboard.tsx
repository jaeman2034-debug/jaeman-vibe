import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Leaderboard({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  
  const load = async () => {
    const qs = await getDocs(
      query(
        collection(db, `events/${eventId}/standings`), 
        orderBy('points', 'desc'),
        orderBy('pct', 'desc'), 
        orderBy('diff', 'desc')
      )
    );
    setRows(qs.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
  };
  
  useEffect(() => { load(); }, [eventId]);

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">랭킹(그룹)</h3>
        <button onClick={load} className="px-3 py-2 rounded-xl border">새로고침</button>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 w-10">#</th>
              <th className="p-2">팀</th>
              <th className="p-2 w-14">경기</th>
              <th className="p-2 w-14">승</th>
              <th className="p-2 w-14">무</th>
              <th className="p-2 w-14">패</th>
              <th className="p-2 w-16">득실</th>
              <th className="p-2 w-16">승점</th>
              <th className="p-2 w-16">승률</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{i + 1}</td>
                <td className="p-2">{r.id}</td>
                <td className="p-2">{r.played || 0}</td>
                <td className="p-2">{r.win || 0}</td>
                <td className="p-2">{r.draw || 0}</td>
                <td className="p-2">{r.loss || 0}</td>
                <td className="p-2">{(r.diff || 0) >= 0 ? `+${r.diff}` : r.diff}</td>
                <td className="p-2">{r.points ?? '-'}</td>
                <td className="p-2">{Math.round((r.pct || 0) * 100)}%</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={9} className="p-4 text-center text-gray-500">데이터 없음</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
