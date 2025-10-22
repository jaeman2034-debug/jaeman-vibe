import { useEffect, useState } from 'react';
import { RequireRole } from '../../components/auth/RequireRole';

export default function MeetupRoiPage() {
  const clubId = location.pathname.split('/')[2];
  const id = location.pathname.split('/')[4];
  const [items, setItems] = useState<any[]>([]);
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (from) q.set('from', String(new Date(from).getTime()));
      if (to) q.set('to', String(new Date(to).getTime()));
      
      const j = await (await fetch(`/admin/reports/meetups/${id}/roi?` + q.toString())).json();
      setItems(j.items || []);
    } catch (error) {
      console.error('Failed to load ROI data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  return (
    <RequireRole clubId={clubId} roles={['owner', 'manager']}>
      <div className="mx-auto max-w-6xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">채널 ROI</h1>
        
        <div className="flex gap-2 items-end">
          <div>
            <div className="text-xs text-zinc-500">From</div>
            <input 
              type="date" 
              className="px-2 py-1 rounded-lg border" 
              value={from} 
              onChange={e => setFrom(e.target.value)} 
            />
          </div>
          <div>
            <div className="text-xs text-zinc-500">To</div>
            <input 
              type="date" 
              className="px-2 py-1 rounded-lg border" 
              value={to} 
              onChange={e => setTo(e.target.value)} 
            />
          </div>
          <button 
            className="px-3 py-2 rounded-xl bg-black text-white disabled:opacity-50" 
            onClick={load}
            disabled={loading}
          >
            {loading ? '조회 중...' : '조회'}
          </button>
          <a 
            className="px-3 py-2 rounded-xl border hover:bg-gray-50" 
            href={`/admin/reports/meetups/${id}/roi.csv`}
          >
            CSV 다운로드
          </a>
        </div>
        
        <div className="rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="text-left p-3">Source</th>
                <th className="text-right p-3">Visits</th>
                <th className="text-right p-3">RSVP</th>
                <th className="text-right p-3">Checkout</th>
                <th className="text-right p-3">Paid</th>
                <th className="text-right p-3">Revenue</th>
                <th className="text-right p-3">Cost</th>
                <th className="text-right p-3">CAC</th>
                <th className="text-right p-3">ROAS</th>
                <th className="text-right p-3">ARPU</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r: any) => (
                <tr key={r.source} className="border-t hover:bg-gray-50 dark:hover:bg-zinc-800">
                  <td className="p-3 font-medium">{r.source}</td>
                  <td className="p-3 text-right">{r.visits.toLocaleString()}</td>
                  <td className="p-3 text-right">{r.rsvp.toLocaleString()}</td>
                  <td className="p-3 text-right">{r.checkout.toLocaleString()}</td>
                  <td className="p-3 text-right">{r.paid.toLocaleString()}</td>
                  <td className="p-3 text-right">₩{Number(r.revenue).toLocaleString()}</td>
                  <td className="p-3 text-right">₩{Number(r.cost || 0).toLocaleString()}</td>
                  <td className="p-3 text-right">{Number.isFinite(r.cac) ? `₩${Math.round(Number(r.cac)).toLocaleString()}` : '∞'}</td>
                  <td className="p-3 text-right">{r.roas == null ? '-' : r.roas.toFixed(2)}</td>
                  <td className="p-3 text-right">₩{Math.round(Number(r.arpu)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {items.length === 0 && !loading && (
            <div className="p-8 text-center text-zinc-500">
              데이터가 없습니다.
            </div>
          )}
        </div>
        
        <div className="text-xs text-zinc-500">
          * ARPU (Average Revenue Per User): 방문자당 평균 매출<br/>
          * CAC (Customer Acquisition Cost): 고객 획득 비용<br/>
          * ROAS (Return on Ad Spend): 광고 지출 대비 수익률
        </div>
      </div>
    </RequireRole>
  );
}
