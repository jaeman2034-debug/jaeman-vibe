import { useEffect, useState } from 'react';
import { RequireRole } from '../../components/auth/RequireRole';

export default function MeetupRoiCostsPage() {
  const clubId = location.pathname.split('/')[2];
  const id = location.pathname.split('/')[4];
  const [items, setItems] = useState<any[]>([{ source: 'x', campaign: 'og', cost: 0, ts: Date.now() }]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (from) q.set('from', String(new Date(from).getTime()));
      if (to) q.set('to', String(new Date(to).getTime()));
      
      const j = await (await fetch(`/admin/reports/meetups/${id}/costs?` + q.toString())).json();
      setList(j.items || []);
    } catch (error) {
      console.error('Failed to load costs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    try {
      await fetch(`/admin/reports/meetups/${id}/costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      await load();
      alert('저장되었습니다');
    } catch (error) {
      alert('저장 실패');
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  return (
    <RequireRole clubId={clubId} roles={['owner', 'manager']}>
      <div className="mx-auto max-w-4xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">채널 비용 입력</h1>
        
        <div className="grid gap-2">
          <div className="text-sm text-zinc-500 mb-2">새 비용 추가</div>
          {items.map((r, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 items-center">
              <input 
                className="px-2 py-1 rounded-lg border" 
                placeholder="source (x, instagram, etc)" 
                value={r.source} 
                onChange={e => setItems(p => p.map((x, ix) => ix === i ? { ...x, source: e.target.value } : x))} 
              />
              <input 
                className="px-2 py-1 rounded-lg border" 
                placeholder="campaign" 
                value={r.campaign || ''} 
                onChange={e => setItems(p => p.map((x, ix) => ix === i ? { ...x, campaign: e.target.value } : x))} 
              />
              <input 
                className="px-2 py-1 rounded-lg border" 
                type="number" 
                placeholder="cost (원)" 
                value={r.cost} 
                onChange={e => setItems(p => p.map((x, ix) => ix === i ? { ...x, cost: Number(e.target.value || 0) } : x))} 
              />
              <input 
                className="px-2 py-1 rounded-lg border" 
                type="datetime-local" 
                value={new Date(r.ts).toISOString().slice(0, 16)} 
                onChange={e => setItems(p => p.map((x, ix) => ix === i ? { ...x, ts: new Date(e.target.value).getTime() } : x))} 
              />
              <button 
                className="px-2 py-1 rounded-lg border hover:bg-red-50" 
                onClick={() => setItems(p => p.filter((_, ix) => ix !== i))}
              >
                삭제
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <button 
              className="px-3 py-2 rounded-xl border hover:bg-gray-50" 
              onClick={() => setItems(p => [...p, { source: '', campaign: '', cost: 0, ts: Date.now() }])}
            >
              행 추가
            </button>
            <button 
              className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800" 
              onClick={save}
            >
              저장
            </button>
          </div>
        </div>
        
        <div className="pt-4">
          <div className="text-sm text-zinc-500 mb-2">기존 비용 조회</div>
          <div className="flex gap-2 items-end">
            <input 
              type="date" 
              className="px-2 py-1 rounded-lg border" 
              value={from} 
              onChange={e => setFrom(e.target.value)} 
            />
            <input 
              type="date" 
              className="px-2 py-1 rounded-lg border" 
              value={to} 
              onChange={e => setTo(e.target.value)} 
            />
            <button 
              className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50" 
              onClick={load}
              disabled={loading}
            >
              {loading ? '조회 중...' : '조회'}
            </button>
          </div>
          
          <div className="mt-2 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="p-2 text-left">Source</th>
                  <th className="p-2 text-left">Campaign</th>
                  <th className="p-2 text-right">Cost</th>
                  <th className="p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r: any, idx: number) => (
                  <tr key={idx} className="border-t hover:bg-gray-50 dark:hover:bg-zinc-800">
                    <td className="p-2 font-medium">{r.source}</td>
                    <td className="p-2">{r.campaign || ''}</td>
                    <td className="p-2 text-right">₩{Number(r.cost).toLocaleString()}</td>
                    <td className="p-2">{new Date(r.ts).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {list.length === 0 && !loading && (
              <div className="p-8 text-center text-zinc-500">
                데이터가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
