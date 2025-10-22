import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

interface Club {
  id: string;
  name: string;
  description?: string;
  sport?: string;
  location?: string;
  admins?: string[];
}

export default function ClubSelectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  
  const go = new URLSearchParams(location.search).get('go') || '';
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const loadMyClubs = async () => {
      try {
        // 내가 관리자인 클럽들 조회
        const q = query(
          collection(db, 'clubs'),
          where('admins', 'array-contains', currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const clubList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Club[];
        
        setClubs(clubList);
        
        // 클럽이 하나뿐이면 자동으로 이동
        if (clubList.length === 1) {
          const clubId = clubList[0].id;
          navigate(`/clubs/${clubId}${go ? `?go=${go}` : ''}`, { replace: true });
        }
      } catch (error) {
        console.error('클럽 목록 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMyClubs();
  }, [currentUser, navigate, go]);

  const onSelect = (clubId: string) => {
    navigate(`/clubs/${clubId}${go ? `?go=${go}` : ''}`);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">클럽 목록을 불러오는 중...</div>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-xl font-bold mb-4">관리 중인 클럽이 없습니다</h2>
        <p className="text-gray-600 mb-6">
          클럽을 만들거나 관리자 권한을 받아야 블로그를 작성할 수 있습니다.
        </p>
        <button
          onClick={() => navigate('/clubs')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          클럽 목록 보기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">클럽 선택</h1>
      
      {go && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            다음 작업을 진행할 클럽을 선택해주세요: <strong>{go.replace('/', ' → ')}</strong>
          </p>
        </div>
      )}

      <div className="space-y-3">
        {clubs.map((club) => (
          <button
            key={club.id}
            onClick={() => onSelect(club.id)}
            className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-left transition-colors"
          >
            <div className="font-semibold text-lg">{club.name}</div>
            {club.description && (
              <div className="text-gray-600 text-sm mt-1">{club.description}</div>
            )}
            <div className="flex gap-2 mt-2">
              {club.sport && (
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">{club.sport}</span>
              )}
              {club.location && (
                <span className="px-2 py-1 bg-gray-100 rounded text-xs">{club.location}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
