import { useEffect, useState } from 'react';
import type { Ticket } from '../../types/ticket';
import { useAuth } from '../../hooks/useAuth';
import { formatKRW, formatTicketState, getTicketStateColor, canCancelTicket, CANCEL_REASONS } from '../../utils/ui';

export default function MyTicketsPage() {
  const { user, ready, loginGoogle } = useAuth();
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      try {
        const idToken = await user.getIdToken();
        const r = await fetch('/api/my-tickets', { 
          headers: { Authorization: `Bearer ${idToken}` } 
        });
        const j = await r.json();
        if (r.ok) setItems(j.items || []);
      } catch (e) {
        console.error('Failed to load tickets:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.uid]);

  const handleCancel = async (ticket: Ticket) => {
    if (!user || !canCancelTicket(ticket)) return;
    
    const reason = prompt('취소 사유를 선택하세요:\n1. 일정 변경\n2. 날씨\n3. 부상/질병\n4. 교통 문제\n5. 기타\n\n번호를 입력하거나 직접 입력하세요:', '5');
    if (!reason) return;
    
    if (!confirm('정말로 이 티켓을 취소하시겠습니까?')) return;
    
    setCancelling(ticket.id);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/tickets/${ticket.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        // 티켓 상태 업데이트
        setItems(prev => prev.map(t => 
          t.id === ticket.id 
            ? { ...t, state: 'cancelled', cancelledAt: Date.now() }
            : t
        ));
        alert('티켓이 취소되었습니다.');
      } else {
        const error = await response.json();
        alert(`취소 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (e) {
      console.error('Cancel failed:', e);
      alert('취소 중 오류가 발생했습니다.');
    } finally {
      setCancelling(null);
    }
  };

  if (!ready) return <div className="p-6 text-sm text-zinc-500">불러오는 중…</div>;
  if (!user) return (
    <div className="p-6">
      <button 
        className="px-3 py-2 rounded-xl bg-black text-white" 
        onClick={loginGoogle}
      >
        로그인하고 보기
      </button>
    </div>
  );

  const now = Date.now();
  const filt = items.filter(t => 
    tab === 'all' ? true : 
    (tab === 'upcoming' ? (t.eventEnd || t.eventStart || 0) >= now : (t.eventEnd || t.eventStart || 0) < now)
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-3">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 티켓</h1>
        <div className="flex gap-1 text-sm">
          {(['upcoming', 'past', 'all'] as const).map(k => (
            <button 
              key={k} 
              onClick={() => setTab(k)} 
              className={`px-3 py-1 rounded-full ${
                tab === k 
                  ? 'bg-black text-white' 
                  : 'bg-zinc-100 dark:bg-zinc-800'
              }`}
            >
              {k === 'upcoming' ? '예정' : k === 'past' ? '지난' : '전체'}
            </button>
          ))}
        </div>
      </header>

      {loading && (
        <div className="text-center py-8 text-sm text-zinc-500">
          티켓을 불러오는 중...
        </div>
      )}

      <div className="grid gap-3">
        {!loading && filt.length === 0 && (
          <div className="text-center py-8 text-sm text-zinc-500">
            {tab === 'upcoming' ? '예정된 티켓이 없습니다.' :
             tab === 'past' ? '지난 티켓이 없습니다.' : 
             '티켓이 없습니다.'}
          </div>
        )}
        
        {filt.map(t => (
          <div 
            key={t.id} 
            className="rounded-2xl border p-4 bg-white/90 dark:bg-zinc-900 flex items-center gap-4"
          >
            <div className="w-24 h-24 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
              <img 
                src={`/ticket/${t.id}.png`} 
                alt={`QR Code for ${t.id}`} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden text-xs text-center text-zinc-500 p-2">
                QR<br />코드
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate mb-1">
                예약ID: {t.id}
              </div>
              <div className="text-sm text-zinc-500 mb-1">
                모임: {t.meetupId}
              </div>
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTicketStateColor(t.state)}`}>
                {formatTicketState(t.state)}
              </div>
              {t.amount && t.amount > 0 && (
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {formatKRW(t.amount)} {t.currency || 'KRW'}
                </div>
              )}
              <div className="text-xs text-zinc-500 mt-1">
                {t.eventStart ? new Date(t.eventStart).toLocaleString() : ''}
              </div>
            </div>
            
            <div className="flex flex-col gap-2 items-end">
              <a 
                className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors" 
                href={`/ics/${t.id}.ics`}
                download
              >
                캘린더
              </a>
              <a 
                className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors" 
                href={`/ticket/${t.id}.png`}
                target="_blank"
                rel="noopener noreferrer"
              >
                QR 보기
              </a>
              {t.state === 'paid' && (
                <a 
                  className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors" 
                  href={`/checkin?id=${t.id}&sig=`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  체크인
                </a>
              )}
              {canCancelTicket(t) && (
                <button
                  className="px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-sm hover:bg-red-200 dark:hover:bg-red-800 transition-colors disabled:opacity-50"
                  onClick={() => handleCancel(t)}
                  disabled={cancelling === t.id}
                >
                  {cancelling === t.id ? '취소 중...' : '취소'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
