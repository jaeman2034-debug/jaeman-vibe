import React, { useState, useEffect } from 'react';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useParams, useNavigate } from 'react-router-dom';

interface PublicContrib {
  uid: string;
  roleAtSubmit?: string;
  patch: {
    tagline?: string;
    description?: string;
    galleryAppend?: string[];
    achievementsAppend?: Array<{
      title: string;
      year?: number;
      desc?: string;
    }>;
  };
  status: 'requested' | 'approved' | 'rejected';
  createdAt: any;
  decidedAt?: any;
  decidedBy?: string;
  decisionNote?: string;
}

interface Club {
  name: string;
  ownerUid: string;
  admins: string[];
  public?: any;
}

export default function TeamPublicContribForm() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingContribs, setExistingContribs] = useState<PublicContrib[]>([]);

  // 폼 상태
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [newAchievement, setNewAchievement] = useState({ title: '', year: new Date().getFullYear(), desc: '' });
  const [achievements, setAchievements] = useState<Array<{ title: string; year?: number; desc?: string }>>([]);

  useEffect(() => {
    if (!clubId) {
      navigate('/clubs');
      return;
    }
    loadData();
  }, [clubId, navigate]);

  const loadData = async () => {
    try {
      // 클럽 정보 로드
      const clubDoc = await getDoc(doc(db, 'clubs', clubId!));
      if (!clubDoc.exists()) {
        alert('클럽을 찾을 수 없습니다.');
        navigate('/clubs');
        return;
      }

      const clubData = clubDoc.data() as Club;
      setClub(clubData);

      // 로그인 확인
      if (!auth.currentUser) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      // 기존 기여 내역 로드
      const contribQuery = query(
        collection(db, 'clubs', clubId!, 'publicContribs'),
        where('uid', '==', auth.currentUser.uid)
      );
      const contribSnap = await getDocs(contribQuery);
      const contribs = contribSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (PublicContrib & { id: string })[];
      
      setExistingContribs(contribs);

      // 현재 공개 정보로 폼 초기화 (참고용)
      const publicData = clubData.public || {};
      if (!tagline && publicData.tagline) {
        setTagline(publicData.tagline);
      }
      if (!description && publicData.description) {
        setDescription(publicData.description);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      alert('정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!tagline.trim() && !description.trim() && achievements.length === 0) {
      alert('최소 하나의 정보는 입력해주세요.');
      return;
    }

    // 대기 중인 기여가 있는지 확인
    const pendingContrib = existingContribs.find(c => c.status === 'requested');
    if (pendingContrib) {
      alert('이미 승인 대기 중인 기여가 있습니다. 관리자의 승인을 기다려주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const patch: PublicContrib['patch'] = {};
      
      if (tagline.trim()) patch.tagline = tagline.trim();
      if (description.trim()) patch.description = description.trim();
      if (achievements.length > 0) patch.achievementsAppend = achievements;

      const contribData: Omit<PublicContrib, 'createdAt'> = {
        uid: auth.currentUser!.uid,
        patch,
        status: 'requested',
      };

      await addDoc(collection(db, 'clubs', clubId!, 'publicContribs'), {
        ...contribData,
        createdAt: serverTimestamp(),
      });

      alert('기여 제안이 제출되었습니다! 관리자의 승인을 기다려주세요.');
      
      // 폼 초기화
      setTagline('');
      setDescription('');
      setAchievements([]);
      setNewAchievement({ title: '', year: new Date().getFullYear(), desc: '' });
      
      // 기여 내역 새로고침
      loadData();
    } catch (error) {
      console.error('제출 실패:', error);
      alert('제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">승인 대기</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">승인됨</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">거절됨</span>;
      default:
        return null;
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{club.name} 정보 기여</h1>
        <p className="text-gray-600 mt-1">
          팀 블로그에 추가하고 싶은 정보를 제안해주세요. 관리자 승인 후 반영됩니다.
        </p>
      </div>

      {/* 기존 기여 내역 */}
      {existingContribs.length > 0 && (
        <div className="bg-white p-6 rounded-lg border mb-8">
          <h2 className="text-xl font-semibold mb-4">나의 기여 내역</h2>
          <div className="space-y-3">
            {existingContribs.map((contrib) => (
              <div key={(contrib as any).id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-500">
                    {contrib.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') || '최근'}
                  </div>
                  {getStatusBadge(contrib.status)}
                </div>
                
                <div className="space-y-2">
                  {contrib.patch.tagline && (
                    <div>
                      <span className="font-medium text-sm">한줄 소개:</span>
                      <p className="text-gray-700">{contrib.patch.tagline}</p>
                    </div>
                  )}
                  {contrib.patch.description && (
                    <div>
                      <span className="font-medium text-sm">상세 소개:</span>
                      <p className="text-gray-700">{contrib.patch.description}</p>
                    </div>
                  )}
                  {contrib.patch.achievementsAppend && contrib.patch.achievementsAppend.length > 0 && (
                    <div>
                      <span className="font-medium text-sm">수상/전적:</span>
                      <ul className="list-disc list-inside text-gray-700">
                        {contrib.patch.achievementsAppend.map((ach, i) => (
                          <li key={i}>{ach.title} {ach.year && `(${ach.year})`}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {contrib.status === 'rejected' && contrib.decisionNote && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <span className="font-medium text-sm text-red-800">거절 사유:</span>
                    <p className="text-red-700 text-sm">{contrib.decisionNote}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 새 기여 폼 */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 기본 정보 기여 */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">기본 정보 개선 제안</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                한줄 소개 수정 제안
              </label>
              {club.public?.tagline && (
                <div className="mb-2 p-3 bg-gray-50 rounded border-l-4 border-blue-200">
                  <span className="text-sm text-gray-600">현재:</span>
                  <p className="text-gray-800">{club.public.tagline}</p>
                </div>
              )}
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="더 나은 한줄 소개를 제안해주세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상세 소개 수정 제안
              </label>
              {club.public?.description && (
                <div className="mb-2 p-3 bg-gray-50 rounded border-l-4 border-blue-200">
                  <span className="text-sm text-gray-600">현재:</span>
                  <p className="text-gray-800">{club.public.description}</p>
                </div>
              )}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="더 나은 팀 소개를 제안해주세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 수상/전적 추가 */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">수상/전적 추가</h2>
          
          {/* 현재 수상/전적 */}
          {club.public?.achievements && club.public.achievements.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">현재 등록된 수상/전적:</div>
              <div className="space-y-2">
                {club.public.achievements.map((ach: any, index: number) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
                    <div className="font-medium">{ach.title}</div>
                    <div className="text-sm text-gray-600">
                      {ach.year && `${ach.year}년`} {ach.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 추가할 수상/전적 목록 */}
          {achievements.length > 0 && (
            <div className="space-y-3 mb-4">
              <div className="text-sm font-medium text-gray-700">추가할 수상/전적:</div>
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <div className="font-medium text-green-800">{achievement.title}</div>
                    <div className="text-sm text-green-600">
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

          {/* 새 수상/전적 입력 */}
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
            disabled={submitting || (!tagline.trim() && !description.trim() && achievements.length === 0)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? '제출 중...' : '기여 제안하기'}
          </button>
        </div>
      </form>

      {/* 안내 메시지 */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">기여 안내</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 제안하신 내용은 관리자 승인 후 팀 블로그에 반영됩니다.</li>
          <li>• 승인 대기 중인 기여가 있으면 새로운 기여를 제안할 수 없습니다.</li>
          <li>• 거절된 기여는 사유와 함께 알려드립니다.</li>
          <li>• 팀에 도움이 되는 정확하고 유익한 정보를 제안해주세요.</li>
        </ul>
      </div>
    </div>
  );
}
