import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Group } from '@/shared/types/product';
import { getGroup } from '@/features/groups/services/groupService';
import { autoCorrectDong } from '@/features/location/services/locationService';
import { useAuth } from '@/contexts/AuthContext';

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Group | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    getGroup(id).then(setItem);
  }, [id]);

  if (!id) return <main style={{ padding: 24 }}>잘못된 경로</main>;
  if (!item) return <main style={{ padding: 24 }}>로딩/없음</main>;

  const onCheckDong = async () => {
    if (!item.loc) {
      alert('위치 정보가 없습니다.');
      return;
    }

    try {
      const dong = await autoCorrectDong('groups', id, item.loc);
      if (dong) {
        setItem(prev => prev ? { ...prev, dong } : null);
        alert(`행정동 정보가 업데이트되었습니다: ${dong}`);
      } else {
        alert('행정동 정보를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('Check dong error:', error);
      alert('행정동 확인에 실패했습니다.');
    }
  };

  const isOwner = user?.uid && user.uid === item.ownerId;

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <h1>{item.title}</h1>
          {item.category && <div style={{ color: '#666', marginTop: 8 }}>카테고리: {item.category}</div>}
          {item.maxMembers && (
            <div style={{ color: '#444', marginTop: 8 }}>
              인원: {item.currentMembers || 0}/{item.maxMembers}명
            </div>
          )}
          {item.dong && <div style={{ color: '#777', marginTop: 8 }}>행정동: {item.dong}</div>}
          {item.loc && (
            <div style={{ color: '#555', marginTop: 8 }}>
              위치: lat {item.loc.lat.toFixed(5)}, lng {item.loc.lng.toFixed(5)}
            </div>
          )}
          {item.desc && (
            <p style={{ marginTop: 16, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {item.desc}
            </p>
          )}

          <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
            <button 
              data-voice-action="check-dong" 
              onClick={onCheckDong}
              disabled={!item.loc}
            >
              행정동 확인
            </button>
            {isOwner && (
              <>
                {/* 추후: 편집/삭제 버튼 */}
                <button disabled>편집</button>
                <button disabled>삭제</button>
              </>
            )}
          </div>
        </div>

        <div style={{ background: '#f8f8f8', padding: 24, borderRadius: 12 }}>
          <h3>모임 정보</h3>
          <div style={{ marginTop: 16 }}>
            <div><strong>생성일:</strong> {item.createdAt?.toDate?.()?.toLocaleDateString() || '알 수 없음'}</div>
            <div><strong>소유자:</strong> {item.ownerId}</div>
            {item.updatedAt && (
              <div><strong>수정일:</strong> {item.updatedAt?.toDate?.()?.toLocaleDateString()}</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
