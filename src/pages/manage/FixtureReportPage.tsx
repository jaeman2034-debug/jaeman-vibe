import { useEffect, useState } from 'react';
import { RequireRole } from '../../components/auth/RequireRole';
import { useAuth } from '../../hooks/useAuth';

export default function FixtureReportPage() {
  const clubId = location.pathname.split('/')[2];
  const fid = location.pathname.split('/')[4];
  const { user } = useAuth();
  const [report, setReport] = useState<any>({
    events: [],
    score: { home: 0, away: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [clubId, fid]);

  async function loadReport() {
    try {
      setLoading(true);
      const res = await fetch(`/api/clubs/${clubId}/fixtures/${fid}/report`);
      const data = await res.json();
      if (data.report) {
        setReport(data.report);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  }

  function addEvent(type: string) {
    setReport((prev: any) => ({
      ...prev,
      events: [...prev.events, {
        t: Date.now(),
        type,
        teamId: '',
        player: '',
        minute: '',
        note: ''
      }]
    }));
  }

  function updateEvent(index: number, field: string, value: any) {
    setReport((prev: any) => {
      const newEvents = [...prev.events];
      newEvents[index] = { ...newEvents[index], [field]: value };
      return { ...prev, events: newEvents };
    });
  }

  function removeEvent(index: number) {
    setReport((prev: any) => ({
      ...prev,
      events: prev.events.filter((_: any, i: number) => i !== index)
    }));
  }

  async function save() {
    try {
      await fetch(`/api/clubs/${clubId}/fixtures/${fid}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      alert('저장되었습니다');
    } catch (error) {
      alert('저장 실패');
    }
  }

  async function lock() {
    if (!confirm('리포트를 확정하시겠습니까? 확정 후에는 수정할 수 없습니다.')) {
      return;
    }
    
    try {
      await fetch(`/api/clubs/${clubId}/fixtures/${fid}/report/lock`, {
        method: 'POST'
      });
      alert('확정되었습니다. 순위가 업데이트됩니다.');
      loadReport();
    } catch (error) {
      alert('확정 실패');
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <RequireRole clubId={clubId} roles={['owner', 'manager', 'assignor', 'official', 'coach', 'staff']}>
      <div className="mx-auto max-w-3xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">경기 리포트</h1>
        
        <div className="text-sm text-zinc-500">
          경기 ID: {fid}
          {report.locked && (
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
              확정됨
            </span>
          )}
        </div>

        {/* 점수 입력 */}
        <div className="grid grid-cols-2 gap-4">
          <label className="rounded-xl border p-4">
            <div className="text-sm font-medium mb-2">홈팀</div>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg border"
              value={report.score.home}
              onChange={e => setReport((prev: any) => ({
                ...prev,
                score: { ...prev.score, home: Number(e.target.value || 0) }
              }))}
              disabled={report.locked}
            />
          </label>
          <label className="rounded-xl border p-4">
            <div className="text-sm font-medium mb-2">어웨이팀</div>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg border"
              value={report.score.away}
              onChange={e => setReport((prev: any) => ({
                ...prev,
                score: { ...prev.score, away: Number(e.target.value || 0) }
              }))}
              disabled={report.locked}
            />
          </label>
        </div>

        {/* 이벤트 추가 버튼 */}
        {!report.locked && (
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'goal', label: '골' },
              { key: 'own_goal', label: '자책골' },
              { key: 'yellow', label: '옐로카드' },
              { key: 'red', label: '레드카드' },
              { key: 'sub', label: '교체' },
              { key: 'note', label: '메모' }
            ].map(item => (
              <button
                key={item.key}
                className="px-3 py-2 rounded-xl border hover:bg-gray-50"
                onClick={() => addEvent(item.key)}
              >
                + {item.label}
              </button>
            ))}
          </div>
        )}

        {/* 이벤트 목록 */}
        <div className="rounded-2xl border divide-y">
          {report.events.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              이벤트가 없습니다.
            </div>
          ) : (
            report.events.map((event: any, idx: number) => (
              <div key={idx} className="p-4 grid grid-cols-6 gap-2 items-center">
                <select
                  className="px-2 py-1 rounded-lg border"
                  value={event.type}
                  onChange={e => updateEvent(idx, 'type', e.target.value)}
                  disabled={report.locked}
                >
                  <option value="goal">골</option>
                  <option value="own_goal">자책골</option>
                  <option value="yellow">옐로카드</option>
                  <option value="red">레드카드</option>
                  <option value="sub">교체</option>
                  <option value="note">메모</option>
                </select>
                
                <input
                  className="px-2 py-1 rounded-lg border"
                  placeholder="팀 ID"
                  value={event.teamId || ''}
                  onChange={e => updateEvent(idx, 'teamId', e.target.value)}
                  disabled={report.locked}
                />
                
                <input
                  className="px-2 py-1 rounded-lg border"
                  placeholder="선수명"
                  value={event.player || ''}
                  onChange={e => updateEvent(idx, 'player', e.target.value)}
                  disabled={report.locked}
                />
                
                <input
                  type="number"
                  className="px-2 py-1 rounded-lg border"
                  placeholder="분"
                  value={event.minute || ''}
                  onChange={e => updateEvent(idx, 'minute', Number(e.target.value || 0))}
                  disabled={report.locked}
                />
                
                <input
                  className="px-2 py-1 rounded-lg border"
                  placeholder="메모"
                  value={event.note || ''}
                  onChange={e => updateEvent(idx, 'note', e.target.value)}
                  disabled={report.locked}
                />
                
                {!report.locked && (
                  <button
                    className="text-red-600 text-sm hover:bg-red-50 px-2 py-1 rounded"
                    onClick={() => removeEvent(idx)}
                  >
                    삭제
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* MVP 선택 */}
        <div className="grid grid-cols-2 gap-4">
          <label className="rounded-xl border p-4">
            <div className="text-sm font-medium mb-2">MVP 팀</div>
            <input
              className="w-full px-3 py-2 rounded-lg border"
              placeholder="팀 ID"
              value={report.mvp?.teamId || ''}
              onChange={e => setReport((prev: any) => ({
                ...prev,
                mvp: { ...prev.mvp, teamId: e.target.value }
              }))}
              disabled={report.locked}
            />
          </label>
          <label className="rounded-xl border p-4">
            <div className="text-sm font-medium mb-2">MVP 선수</div>
            <input
              className="w-full px-3 py-2 rounded-lg border"
              placeholder="선수명"
              value={report.mvp?.name || ''}
              onChange={e => setReport((prev: any) => ({
                ...prev,
                mvp: { ...prev.mvp, name: e.target.value }
              }))}
              disabled={report.locked}
            />
          </label>
        </div>

        {/* 관중 수 */}
        <label className="rounded-xl border p-4">
          <div className="text-sm font-medium mb-2">관중 수</div>
          <input
            type="number"
            className="w-full px-3 py-2 rounded-lg border"
            placeholder="관중 수"
            value={report.attendance || ''}
            onChange={e => setReport((prev: any) => ({
              ...prev,
              attendance: Number(e.target.value || 0)
            }))}
            disabled={report.locked}
          />
        </label>

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          {!report.locked && (
            <>
              <button
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200"
                onClick={save}
              >
                저장
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800"
                onClick={lock}
              >
                확정 (순위 반영)
              </button>
            </>
          )}
          <button
            className="px-4 py-2 rounded-xl border hover:bg-gray-50"
            onClick={loadReport}
          >
            새로고침
          </button>
        </div>
      </div>
    </RequireRole>
  );
}
