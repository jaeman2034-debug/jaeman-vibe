import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroup } from '@/features/groups/services/groupService';
import { getBrowserLocation } from '@/features/location/services/locationService';
import { analyzeGroup, getGroupFieldLockStatus, applyGroupAISuggestions } from '@/features/ai/aiProvider';
import { useAuth } from '@/contexts/AuthContext';

export default function GroupCreate() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [maxMembers, setMaxMembers] = useState<number | ''>('');
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [autoMode, setAutoMode] = useState(false);
  const [userModifiedFields] = useState(new Set<string>());
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const canSave = useMemo(() => !!user && !!title, [user, title]);

  if (!user) return <main style={{ padding: 24 }}>로그인 필요</main>;

  // AI 분석 실행
  const runAIAnalysis = async () => {
    if (!title || !autoMode) return;
    
    try {
      const result = await analyzeGroup(title);
      setAiAnalysis(result);
      
      // 필드 잠금 상태 확인
      const fieldLocks = getGroupFieldLockStatus(
        { title, category, desc, maxMembers: typeof maxMembers === 'number' ? maxMembers : undefined },
        userModifiedFields
      );
      
      // AI 제안 적용 (잠긴 필드는 건드리지 않음)
      const suggestions = applyGroupAISuggestions(
        { title, category, desc, maxMembers: typeof maxMembers === 'number' ? maxMembers : undefined },
        result,
        fieldLocks
      );
      
      // 빈 필드에만 제안 적용
      if (!category && suggestions.category) setCategory(suggestions.category);
      if (!desc && suggestions.desc) setDesc(suggestions.desc);
      if (!maxMembers && suggestions.maxMembers) setMaxMembers(suggestions.maxMembers);
      
    } catch (error) {
      console.error('AI 분석 실패:', error);
    }
  };

  // 제목 변경 시 AI 분석 실행
  const handleTitleChange = (value: string) => {
    setTitle(value);
    userModifiedFields.add('title');
    
    // 자동모드가 켜져있으면 AI 분석 실행
    if (autoMode && value) {
      setTimeout(runAIAnalysis, 500); // 타이핑 완료 후 분석
    }
  };

  const onGetLocation = async () => {
    try {
      const here = await getBrowserLocation();
      setLoc(here);
    } catch (error) {
      console.error('Location error:', error);
      alert('위치 정보를 가져올 수 없습니다.');
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    
    try {
      const id = await createGroup({
        title,
        desc: desc || undefined,
        category: category || undefined,
        maxMembers: typeof maxMembers === 'number' ? maxMembers : undefined,
        ownerId: user!.uid,
        loc: loc ?? null,
      });
      nav(`/groups/${id}`);
    } catch (error) {
      console.error('Create group error:', error);
      alert('모임 등록에 실패했습니다.');
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>새 모임 만들기</h1>
      <p style={{ color: '#666' }}>
        {autoMode ? 
          '자동모드 ON: 제목 입력 시 AI가 빈 필드를 자동으로 채웁니다.' :
          '자동모드 OFF: 수동으로 모든 필드를 입력합니다.'
        }
        위치 설정 시 행정동 정보가 자동으로 채워집니다.
      </p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        {/* 자동모드 토글 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label>
            <input
              type="checkbox"
              checked={autoMode}
              onChange={(e) => setAutoMode(e.target.checked)}
            />
            AI 자동모드
          </label>
          {aiAnalysis && (
            <span style={{ color: '#666', fontSize: 14 }}>
              AI 신뢰도: {(aiAnalysis.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
        <input 
          placeholder="모임 제목" 
          value={title} 
          onChange={e => handleTitleChange(e.target.value)} 
          required 
        />
        <input 
          placeholder="카테고리 (예: 축구, 농구, 테니스)" 
          value={category} 
          onChange={e => {
            setCategory(e.target.value);
            userModifiedFields.add('category');
          }} 
        />
        <input 
          type="number" 
          placeholder="최대 인원수" 
          value={maxMembers as any} 
          onChange={e => {
            setMaxMembers(e.target.value ? Number(e.target.value) : '');
            userModifiedFields.add('maxMembers');
          }} 
        />
        <textarea 
          placeholder="모임 설명" 
          rows={6} 
          value={desc} 
          onChange={e => {
            setDesc(e.target.value);
            userModifiedFields.add('desc');
          }} 
        />
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" onClick={onGetLocation}>
            현재 위치 설정
          </button>
          {loc && (
            <span style={{ color: '#555' }}>
              lat: {loc.lat.toFixed(5)}, lng: {loc.lng.toFixed(5)}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={!canSave}>모임 만들기</button>
          <button type="button" onClick={() => nav(-1)}>취소</button>
        </div>
      </form>
    </main>
  );
}
