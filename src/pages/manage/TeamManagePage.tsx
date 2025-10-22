import { useEffect, useState } from 'react';
import { RequireRole } from '../../components/auth/RequireRole';
import { useAuth } from '../../hooks/useAuth';

export default function TeamManagePage() {
  const clubId = location.pathname.split('/')[2];
  const teamId = location.pathname.split('/')[4];
  const { user } = useAuth();
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 폼 상태
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [newFixture, setNewFixture] = useState({
    homeTeamId: '',
    awayTeamId: '',
    startAt: '',
    venue: '',
    divisionId: ''
  });

  useEffect(() => {
    loadData();
  }, [teamId, clubId]);

  async function loadData() {
    try {
      setLoading(true);
      
      // 팀 정보
      const teamRes = await fetch(`/api/teams/${teamId}?clubId=${clubId}`);
      const teamData = await teamRes.json();
      setTeam(teamData?.team || null);
      
      // 멤버
      const membersRes = await fetch(`/api/teams/${teamId}/members?clubId=${clubId}`);
      const membersData = await membersRes.json();
      setMembers(membersData?.items || []);
      
      // 가입 요청
      const requestsRes = await fetch(`/api/clubs/${clubId}/teams/${teamId}/joinRequests`);
      const requestsData = await requestsRes.json();
      setJoinRequests(requestsData?.items || []);
      
      // 일정
      const fixturesRes = await fetch(`/api/clubs/${clubId}/teams/${teamId}/fixtures`);
      const fixturesData = await fixturesRes.json();
      setFixtures(fixturesData?.items || []);
    } catch (error) {
      console.error('Failed to load team data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function inviteMember() {
    if (!email.trim()) return;
    
    try {
      await fetch(`/api/clubs/${clubId}/teams/${teamId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: inviteRole })
      });
      alert('초대가 발송되었습니다');
      setEmail('');
      loadData();
    } catch (error) {
      alert('초대 발송 실패');
    }
  }

  async function handleJoinRequest(requestId: string, action: 'approve' | 'reject') {
    try {
      await fetch(`/api/clubs/${clubId}/teams/${teamId}/joinRequests/${requestId}/${action}`, {
        method: 'POST'
      });
      alert(action === 'approve' ? '승인되었습니다' : '거절되었습니다');
      loadData();
    } catch (error) {
      alert('처리 실패');
    }
  }

  async function createFixture() {
    if (!newFixture.homeTeamId || !newFixture.awayTeamId || !newFixture.startAt) return;
    
    try {
      await fetch(`/api/clubs/${clubId}/fixtures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newFixture,
          startAt: new Date(newFixture.startAt).getTime(),
          homeTeamId: teamId // 현재 팀을 홈팀으로 설정
        })
      });
      alert('경기가 등록되었습니다');
      setNewFixture({
        homeTeamId: '',
        awayTeamId: '',
        startAt: '',
        venue: '',
        divisionId: ''
      });
      loadData();
    } catch (error) {
      alert('경기 등록 실패');
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-500">팀을 찾을 수 없습니다</h1>
        </div>
      </div>
    );
  }

  return (
    <RequireRole clubId={clubId} roles={['owner', 'manager', 'coach', 'captain']}>
      <div className="mx-auto max-w-4xl p-6 space-y-6">
        <h1 className="text-2xl font-bold">팀 관리 — {team.name}</h1>

        {/* 멤버 초대 */}
        <div className="rounded-2xl border p-4 space-y-3">
          <h2 className="text-lg font-semibold">멤버 초대</h2>
          <div className="flex gap-2">
            <input 
              className="px-3 py-2 rounded-xl border flex-1" 
              placeholder="이메일 주소" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
            <select 
              className="px-3 py-2 rounded-xl border"
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
            >
              <option value="member">멤버</option>
              <option value="captain">주장</option>
              <option value="coach">코치</option>
            </select>
            <button 
              className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800" 
              onClick={inviteMember}
            >
              초대
            </button>
          </div>
        </div>

        {/* 가입 요청 */}
        {joinRequests.filter(r => r.state === 'pending').length > 0 && (
          <div className="rounded-2xl border p-4 space-y-3">
            <h2 className="text-lg font-semibold">가입 요청</h2>
            <div className="space-y-2">
              {joinRequests
                .filter(r => r.state === 'pending')
                .map(request => (
                  <div key={request.id} className="flex items-center justify-between p-3 rounded-xl border">
                    <div>
                      <div className="font-medium">{request.fromUid}</div>
                      {request.message && (
                        <div className="text-sm text-zinc-500">{request.message}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="px-3 py-1 rounded-lg bg-green-100 text-green-800 hover:bg-green-200"
                        onClick={() => handleJoinRequest(request.id, 'approve')}
                      >
                        승인
                      </button>
                      <button 
                        className="px-3 py-1 rounded-lg bg-red-100 text-red-800 hover:bg-red-200"
                        onClick={() => handleJoinRequest(request.id, 'reject')}
                      >
                        거절
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* 로스터 관리 */}
        <div className="rounded-2xl border p-4 space-y-3">
          <h2 className="text-lg font-semibold">로스터</h2>
          <div className="grid md:grid-cols-2 gap-2">
            {members.map(member => (
              <div key={member.uid} className="flex items-center justify-between p-3 rounded-xl border">
                <div className="flex items-center gap-3">
                  {member.photoURL && (
                    <img 
                      src={member.photoURL} 
                      className="w-8 h-8 rounded-full object-cover"
                      alt={member.displayName || member.uid}
                    />
                  )}
                  <div>
                    <div className="font-medium">{member.displayName || member.uid}</div>
                    <div className="text-xs text-zinc-500 capitalize">{member.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.pending && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                      대기중
                    </span>
                  )}
                  <button className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-50">
                    권한변경
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 경기 등록 */}
        <div className="rounded-2xl border p-4 space-y-3">
          <h2 className="text-lg font-semibold">경기 등록</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input 
              className="px-3 py-2 rounded-xl border" 
              placeholder="상대팀 ID" 
              value={newFixture.awayTeamId} 
              onChange={e => setNewFixture(prev => ({ ...prev, awayTeamId: e.target.value }))} 
            />
            <input 
              className="px-3 py-2 rounded-xl border" 
              type="datetime-local" 
              value={newFixture.startAt} 
              onChange={e => setNewFixture(prev => ({ ...prev, startAt: e.target.value }))} 
            />
            <input 
              className="px-3 py-2 rounded-xl border" 
              placeholder="경기장" 
              value={newFixture.venue} 
              onChange={e => setNewFixture(prev => ({ ...prev, venue: e.target.value }))} 
            />
            <input 
              className="px-3 py-2 rounded-xl border" 
              placeholder="디비전 ID (선택)" 
              value={newFixture.divisionId} 
              onChange={e => setNewFixture(prev => ({ ...prev, divisionId: e.target.value }))} 
            />
          </div>
          <button 
            className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800" 
            onClick={createFixture}
          >
            경기 등록
          </button>
        </div>

        {/* 경기 일정 */}
        <div className="rounded-2xl border p-4 space-y-3">
          <h2 className="text-lg font-semibold">경기 일정</h2>
          <div className="space-y-2">
            {fixtures.length === 0 ? (
              <div className="text-sm text-zinc-500">등록된 경기가 없습니다</div>
            ) : (
              fixtures.map(fixture => (
                <div key={fixture.id} className="flex items-center justify-between p-3 rounded-xl border">
                  <div>
                    <div className="font-medium">
                      {fixture.homeTeamId} vs {fixture.awayTeamId}
                    </div>
                    <div className="text-sm text-zinc-500">
                      {new Date(fixture.startAt).toLocaleString('ko-KR')}
                    </div>
                    {fixture.venue && (
                      <div className="text-xs text-zinc-400">📍 {fixture.venue}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      fixture.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      fixture.status === 'finished' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {fixture.status === 'scheduled' ? '예정' :
                       fixture.status === 'finished' ? '완료' : '취소'}
                    </span>
                    {fixture.score && (
                      <div className="text-sm font-bold">
                        {fixture.score.home} - {fixture.score.away}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 블로그 생성 */}
        <div className="rounded-2xl border p-4 space-y-3">
          <h2 className="text-lg font-semibold">블로그 생성</h2>
          <p className="text-sm text-zinc-500">
            팀 정보를 기반으로 자동 블로그 포스트를 생성합니다.
          </p>
          <button 
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            onClick={async () => {
              try {
                const res = await fetch(`/api/clubs/${clubId}/teams/${teamId}/blog`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    posts: [{
                      title: `${team.name} 팀 소개`,
                      summary: team.bio || `${team.name} 팀의 최신 소식과 경기 일정을 확인하세요.`,
                      url: `${window.location.origin}/clubs/${clubId}/teams/${teamId}`,
                      og: team.logoUrl
                    }]
                  })
                });
                const result = await res.json();
                alert(result.ok ? '블로그 생성 요청이 완료되었습니다' : '블로그 생성 실패');
              } catch (error) {
                alert('블로그 생성 실패');
              }
            }}
          >
            블로그 생성
          </button>
        </div>
      </div>
    </RequireRole>
  );
}
