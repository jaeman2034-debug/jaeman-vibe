import { useEffect, useState } from 'react';
import { RequireRole } from '../../components/auth/RequireRole';

export default function AutoAssignPage() {
  const clubId = location.pathname.split('/')[2];
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any>({});
  const [minRest, setMinRest] = useState(30);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    loadFixtures();
  }, [clubId]);

  async function loadFixtures() {
    try {
      setLoading(true);
      const res = await fetch(`/api/clubs/${clubId}/fixtures`);
      const data = await res.json();
      setFixtures(data.items || []);
    } catch (error) {
      console.error('Failed to load fixtures:', error);
    } finally {
      setLoading(false);
    }
  }

  async function runRecommendations(commit = false) {
    try {
      setRunning(true);
      const res = await fetch(`/api/clubs/${clubId}/fixtures/auto-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixtureIds: selected,
          minRestMin: minRest,
          commit
        })
      });
      const data = await res.json();
      setSuggestions(data.suggestions || {});
      
      if (commit) {
        alert('배정이 저장되었습니다');
        loadFixtures(); // 새로고침
      }
    } catch (error) {
      console.error('Failed to run recommendations:', error);
      alert('추천 실행 실패');
    } finally {
      setRunning(false);
    }
  }

  function toggleFixture(fixtureId: string) {
    setSelected(prev => 
      prev.includes(fixtureId) 
        ? prev.filter(id => id !== fixtureId)
        : [...prev, fixtureId]
    );
  }

  function selectAll() {
    setSelected(fixtures.map(f => f.id));
  }

  function selectNone() {
    setSelected([]);
  }

  function getFixtureStatus(fixture: any) {
    const now = Date.now();
    if (fixture.startAt < now) return 'past';
    if (fixture.startAt < now + 24 * 60 * 60 * 1000) return 'today';
    return 'future';
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'past': return 'text-gray-500';
      case 'today': return 'text-orange-600 font-medium';
      case 'future': return 'text-green-600';
      default: return 'text-gray-500';
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
    <RequireRole clubId={clubId} roles={['owner', 'manager', 'assignor']}>
      <div className="mx-auto max-w-6xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">자동 배정</h1>
        
        {/* 설정 패널 */}
        <div className="rounded-xl border p-4 bg-gray-50">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">휴식 시간 (분):</label>
              <input
                type="number"
                className="w-24 px-2 py-1 rounded-lg border"
                value={minRest}
                onChange={e => setMinRest(Number(e.target.value || 0))}
                min="0"
                max="480"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                className="px-3 py-2 rounded-xl border hover:bg-gray-50"
                onClick={() => runRecommendations(false)}
                disabled={running || selected.length === 0}
              >
                {running ? '처리 중...' : '추천 보기'}
              </button>
              <button
                className="px-3 py-2 rounded-xl bg-black text-white hover:bg-gray-800"
                onClick={() => runRecommendations(true)}
                disabled={running || selected.length === 0 || Object.keys(suggestions).length === 0}
              >
                추천 적용
              </button>
            </div>
          </div>
        </div>

        {/* 경기 선택 */}
        <div className="rounded-2xl border">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">경기 선택</h3>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded-lg border text-sm hover:bg-gray-50"
                  onClick={selectAll}
                >
                  전체 선택
                </button>
                <button
                  className="px-3 py-1 rounded-lg border text-sm hover:bg-gray-50"
                  onClick={selectNone}
                >
                  전체 해제
                </button>
              </div>
            </div>
          </div>
          
          <div className="divide-y">
            {fixtures.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                등록된 경기가 없습니다.
              </div>
            ) : (
              fixtures.map(fixture => {
                const status = getFixtureStatus(fixture);
                const isSelected = selected.includes(fixture.id);
                
                return (
                  <label
                    key={fixture.id}
                    className={`flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFixture(fixture.id)}
                      disabled={status === 'past'}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${getStatusColor(status)}`}>
                          {new Date(fixture.startAt).toLocaleString('ko-KR')}
                        </span>
                        {status === 'past' && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            완료
                          </span>
                        )}
                        {status === 'today' && (
                          <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded">
                            오늘
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium">
                        {fixture.homeTeamId} vs {fixture.awayTeamId}
                      </div>
                      {fixture.venue && (
                        <div className="text-xs text-zinc-500">
                          📍 {fixture.venue}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* 추천 결과 */}
        {Object.keys(suggestions).length > 0 && (
          <div className="rounded-2xl border">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-medium">추천 결과</h3>
            </div>
            <div className="p-4 space-y-4">
              {Object.entries(suggestions).map(([fixtureId, assignments]: [string, any]) => {
                const fixture = fixtures.find(f => f.id === fixtureId);
                if (!fixture) return null;
                
                return (
                  <div key={fixtureId} className="rounded-xl border p-4">
                    <div className="font-medium mb-2">
                      {new Date(fixture.startAt).toLocaleString('ko-KR')} · {fixture.homeTeamId} vs {fixture.awayTeamId}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {assignments.map((assignment: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                        >
                          <div>
                            <div className="text-sm font-medium">
                              {assignment.role === 'referee' ? '주심' :
                               assignment.role === 'ar1' ? '부심1' :
                               assignment.role === 'ar2' ? '부심2' :
                               assignment.role === 'table' ? '기록원' :
                               assignment.role === 'umpire' ? '심판' : assignment.role}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {assignment.uid}
                            </div>
                          </div>
                          <div className="text-xs text-zinc-400">
                            점수: {assignment.score}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {selected.length}
            </div>
            <div className="text-sm text-zinc-500">선택된 경기</div>
          </div>
          <div className="rounded-xl border p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(suggestions).flat().length}
            </div>
            <div className="text-sm text-zinc-500">추천 배정</div>
          </div>
          <div className="rounded-xl border p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {fixtures.filter(f => getFixtureStatus(f) === 'future').length}
            </div>
            <div className="text-sm text-zinc-500">예정된 경기</div>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
