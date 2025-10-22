import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Job } from '@/shared/types/product';
import { getJob } from '@/features/jobs/services/jobService';
import { autoCorrectDong } from '@/features/location/services/locationService';
import { useAuth } from '@/features/auth/AuthContext';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Job | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    getJob(id).then(setItem);
  }, [id]);

  if (!id) return <main style={{ padding: 24 }}>?˜ëª»??ê²½ë¡œ</main>;
  if (!item) return <main style={{ padding: 24 }}>ë¡œë”©/?†ìŒ</main>;

  const onCheckDong = async () => {
    if (!item.loc) {
      alert('?„ì¹˜ ?•ë³´ê°€ ?†ìŠµ?ˆë‹¤.');
      return;
    }

    try {
      const dong = await autoCorrectDong('jobs', id, item.loc);
      if (dong) {
        setItem(prev => prev ? { ...prev, dong } : null);
        alert(`?‰ì •???•ë³´ê°€ ?…ë°?´íŠ¸?˜ì—ˆ?µë‹ˆ?? ${dong}`);
      } else {
        alert('?‰ì •???•ë³´ë¥?ê°€?¸ì˜¬ ???†ìŠµ?ˆë‹¤.');
      }
    } catch (error) {
      console.error('Check dong error:', error);
      alert('?‰ì •???•ì¸???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      fulltime: '?•ê·œ',
      parttime: '?ŒíŠ¸',
      coach: 'ì½”ì¹˜',
      etc: 'ê¸°í?'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const isOwner = user?.uid && user.uid === item.ownerId;

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <h1>{item.title}</h1>
          {item.company && <div style={{ color: '#666', marginTop: 8 }}>?Œì‚¬: {item.company}</div>}
          <div style={{ color: '#444', marginTop: 8 }}>? í˜•: {getTypeLabel(item.type)}</div>
          {(item.salaryMin || item.salaryMax) && (
            <div style={{ color: '#444', marginTop: 8 }}>
              ê¸‰ì—¬: {item.salaryMin ? `${item.salaryMin.toLocaleString()}?? : ''}
              {item.salaryMin && item.salaryMax ? ' ~ ' : ''}
              {item.salaryMax ? `${item.salaryMax.toLocaleString()}?? : ''}
            </div>
          )}
          {item.contact && <div style={{ color: '#666', marginTop: 8 }}>?°ë½ì²? {item.contact}</div>}
          {item.dong && <div style={{ color: '#777', marginTop: 8 }}>?‰ì •?? {item.dong}</div>}
          {item.loc && (
            <div style={{ color: '#555', marginTop: 8 }}>
              ?„ì¹˜: lat {item.loc.lat.toFixed(5)}, lng {item.loc.lng.toFixed(5)}
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
              ?‰ì •???•ì¸
            </button>
            {isOwner && (
              <>
                {/* ì¶”í›„: ?¸ì§‘/?? œ ë²„íŠ¼ */}
                <button disabled>?¸ì§‘</button>
                <button disabled>?? œ</button>
              </>
            )}
          </div>
        </div>

        <div style={{ background: '#f8f8f8', padding: 24, borderRadius: 12 }}>
          <h3>êµ¬ì¸ ?•ë³´</h3>
          <div style={{ marginTop: 16 }}>
            <div><strong>?ì„±??</strong> {item.createdAt?.toDate?.()?.toLocaleDateString() || '?????†ìŒ'}</div>
            <div><strong>?Œìœ ??</strong> {item.ownerId}</div>
            {item.updatedAt && (
              <div><strong>?˜ì •??</strong> {item.updatedAt?.toDate?.()?.toLocaleDateString()}</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
