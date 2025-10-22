import { useEffect, useState } from 'react';
import { RequireRole } from '../../components/auth/RequireRole';
import { BucketGauges } from '../../components/meetups/BucketGauges';

function useSSE(meetId: string) {
  const [stats, setStats] = useState({ rsvp: 0, checkout: 0, paid: 0, checkin: 0 });
  
  useEffect(() => {
    const es = new EventSource('/admin/live');
    
    es.addEventListener('e', (ev: any) => {
      const d = JSON.parse(ev.data || '{}'); 
      if (d.meetupId !== meetId) return;
      
      setStats(p => ({
        rsvp: p.rsvp + (d.type === 'rsvp' ? 1 : 0),
        checkout: p.checkout + (d.type === 'checkout' ? 1 : 0),
        paid: p.paid + (d.type === 'paid' ? 1 : 0),
        checkin: p.checkin + (d.type === 'checkin' ? 1 : 0),
      }));
    });
    
    return () => es.close();
  }, [meetId]);
  
  return stats;
}

export default function MeetupKioskPage() {
  const clubId = location.pathname.split('/')[2];
  const meetId = location.pathname.split('/')[4];
  const stats = useSSE(meetId);
  const [full, setFull] = useState(false);
  const [caps, setCaps] = useState<any>(null);
  
  useEffect(() => {
    let t: any;
    async function pull() {
      const j = await (await fetch(`/api/meetups/${meetId}/capacity`)).json();
      setCaps(j);
    }
    pull();
    t = setInterval(pull, 5000);
    return () => clearInterval(t);
  }, [meetId]);

  async function goFull() {
    if (!document.fullscreenElement) { 
      await document.documentElement.requestFullscreen(); 
      setFull(true); 
    } else { 
      await document.exitFullscreen(); 
      setFull(false); 
    }
  }

  return (
    <RequireRole clubId={clubId} roles={['owner', 'manager', 'coach', 'staff']}>
      <div className="min-h-screen p-6 bg-black text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">YAGO — Live Kiosk</h1>
          <button 
            onClick={goFull} 
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-gray-200 transition-colors"
          >
            {full ? '창모드' : '전체화면'}
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            ['RSVP', stats.rsvp, '#3b82f6'],
            ['결제시작', stats.checkout, '#8b5cf6'],
            ['결제완료', stats.paid, '#10b981'],
            ['체크인', stats.checkin, '#f59e0b'],
          ].map(([k, v, color]) => (
            <div key={k as string} className="rounded-2xl p-6 bg-zinc-900/80 text-center border-2" style={{ borderColor: color }}>
              <div className="text-zinc-400 text-lg mb-2">{k}</div>
              <div className="text-6xl font-extrabold tracking-tight" style={{ color }}>
                {v as number}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="text-zinc-500 text-sm">
            마지막 업데이트: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* 버킷별 정원 게이지 */}
        <div className="mt-8">
          <BucketGauges caps={caps} />
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-4 bg-zinc-900/80">
            <h3 className="text-lg font-semibold mb-2">전환율</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>RSVP → 결제시작</span>
                <span className="font-medium">
                  {stats.rsvp > 0 ? ((stats.checkout / stats.rsvp) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>결제시작 → 결제완료</span>
                <span className="font-medium">
                  {stats.checkout > 0 ? ((stats.paid / stats.checkout) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>결제완료 → 체크인</span>
                <span className="font-medium">
                  {stats.paid > 0 ? ((stats.checkin / stats.paid) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-zinc-900/80">
            <h3 className="text-lg font-semibold mb-2">상태</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm">실시간 연결됨</span>
              </div>
              <div className="text-xs text-zinc-500">
                Meetup ID: {meetId}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
