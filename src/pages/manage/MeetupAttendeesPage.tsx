import { useEffect, useState } from 'react';
import { RequireRole } from '../../components/auth/RequireRole';
import { useAuth } from '../../hooks/useAuth';
import { formatKRW, formatTicketState, getTicketStateColor, formatDate } from '../../utils/ui';

interface Attendee {
  id: string;
  user: {
    name?: string;
    email?: string;
    uid?: string;
  };
  state: string;
  amount: number;
  currency: string;
  paidAt?: number;
  checkedInAt?: number;
  cancelledAt?: number;
  createdAt: number;
}

export default function MeetupAttendeesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<{
    capacity: number;
    paid: number;
    pending: number;
    waitlist: number;
    available: number;
    isFull: boolean;
  } | null>(null);

  // URL에서 clubId와 meetupId 추출
  const pathParts = location.pathname.split('/');
  const clubId = pathParts[2];
  const meetupId = pathParts[4];

  useEffect(() => {
    (async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`/api/clubs/${clubId}/meetups/${meetupId}/attendees`, {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setItems(data.items || []);
        } else {
          console.error('Failed to load attendees:', response.status);
        }
      } catch (e) {
        console.error('Failed to load attendees:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.uid, clubId, meetupId]);

  // 용량 정보 로드
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`/api/meetups/${meetupId}/capacity`);
        if (response.ok) {
          const data = await response.json();
          setCapacity(data);
        }
      } catch (e) {
        console.error('Failed to load capacity:', e);
      }
    })();
  }, [meetupId]);

  const handleCancel = async (attendee: Attendee) => {
    if (!user || attendee.state === 'cancelled' || attendee.state === 'checkedIn') return;
    
    const reason = prompt('취소 사유를 입력하세요:', 'admin cancel');
    if (!reason) return;
    
    if (!confirm(`정말로 ${attendee.user?.name || attendee.user?.email || attendee.id}의 티켓을 취소/환불하시겠습니까?`)) return;
    
    setCancelling(attendee.id);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/clubs/${clubId}/tickets/${attendee.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        // 티켓 상태 업데이트
        setItems(prev => prev.map(item => 
          item.id === attendee.id 
            ? { ...item, state: 'cancelled', cancelledAt: Date.now() }
            : item
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

  const handleExportCSV = async () => {
    if (!user) return;
    
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/clubs/${clubId}/meetups/${meetupId}/attendees.csv`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendees-${meetupId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('CSV 다운로드 실패');
      }
    } catch (e) {
      console.error('CSV export failed:', e);
      alert('CSV 다운로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <RequireRole clubId={clubId} roles={['owner', 'manager', 'coach']}>
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">참가자 콘솔</h1>
            <div className="text-sm text-zinc-500 mt-1 space-y-1">
              <div>모임 ID: {meetupId} • 총 {items.length}명</div>
              {capacity && (
                <div className="flex gap-4 text-xs">
                  <span>정원: {capacity.capacity === Infinity ? '무제한' : capacity.capacity}</span>
                  <span>확정: {capacity.paid}</span>
                  <span>보류: {capacity.pending}</span>
                  <span>대기: {capacity.waitlist}</span>
                  <span className={capacity.isFull ? 'text-red-500' : 'text-green-500'}>
                    {capacity.isFull ? '정원 마감' : `여유: ${capacity.available}`}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              disabled={loading || items.length === 0}
            >
              CSV 다운로드
            </button>
          </div>
        </header>

        {loading && (
          <div className="text-center py-8 text-sm text-zinc-500">
            참가자 목록을 불러오는 중...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-8 text-sm text-zinc-500">
            참가자가 없습니다.
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="rounded-2xl border overflow-hidden bg-white dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800 border-b">
                  <tr>
                    <th className="p-4 text-left font-medium">참가자</th>
                    <th className="p-4 text-center font-medium">상태</th>
                    <th className="p-4 text-right font-medium">금액</th>
                    <th className="p-4 text-center font-medium">결제일시</th>
                    <th className="p-4 text-center font-medium">체크인</th>
                    <th className="p-4 text-center font-medium">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((attendee) => (
                    <tr key={attendee.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">
                            {attendee.user?.name || '이름 없음'}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {attendee.user?.email || attendee.id}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTicketStateColor(attendee.state)}`}>
                          {formatTicketState(attendee.state)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {attendee.amount > 0 ? (
                          <span className="font-medium">
                            {formatKRW(attendee.amount)}
                          </span>
                        ) : (
                          <span className="text-zinc-500">무료</span>
                        )}
                      </td>
                      <td className="p-4 text-center text-xs text-zinc-500">
                        {attendee.paidAt ? formatDate(attendee.paidAt, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td className="p-4 text-center text-xs text-zinc-500">
                        {attendee.checkedInAt ? formatDate(attendee.checkedInAt, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td className="p-4 text-center">
                        {attendee.state !== 'cancelled' && attendee.state !== 'checkedIn' && (
                          <button
                            className="px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs hover:bg-red-200 dark:hover:bg-red-800 transition-colors disabled:opacity-50"
                            onClick={() => handleCancel(attendee)}
                            disabled={cancelling === attendee.id}
                          >
                            {cancelling === attendee.id ? '처리 중...' : '취소/환불'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 통계 요약 */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-600 dark:text-blue-400">총 참가자</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {items.length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-600 dark:text-green-400">체크인 완료</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {items.filter(item => item.state === 'checkedIn').length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="text-sm text-yellow-600 dark:text-yellow-400">결제 대기</div>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {items.filter(item => item.state === 'pending').length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="text-sm text-red-600 dark:text-red-400">취소됨</div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {items.filter(item => item.state === 'cancelled').length}
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireRole>
  );
}
