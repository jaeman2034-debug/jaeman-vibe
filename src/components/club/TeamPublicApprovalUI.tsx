import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, auth } from '@/lib/firebase';
import { useParams } from 'react-router-dom';

interface PublicContrib {
  id: string;
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

export default function TeamPublicApprovalUI() {
  const { clubId } = useParams<{ clubId: string }>();
  
  const [club, setClub] = useState<Club | null>(null);
  const [contributions, setContributions] = useState<PublicContrib[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedContrib, setSelectedContrib] = useState<PublicContrib | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [filter, setFilter] = useState<'all' | 'requested' | 'approved' | 'rejected'>('requested');

  useEffect(() => {
    if (!clubId) return;
    loadData();
  }, [clubId]);

  const loadData = async () => {
    try {
      // 클럽 정보 로드
      const clubDoc = await getDoc(doc(db, 'clubs', clubId!));
      if (!clubDoc.exists()) {
        alert('클럽을 찾을 수 없습니다.');
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
        return;
      }

      // 기여 목록 로드
      const contribQuery = query(
        collection(db, 'clubs', clubId!, 'publicContribs'),
        orderBy('createdAt', 'desc')
      );
      const contribSnap = await getDocs(contribQuery);
      const contribs = contribSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PublicContrib[];
      
      setContributions(contribs);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      alert('정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (contrib: PublicContrib, action: 'approve' | 'reject') => {
    setSelectedContrib(contrib);
    setModalAction(action);
    setDecisionNote('');
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedContrib || processing) return;

    setProcessing(selectedContrib.id);
    try {
      const approvePublicContrib = httpsCallable(functions, 'approvePublicContrib');
      await approvePublicContrib({
        clubId,
        contribId: selectedContrib.id,
        action: modalAction,
        note: decisionNote.trim() || undefined,
      });

      alert(`기여가 ${modalAction === 'approve' ? '승인' : '거절'}되었습니다.`);
      setShowModal(false);
      loadData(); // 데이터 새로고침
    } catch (error: any) {
      console.error('처리 실패:', error);
      alert(`처리 실패: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium">승인 대기</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">승인됨</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium">거절됨</span>;
      default:
        return null;
    }
  };

  const filteredContributions = contributions.filter(contrib => 
    filter === 'all' || contrib.status === filter
  );

  const getFilterCounts = () => {
    const counts = {
      all: contributions.length,
      requested: contributions.filter(c => c.status === 'requested').length,
      approved: contributions.filter(c => c.status === 'approved').length,
      rejected: contributions.filter(c => c.status === 'rejected').length,
    };
    return counts;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <p className="text-red-600">클럽 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const counts = getFilterCounts();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{club.name} 기여 승인 관리</h1>
        <p className="text-gray-600 mt-1">
          회원들의 팀 정보 기여 제안을 검토하고 승인/거절할 수 있습니다.
        </p>
      </div>

      {/* 필터 및 통계 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체 ({counts.all})
          </button>
          <button
            onClick={() => setFilter('requested')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'requested'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            승인 대기 ({counts.requested})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            승인됨 ({counts.approved})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            거절됨 ({counts.rejected})
          </button>
        </div>
      </div>

      {/* 기여 목록 */}
      {filteredContributions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {filter === 'all' ? '기여 내역이 없습니다' : `${filter === 'requested' ? '승인 대기 중인' : filter === 'approved' ? '승인된' : '거절된'} 기여가 없습니다`}
          </h3>
          <p className="text-gray-600">
            회원들이 팀 정보 개선을 제안하면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredContributions.map((contrib) => (
            <div key={contrib.id} className="bg-white p-6 rounded-lg border shadow-sm">
              {/* 기여 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {contrib.uid.slice(-2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      사용자 {contrib.uid.slice(-8)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {contrib.createdAt?.toDate?.()?.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) || '최근'}
                    </div>
                  </div>
                </div>
                {getStatusBadge(contrib.status)}
              </div>

              {/* 기여 내용 */}
              <div className="space-y-4">
                {contrib.patch.tagline && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-medium text-blue-800 mb-2">한줄 소개 수정 제안</div>
                    {club.public?.tagline && (
                      <div className="mb-2">
                        <span className="text-sm text-gray-600">현재:</span>
                        <p className="text-gray-700">{club.public.tagline}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-blue-600 font-medium">제안:</span>
                      <p className="text-blue-800 font-medium">{contrib.patch.tagline}</p>
                    </div>
                  </div>
                )}

                {contrib.patch.description && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-medium text-green-800 mb-2">상세 소개 수정 제안</div>
                    {club.public?.description && (
                      <div className="mb-2">
                        <span className="text-sm text-gray-600">현재:</span>
                        <p className="text-gray-700">{club.public.description}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-green-600 font-medium">제안:</span>
                      <p className="text-green-800 font-medium">{contrib.patch.description}</p>
                    </div>
                  </div>
                )}

                {contrib.patch.achievementsAppend && contrib.patch.achievementsAppend.length > 0 && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="font-medium text-purple-800 mb-2">수상/전적 추가 제안</div>
                    <div className="space-y-2">
                      {contrib.patch.achievementsAppend.map((ach, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div>
                            <div className="font-medium text-purple-800">{ach.title}</div>
                            <div className="text-sm text-purple-600">
                              {ach.year && `${ach.year}년`} {ach.desc}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 결정 정보 */}
              {contrib.status !== 'requested' && (
                <div className="mt-4 p-3 bg-gray-50 rounded border-l-4 border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {contrib.decidedAt?.toDate?.()?.toLocaleDateString('ko-KR')} 처리됨
                    </span>
                    <span className="text-sm text-gray-500">
                      관리자: {contrib.decidedBy?.slice(-8)}
                    </span>
                  </div>
                  {contrib.decisionNote && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-600">사유:</span>
                      <p className="text-gray-700">{contrib.decisionNote}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 액션 버튼 */}
              {contrib.status === 'requested' && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleApprovalAction(contrib, 'approve')}
                    disabled={processing === contrib.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {processing === contrib.id ? '처리 중...' : '✅ 승인'}
                  </button>
                  <button
                    onClick={() => handleApprovalAction(contrib, 'reject')}
                    disabled={processing === contrib.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {processing === contrib.id ? '처리 중...' : '❌ 거절'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 승인/거절 모달 */}
      {showModal && selectedContrib && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {modalAction === 'approve' ? '기여 승인' : '기여 거절'}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {modalAction === 'approve' 
                ? '이 기여를 승인하시겠습니까? 승인된 내용은 팀 공개 정보에 즉시 반영됩니다.'
                : '이 기여를 거절하시겠습니까?'
              }
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {modalAction === 'approve' ? '승인 메모 (선택)' : '거절 사유'}
              </label>
              <textarea
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                rows={3}
                placeholder={modalAction === 'approve' ? '승인에 대한 추가 설명...' : '거절 사유를 입력해주세요...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={modalAction === 'reject'}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={confirmAction}
                disabled={modalAction === 'reject' && !decisionNote.trim()}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  modalAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {modalAction === 'approve' ? '승인하기' : '거절하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
