import { useEffect, useMemo, useRef, useState } from 'react';
import { RequireRole } from '../../components/auth/RequireRole';
import { useAuth } from '../../hooks/useAuth';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function MeetupLiveOpsPage() {
  const clubId = location.pathname.split('/')[2];
  const meetId = location.pathname.split('/')[4];
  const { user } = useAuth();
  const [totals, setTotals] = useState({ rsvp: 0, checkout: 0, paid: 0, checkin: 0 });
  const [series, setSeries] = useState<{ t: number; rsvp: number; paid: number; checkin: number }[]>([]);
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('/admin/live');
    sseRef.current = es;
    
    es.addEventListener('e', (ev: any) => {
      const data = JSON.parse(ev.data || '{}');
      if (data.meetupId !== meetId) return;
      
      if (data.type === 'rsvp') setTotals(p => ({ ...p, rsvp: p.rsvp + 1 }));
      if (data.type === 'checkout') setTotals(p => ({ ...p, checkout: p.checkout + 1 }));
      if (data.type === 'paid') setTotals(p => ({ ...p, paid: p.paid + 1 }));
      if (data.type === 'checkin') setTotals(p => ({ ...p, checkin: p.checkin + 1 }));
      
      setSeries(p => [
        ...p.slice(-119), 
        { 
          t: Date.now(), 
          rsvp: data.type === 'rsvp' ? 1 : 0, 
          paid: data.type === 'paid' ? 1 : 0, 
          checkin: data.type === 'checkin' ? 1 : 0 
        }
      ]);
    });
    
    return () => {
      es.close();
    };
  }, [meetId]);

  const minAgo = useMemo(() => new Date(Date.now() - 60_000).toLocaleTimeString(), []);

  return (
    <RequireRole clubId={clubId} roles={['owner', 'manager', 'coach', 'staff']}>
      <div className="mx-auto max-w-6xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">라이브 운영 대시보드</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['RSVP', totals.rsvp],
            ['결제시작', totals.checkout],
            ['결제완료', totals.paid],
            ['체크인', totals.checkin],
          ].map(([k, v]) => (
            <div key={k as string} className="rounded-2xl border p-4 bg-white/80 dark:bg-zinc-900">
              <div className="text-sm text-zinc-500">{k}</div>
              <div className="text-3xl font-bold">{v as number}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border p-4 bg-white/80 dark:bg-zinc-900">
          <div className="text-sm text-zinc-500 mb-4">최근 2분 이벤트 스트림</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="t" 
                tickFormatter={(t) => new Date(t).toLocaleTimeString()} 
                hide
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(t) => new Date(Number(t)).toLocaleTimeString()} 
              />
              <Bar dataKey="rsvp" stackId="x" fill="#3b82f6" fillOpacity={0.8} />
              <Bar dataKey="paid" stackId="x" fill="#10b981" fillOpacity={0.8} />
              <Bar dataKey="checkin" stackId="x" fill="#f59e0b" fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border p-4 bg-white/80 dark:bg-zinc-900">
            <div className="text-sm text-zinc-500 mb-2">전환율</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>RSVP → 결제시작</span>
                <span className="font-medium">
                  {totals.rsvp > 0 ? ((totals.checkout / totals.rsvp) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>결제시작 → 결제완료</span>
                <span className="font-medium">
                  {totals.checkout > 0 ? ((totals.paid / totals.checkout) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>결제완료 → 체크인</span>
                <span className="font-medium">
                  {totals.paid > 0 ? ((totals.checkin / totals.paid) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-4 bg-white/80 dark:bg-zinc-900">
            <div className="text-sm text-zinc-500 mb-2">상태</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">실시간 연결됨</span>
              </div>
              <div className="text-xs text-zinc-500">
                마지막 업데이트: {minAgo}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
