import { useEffect, useState } from 'react';
import { RequireRole } from '../../components/auth/RequireRole';
import { useAuth } from '../../hooks/useAuth';

export default function FixtureAssignPage() {
  const clubId = location.pathname.split('/')[2];
  const fid = location.pathname.split('/')[4];
  const { user } = useAuth();
  const [officials, setOfficials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [clubId, fid]);

  async function loadData() {
    try {
      setLoading(true);
      
      // 심판 목록 조회
      const officialsRes = await fetch(`/api/clubs/${clubId}/officials`);
      const officialsData = await officialsRes.json();
      setOfficials(officialsData?.items || []);
      
      // 배정 현황 조회
      const assignmentsRes = await fetch(`/api/clubs/${clubId}/fixtures/${fid}/assignments`);
      const assignmentsData = await assignmentsRes.json();
      setAssignments(assignmentsData?.items || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggle(uid: string, role: string) {
    setAssignments(prev => {
      const exists = prev.find((x: any) => x.uid === uid && x.role === role);
      if (exists) {
        return prev.filter((x: any) => !(x.uid === uid && x.role === role));
      }
      return [...prev, { uid, role }];
    });
  }

  function isAssigned(uid: string, role: string) {
    return assignments.some((x: any) => x.uid === uid && x.role === role);
  }

  async function save() {
    try {
      await fetch(`/api/clubs/${clubId}/fixtures/${fid}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: assignments })
      });
      alert('저장되었습니다');
      loadData();
    } catch (error) {
      alert('저장 실패');
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
    <RequireRole clubId={clubId} roles={['owner', 'manager', 'assignor']}>
      <div className="mx-auto max-w-3xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">심판 배정</h1>
        
        <div className="text-sm text-zinc-500">
          경기 ID: {fid}
        </div>

        <div className="space-y-3">
          {officials.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              등록된 심판이 없습니다.
            </div>
          ) : (
            officials.map((official: any) => (
              <div key={official.uid} className="rounded-xl border p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{official.name || official.uid}</div>
                  <div className="text-sm text-zinc-500">
                    {official.grade && `등급: ${official.grade}`}
                    {official.badges && official.badges.length > 0 && (
                      <span className="ml-2">
                        배지: {official.badges.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {['referee', 'ar1', 'ar2', 'table', 'umpire'].map(role => (
                    <button
                      key={role}
                      onClick={() => toggle(official.uid, role)}
                      className={`px-3 py-1 rounded-lg border text-sm transition-colors ${
                        isAssigned(official.uid, role)
                          ? 'bg-black text-white border-black'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {role === 'referee' ? '주심' :
                       role === 'ar1' ? '부심1' :
                       role === 'ar2' ? '부심2' :
                       role === 'table' ? '기록원' :
                       role === 'umpire' ? '심판' : role}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {assignments.length > 0 && (
          <div className="rounded-xl border p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">현재 배정 현황</h3>
            <div className="space-y-1">
              {assignments.map((assignment: any, idx: number) => (
                <div key={idx} className="text-sm">
                  {assignment.role === 'referee' ? '주심' :
                   assignment.role === 'ar1' ? '부심1' :
                   assignment.role === 'ar2' ? '부심2' :
                   assignment.role === 'table' ? '기록원' :
                   assignment.role === 'umpire' ? '심판' : assignment.role}: {assignment.uid}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800"
            onClick={save}
          >
            저장
          </button>
          <button
            className="px-4 py-2 rounded-xl border hover:bg-gray-50"
            onClick={loadData}
          >
            새로고침
          </button>
        </div>
      </div>
    </RequireRole>
  );
}
