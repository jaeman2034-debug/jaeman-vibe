import { useEffect, useState } from 'react';
import { RequireRole } from '../../components/auth/RequireRole';
import { useAuth } from '../../hooks/useAuth';

function startOfWeek(d = new Date()) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const s = new Date(d.setDate(diff));
  s.setHours(0, 0, 0, 0);
  return s;
}

export default function OfficialAvailabilityPage() {
  const clubId = location.pathname.split('/')[2];
  const uid = (new URLSearchParams(location.search)).get('uid') || 'me'; // me=자신
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(startOfWeek());
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailability();
  }, [clubId, weekStart, uid]);

  async function loadAvailability() {
    try {
      setLoading(true);
      const from = weekStart.getTime();
      const to = from + 7 * 24 * 60 * 60 * 1000;
      
      const res = await fetch(`/api/clubs/${clubId}/officials/${uid}/availability?from=${from}&to=${to}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (error) {
      console.error('Failed to load availability:', error);
    } finally {
      setLoading(false);
    }
  }

  function addSlot(status: 'available' | 'unavailable' | 'tentative', dayOffset: number, hour: number) {
    const s = new Date(weekStart.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    s.setHours(hour, 0, 0, 0);
    const endTime = new Date(s.getTime() + 2 * 60 * 60 * 1000); // 2시간 기본
    
    setSlots(prev => [...prev, {
      startAt: s.getTime(),
      endAt: endTime.getTime(),
      status,
      note: ''
    }]);
  }

  function updateSlot(index: number, field: string, value: any) {
    setSlots(prev => {
      const newSlots = [...prev];
      newSlots[index] = { ...newSlots[index], [field]: value };
      return newSlots;
    });
  }

  function removeSlot(index: number) {
    setSlots(prev => prev.filter((_, i) => i !== index));
  }

  async function save() {
    try {
      await fetch(`/api/clubs/${clubId}/officials/${uid}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anchor: weekStart.getTime(),
          slots
        })
      });
      alert('저장되었습니다');
    } catch (error) {
      alert('저장 실패');
    }
  }

  function getSlotsForDay(dayOffset: number) {
    const dayStart = weekStart.getTime() + dayOffset * 24 * 60 * 60 * 1000;
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    return slots.filter(s => s.startAt < dayEnd && s.endAt > dayStart);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'tentative': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unavailable': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <RequireRole clubId={clubId} roles={['owner', 'manager', 'assignor', 'official']}>
      <div className="mx-auto max-w-6xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">가용성 캘린더</h1>
          <div className="text-sm text-zinc-500">
            {uid === 'me' ? '내 가용성' : `심판: ${uid}`}
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <button
            className="px-3 py-1 rounded-xl border hover:bg-gray-50"
            onClick={() => setWeekStart(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000))}
          >
            ◀︎ 이전 주
          </button>
          <div className="px-4 py-2 text-sm font-medium">
            {weekStart.toLocaleDateString('ko-KR')} ~ {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}
          </div>
          <button
            className="px-3 py-1 rounded-xl border hover:bg-gray-50"
            onClick={() => setWeekStart(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000))}
          >
            다음 주 ▶︎
          </button>
          <button
            className="px-3 py-1 rounded-xl bg-black text-white"
            onClick={save}
          >
            저장
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => {
            const dayStart = weekStart.getTime() + i * 24 * 60 * 60 * 1000;
            const dayEnd = dayStart + 24 * 60 * 60 * 1000;
            const daySlots = getSlotsForDay(i);
            const dayName = new Date(dayStart).toLocaleDateString('ko-KR', { weekday: 'short' });
            
            return (
              <div key={i} className="rounded-2xl border p-3 min-h-[200px]">
                <div className="text-sm font-medium text-zinc-700 mb-2">
                  {dayName}
                </div>
                <div className="text-xs text-zinc-500 mb-3">
                  {new Date(dayStart).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </div>
                
                <div className="space-y-2">
                  {daySlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className={`text-xs px-2 py-1 rounded-lg border ${getStatusColor(slot.status)}`}
                    >
                      <div className="font-medium">
                        {new Date(slot.startAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} ~ {new Date(slot.endAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs opacity-75">
                        {slot.status === 'available' ? '가능' :
                         slot.status === 'tentative' ? '미정' : '불가능'}
                      </div>
                      {slot.note && (
                        <div className="text-xs opacity-75 mt-1">
                          {slot.note}
                        </div>
                      )}
                      <button
                        className="text-xs text-red-600 hover:bg-red-50 px-1 py-0.5 rounded mt-1"
                        onClick={() => removeSlot(slots.indexOf(slot))}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex gap-1 flex-wrap">
                    {[
                      { key: 'available', label: '가능', color: 'bg-green-50 text-green-700' },
                      { key: 'tentative', label: '미정', color: 'bg-yellow-50 text-yellow-700' },
                      { key: 'unavailable', label: '불가', color: 'bg-red-50 text-red-700' }
                    ].map(item => (
                      <button
                        key={item.key}
                        className={`px-2 py-1 rounded-lg border text-xs ${item.color}`}
                        onClick={() => addSlot(item.key as any, i, 9)}
                      >
                        + {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 시간대별 빠른 추가 */}
        <div className="rounded-xl border p-4 bg-gray-50">
          <h3 className="text-sm font-medium mb-3">빠른 시간 추가</h3>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="text-xs text-zinc-500">
                  {new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR', { weekday: 'short' })}
                </div>
                <div className="space-y-1">
                  {[9, 14, 19].map(hour => (
                    <button
                      key={hour}
                      className="w-full px-2 py-1 rounded text-xs bg-white border hover:bg-gray-50"
                      onClick={() => addSlot('available', i, hour)}
                    >
                      {hour}:00
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 가용성 통계 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {slots.filter(s => s.status === 'available').length}
            </div>
            <div className="text-sm text-zinc-500">가능한 시간</div>
          </div>
          <div className="rounded-xl border p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {slots.filter(s => s.status === 'tentative').length}
            </div>
            <div className="text-sm text-zinc-500">미정 시간</div>
          </div>
          <div className="rounded-xl border p-3 text-center">
            <div className="text-2xl font-bold text-red-600">
              {slots.filter(s => s.status === 'unavailable').length}
            </div>
            <div className="text-sm text-zinc-500">불가능한 시간</div>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
