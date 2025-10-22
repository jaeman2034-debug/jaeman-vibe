import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function TeamDetailPage() {
  const clubId = location.pathname.split('/')[2];
  const teamId = location.pathname.split('/')[4];
  const { user } = useAuth();
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [meetups, setMeetups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        
        // 팀 정보 조회
        const teamRes = await fetch(`/api/teams/${teamId}?clubId=${clubId}`);
        const teamData = await teamRes.json();
        setTeam(teamData?.team || null);
        
        // 멤버 조회
        const membersRes = await fetch(`/api/teams/${teamId}/members?clubId=${clubId}`);
        const membersData = await membersRes.json();
        setMembers(membersData?.items || []);
        
        // 일정 조회
        const fixturesRes = await fetch(`/api/clubs/${clubId}/teams/${teamId}/fixtures`);
        const fixturesData = await fixturesRes.json();
        setFixtures(fixturesData?.items || []);
        
        // 관련 모임 조회 (팀이 참가하는 모임)
        try {
          const meetupsRes = await fetch(`/api/clubs/${clubId}/meetups?teamId=${teamId}`);
          const meetupsData = await meetupsRes.json();
          setMeetups(meetupsData?.items || []);
        } catch (error) {
          console.error('Failed to load meetups:', error);
        }
      } catch (error) {
        console.error('Failed to load team data:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [teamId, clubId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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

  const upcomingFixtures = fixtures
    .filter(f => f.status === 'scheduled' && f.startAt > Date.now())
    .slice(0, 5);

  const recentFixtures = fixtures
    .filter(f => f.status === 'finished')
    .slice(-3);

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      {/* 팀 헤더 */}
      <div className="flex items-center gap-4">
        {team.logoUrl && (
          <img 
            src={team.logoUrl} 
            className="w-16 h-16 rounded-xl object-cover"
            alt={`${team.name} 로고`}
          />
        )}
        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <div className="text-sm text-zinc-500">
            {team.sport} · {team.region || '지역 미설정'}
          </div>
          {team.hashtags && team.hashtags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {team.hashtags.map((tag: string, idx: number) => (
                <span key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 팀 소개 */}
      {team.bio && (
        <div className="prose dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: team.bio }} />
        </div>
      )}

      {/* 팀 배너 */}
      {team.bannerUrl && (
        <div className="rounded-2xl overflow-hidden">
          <img 
            src={team.bannerUrl} 
            className="w-full h-48 object-cover"
            alt={`${team.name} 배너`}
          />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* 로스터 */}
        <div>
          <h2 className="text-xl font-semibold mb-3">로스터</h2>
          <div className="space-y-2">
            {members.length === 0 ? (
              <div className="text-sm text-zinc-500">멤버가 없습니다</div>
            ) : (
              members.map(member => (
                <div key={member.uid} className="rounded-xl border p-3 flex items-center gap-3">
                  {member.photoURL && (
                    <img 
                      src={member.photoURL} 
                      className="w-8 h-8 rounded-full object-cover"
                      alt={member.displayName || member.uid}
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{member.displayName || member.uid}</div>
                    <div className="text-xs text-zinc-500 capitalize">{member.role}</div>
                  </div>
                  {member.pending && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                      대기중
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 다가오는 일정 */}
        <div>
          <h2 className="text-xl font-semibold mb-3">다가오는 일정</h2>
          <div className="space-y-2">
            {upcomingFixtures.length === 0 ? (
              <div className="text-sm text-zinc-500">예정된 경기가 없습니다</div>
            ) : (
              upcomingFixtures.map(fixture => (
                <div key={fixture.id} className="rounded-xl border p-3">
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
              ))
            )}
          </div>
        </div>
      </div>

      {/* 최근 경기 결과 */}
      {recentFixtures.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">최근 경기 결과</h2>
          <div className="space-y-2">
            {recentFixtures.map(fixture => (
              <div key={fixture.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {fixture.homeTeamId} vs {fixture.awayTeamId}
                  </div>
                  {fixture.score && (
                    <div className="text-lg font-bold">
                      {fixture.score.home} - {fixture.score.away}
                    </div>
                  )}
                </div>
                <div className="text-sm text-zinc-500">
                  {new Date(fixture.startAt).toLocaleString('ko-KR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 관련 모임 */}
      {meetups.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">관련 모임</h2>
          <div className="space-y-2">
            {meetups.map(meetup => (
              <a 
                key={meetup.id} 
                href={`/meetups/${meetup.id}`}
                className="block rounded-xl border p-3 hover:bg-gray-50 dark:hover:bg-zinc-800"
              >
                <div className="font-medium">{meetup.title}</div>
                <div className="text-sm text-zinc-500">
                  {new Date(meetup.dateStart).toLocaleString('ko-KR')}
                </div>
                {meetup.place?.name && (
                  <div className="text-xs text-zinc-400">📍 {meetup.place.name}</div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* iCal 다운로드 */}
      <div className="text-center">
        <a 
          href={`/clubs/${clubId}/teams/${teamId}.ics`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-gray-50"
        >
          📅 일정 다운로드 (.ics)
        </a>
      </div>

      {/* 관리자 액션 */}
      {user && (
        <div className="text-center">
          <a 
            href={`/clubs/${clubId}/manage/teams/${teamId}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800"
          >
            ⚙️ 팀 관리
          </a>
        </div>
      )}
    </div>
  );
}
