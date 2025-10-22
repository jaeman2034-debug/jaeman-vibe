import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, auth } from '@/lib/firebase';
import { useParams, useNavigate } from 'react-router-dom';

interface PublicData {
  tagline?: string;
  description?: string;
  schedule?: {
    summary?: string;
    placeName?: string;
    geo?: { lat: number; lng: number; };
  };
  contact?: {
    phone?: string;
    kakaoOpenChat?: string;
    instagram?: string;
    website?: string;
  };
  dues?: {
    amount?: number;
    currency?: string;
    cycle?: 'monthly' | 'season' | 'yearly';
  };
  gallery?: string[];
  achievements?: Array<{
    title: string;
    year?: number;
    desc?: string;
  }>;
  blog?: {
    url?: string;
    provider?: string;
    providerId?: string;
    updatedAt?: any;
  };
}

interface Club {
  name: string;
  ownerUid: string;
  admins: string[];
  public?: PublicData;
}

export default function TeamPublicForm() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // 폼 상태
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleSummary, setScheduleSummary] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [phone, setPhone] = useState('');
  const [kakaoOpenChat, setKakaoOpenChat] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [duesAmount, setDuesAmount] = useState<number>(0);
  const [duesCurrency, setDuesCurrency] = useState('KRW');
  const [duesCycle, setDuesCycle] = useState<'monthly' | 'season' | 'yearly'>('monthly');
  const [newAchievement, setNewAchievement] = useState({ title: '', year: new Date().getFullYear(), desc: '' });
  const [achievements, setAchievements] = useState<Array<{ title: string; year?: number; desc?: string }>>([]);

  useEffect(() => {
    if (!clubId) {
      navigate('/clubs');
      return;
    }
    loadClubData();
  }, [clubId, navigate]);

  const loadClubData = async () => {
    try {
      const clubDoc = await getDoc(doc(db, 'clubs', clubId!));
      if (!clubDoc.exists()) {
        alert('클럽을 찾을 수 없습니다.');
        navigate('/clubs');
        return;
      }

      const clubData = clubDoc.data() as Club;
      setClub(clubData);

      // 권한 확인
      const currentUser = auth.currentUser;
      if (!currentUser || 
          (clubData.ownerUid !== currentUser.uid && 
           !clubData.admins?.includes(currentUser.uid))) {
        alert('관리자 권한이 필요합니다.');
        navigate(`/clubs/${clubId}`);
        return;
      }

      // 기존 데이터로 폼 초기화
      const publicData = clubData.public || {};
      setTagline(publicData.tagline || '');
      setDescription(publicData.description || '');
      setScheduleSummary(publicData.schedule?.summary || '');
      setPlaceName(publicData.schedule?.placeName || '');
      setPhone(publicData.contact?.phone || '');
      setKakaoOpenChat(publicData.contact?.kakaoOpenChat || '');
      setInstagram(publicData.contact?.instagram || '');
      setWebsite(publicData.contact?.website || '');
      setDuesAmount(publicData.dues?.amount || 0);
      setDuesCurrency(publicData.dues?.currency || 'KRW');
      setDuesCycle(publicData.dues?.cycle || 'monthly');
      setAchievements(publicData.achievements || []);
    } catch (error) {
      console.error('클럽 데이터 로드 실패:', error);
      alert('클럽 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const publicData: PublicData = {
        ...club?.public,
        tagline: tagline.trim() || undefined,
        description: description.trim() || undefined,
        schedule: {
          summary: scheduleSummary.trim() || undefined,
          placeName: placeName.trim() || undefined,
        },
        contact: {
          phone: phone.trim() || undefined,
          kakaoOpenChat: kakaoOpenChat.trim() || undefined,
          instagram: instagram.trim() || undefined,
          website: website.trim() || undefined,
        },
        dues: {
          amount: duesAmount || undefined,
          currency: duesCurrency,
          cycle: duesCycle,
        },
        achievements,
      };

      await updateDoc(doc(db, 'clubs', clubId!), {
        public: publicData,
        updatedAt: serverTimestamp(),
      });

      alert('공개 정보가 저장되었습니다!');
      loadClubData(); // 데이터 새로고침
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncBlog = async () => {
    if (syncing) return;

    setSyncing(true);
    try {
      const syncClubBlog = httpsCallable(functions, 'syncClubBlog');
      const result = await syncClubBlog({ clubId });
      const { blogUrl } = result.data as any;
      
      alert(`블로그가 성공적으로 갱신되었습니다!\nURL: ${blogUrl}`);
      loadClubData(); // 데이터 새로고침
    } catch (error: any) {
      console.error('블로그 갱신 실패:', error);
      alert(`블로그 갱신 실패: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const addAchievement = () => {
    if (!newAchievement.title.trim()) {
      alert('수상/전적 제목을 입력해주세요.');
      return;
    }

    setAchievements([...achievements, { ...newAchievement }]);
    setNewAchievement({ title: '', year: new Date().getFullYear(), desc: '' });
  };

  const removeAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-red-600">클럽 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{club.name} 공개 정보</h1>
          <p className="text-gray-600 mt-1">팀 블로그에 표시될 공개 정보를 관리합니다.</p>
        </div>
        
        {/* 블로그 갱신 버튼 */}
        <div className="flex gap-3">
          {club.public?.blog?.url && (
            <a
              href={club.public.blog.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
            >
              🔗 블로그 보기
            </a>
          )}
          <button
            onClick={handleSyncBlog}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing ? '갱신 중...' : (club.public?.blog?.url ? '🔄 블로그 갱신' : '📝 블로그 만들기')}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 기본 정보 */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                한줄 소개 *
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="예: 30대 축구동호회, 매주 토요일 소흘체육공원에서 활동"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상세 소개
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="팀에 대한 자세한 소개를 작성해주세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 정기 일정 */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">정기 일정</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                일정 요약
              </label>
              <input
                type="text"
                value={scheduleSummary}
                onChange={(e) => setScheduleSummary(e.target.value)}
                placeholder="예: 매주 화/목 20:00-22:00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                장소명
              </label>
              <input
                type="text"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder="예: 소흘 체육공원 축구장"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 연락처 */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">연락처 & 채널</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전화번호
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카카오 오픈채팅
              </label>
              <input
                type="url"
                value={kakaoOpenChat}
                onChange={(e) => setKakaoOpenChat(e.target.value)}
                placeholder="https://open.kakao.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                인스타그램
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@team_instagram"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                웹사이트
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://team-website.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 회비 정보 */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">회비 안내</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                금액
              </label>
              <input
                type="number"
                value={duesAmount}
                onChange={(e) => setDuesAmount(Number(e.target.value))}
                placeholder="20000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                통화
              </label>
              <select
                value={duesCurrency}
                onChange={(e) => setDuesCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="KRW">원 (KRW)</option>
                <option value="USD">달러 (USD)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주기
              </label>
              <select
                value={duesCycle}
                onChange={(e) => setDuesCycle(e.target.value as 'monthly' | 'season' | 'yearly')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">월간</option>
                <option value="season">시즌</option>
                <option value="yearly">연간</option>
              </select>
            </div>
          </div>
        </div>

        {/* 수상/전적 */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">수상/전적</h2>
          
          {/* 기존 수상/전적 목록 */}
          {achievements.length > 0 && (
            <div className="space-y-3 mb-4">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{achievement.title}</div>
                    <div className="text-sm text-gray-600">
                      {achievement.year && `${achievement.year}년`} {achievement.desc}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAchievement(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 새 수상/전적 추가 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수상/전적 제목
              </label>
              <input
                type="text"
                value={newAchievement.title}
                onChange={(e) => setNewAchievement({...newAchievement, title: e.target.value})}
                placeholder="예: 지역리그 우승"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                연도
              </label>
              <input
                type="number"
                value={newAchievement.year}
                onChange={(e) => setNewAchievement({...newAchievement, year: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              type="button"
              onClick={addAchievement}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              추가
            </button>
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명 (선택)
            </label>
            <input
              type="text"
              value={newAchievement.desc}
              onChange={(e) => setNewAchievement({...newAchievement, desc: e.target.value})}
              placeholder="추가 설명..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(`/clubs/${clubId}`)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
