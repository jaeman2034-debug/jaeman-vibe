import React, { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function EventEsportsTab({ gameId }: { gameId: string }) {
  const [rows, setRows] = useState<{ uid: string; best: number }[]>([]);
  
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const fn = httpsCallable(getFunctions(), 'getLeaderboard');
        const { data }: any = await fn({ gameId, topN: 50 });
        if (mounted) setRows(data || []);
      } catch {
        // Functions가 아직 없으면 더미 표시
        if (mounted) setRows([{ uid: 'demo', best: 123 }]);
      }
    })();
    return () => { mounted = false; };
  }, [gameId]);

  if (!rows.length) return <div className="p-4 rounded-xl border text-sm text-gray-500">리더보드가 아직 없습니다.</div>;
  
  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-2 text-left">순위</th>
            <th className="p-2 text-left">유저</th>
            <th className="p-2 text-right">점수</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.uid} className="border-t">
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{r.uid}</td>
              <td className="p-2 text-right">{r.best.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
