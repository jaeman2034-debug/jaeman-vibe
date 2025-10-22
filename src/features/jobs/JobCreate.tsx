import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJob } from '@/features/jobs/services/jobService';
import { getBrowserLocation } from '@/features/location/services/locationService';
import { analyzeJob, getJobFieldLockStatus, applyJobAISuggestions } from '@/features/ai/aiProvider';
import { useAuth } from '@/features/auth/AuthContext';

export default function JobCreate() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [type, setType] = useState<'fulltime' | 'parttime' | 'coach' | 'etc'>('etc');
  const [salaryMin, setSalaryMin] = useState<number | ''>('');
  const [salaryMax, setSalaryMax] = useState<number | ''>('');
  const [contact, setContact] = useState('');
  const [desc, setDesc] = useState('');
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [autoMode, setAutoMode] = useState(false);
  const [userModifiedFields] = useState(new Set<string>());
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const canSave = useMemo(() => !!user && !!title, [user, title]);

  if (!user) return <main style={{ padding: 24 }}>ë¡œê·¸???„ìš”</main>;

  // AI ë¶„ì„ ?¤í–‰
  const runAIAnalysis = async () => {
    if (!title || !autoMode) return;
    
    try {
      const result = await analyzeJob(title);
      setAiAnalysis(result);
      
      // ?„ë“œ ? ê¸ˆ ?íƒœ ?•ì¸
      const fieldLocks = getJobFieldLockStatus(
        { title, company, type, desc, salaryMin: typeof salaryMin === 'number' ? salaryMin : undefined, salaryMax: typeof salaryMax === 'number' ? salaryMax : undefined },
        userModifiedFields
      );
      
      // AI ?œì•ˆ ?ìš© (? ê¸´ ?„ë“œ??ê±´ë“œë¦¬ì? ?ŠìŒ)
      const suggestions = applyJobAISuggestions(
        { title, company, type, desc, salaryMin: typeof salaryMin === 'number' ? salaryMin : undefined, salaryMax: typeof salaryMax === 'number' ? salaryMax : undefined },
        result,
        fieldLocks
      );
      
      // ë¹??„ë“œ?ë§Œ ?œì•ˆ ?ìš©
      if (!company && suggestions.company) setCompany(suggestions.company);
      if (!type && suggestions.type) setType(suggestions.type);
      if (!desc && suggestions.desc) setDesc(suggestions.desc);
      if (!salaryMin && suggestions.salaryMin) setSalaryMin(suggestions.salaryMin);
      if (!salaryMax && suggestions.salaryMax) setSalaryMax(suggestions.salaryMax);
      
    } catch (error) {
      console.error('AI ë¶„ì„ ?¤íŒ¨:', error);
    }
  };

  // ?œëª© ë³€ê²???AI ë¶„ì„ ?¤í–‰
  const handleTitleChange = (value: string) => {
    setTitle(value);
    userModifiedFields.add('title');
    
    // ?ë™ëª¨ë“œê°€ ì¼œì ¸?ˆìœ¼ë©?AI ë¶„ì„ ?¤í–‰
    if (autoMode && value) {
      setTimeout(runAIAnalysis, 500); // ?€?´í•‘ ?„ë£Œ ??ë¶„ì„
    }
  };

  const onGetLocation = async () => {
    try {
      const here = await getBrowserLocation();
      setLoc(here);
    } catch (error) {
      console.error('Location error:', error);
      alert('?„ì¹˜ ?•ë³´ë¥?ê°€?¸ì˜¬ ???†ìŠµ?ˆë‹¤.');
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    
    try {
      const id = await createJob({
        title,
        company: company || undefined,
        type,
        salaryMin: typeof salaryMin === 'number' ? salaryMin : undefined,
        salaryMax: typeof salaryMax === 'number' ? salaryMax : undefined,
        contact: contact || undefined,
        desc: desc || undefined,
        ownerId: user!.uid,
        loc: loc ?? null,
      });
      nav(`/jobs/${id}`);
    } catch (error) {
      console.error('Create job error:', error);
      alert('êµ¬ì¸ ?±ë¡???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>êµ¬ì¸ ?±ë¡</h1>
      <p style={{ color: '#666' }}>
        {autoMode ? 
          '?ë™ëª¨ë“œ ON: ?œëª© ?…ë ¥ ??AIê°€ ë¹??„ë“œë¥??ë™?¼ë¡œ ì±„ì›?ˆë‹¤.' :
          '?ë™ëª¨ë“œ OFF: ?˜ë™?¼ë¡œ ëª¨ë“  ?„ë“œë¥??…ë ¥?©ë‹ˆ??'
        }
        ?„ì¹˜ ?¤ì • ???‰ì •???•ë³´ê°€ ?ë™?¼ë¡œ ì±„ì›Œì§‘ë‹ˆ??
      </p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        {/* ?ë™ëª¨ë“œ ? ê? */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label>
            <input
              type="checkbox"
              checked={autoMode}
              onChange={(e) => setAutoMode(e.target.checked)}
            />
            AI ?ë™ëª¨ë“œ
          </label>
          {aiAnalysis && (
            <span style={{ color: '#666', fontSize: 14 }}>
              AI ? ë¢°?? {(aiAnalysis.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
        <input 
          placeholder="?œëª©" 
          value={title} 
          onChange={e => handleTitleChange(e.target.value)} 
          required 
        />
        <input 
          placeholder="?Œì‚¬" 
          value={company} 
          onChange={e => setCompany(e.target.value)} 
        />
        <select 
          value={type} 
          onChange={e => setType(e.target.value as any)}
          style={{ padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
        >
          <option value="fulltime">?•ê·œ</option>
          <option value="parttime">?ŒíŠ¸</option>
          <option value="coach">ì½”ì¹˜</option>
          <option value="etc">ê¸°í?</option>
        </select>
        <div style={{ display: 'flex', gap: 8 }}>
          <input 
            type="number" 
            placeholder="ìµœì†Œ ê¸‰ì—¬" 
            value={salaryMin as any} 
            onChange={e => setSalaryMin(e.target.value ? Number(e.target.value) : '')} 
          />
          <input 
            type="number" 
            placeholder="ìµœë? ê¸‰ì—¬" 
            value={salaryMax as any} 
            onChange={e => setSalaryMax(e.target.value ? Number(e.target.value) : '')} 
          />
        </div>
        <input 
          placeholder="?°ë½ì²?ë©”ì¼/?„í™”/URL)" 
          value={contact} 
          onChange={e => setContact(e.target.value)} 
        />
        <textarea 
          placeholder="?¤ëª…" 
          rows={6} 
          value={desc} 
          onChange={e => setDesc(e.target.value)} 
        />
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" onClick={onGetLocation}>
            ?„ì¬ ?„ì¹˜ ?¤ì •
          </button>
          {loc && (
            <span style={{ color: '#555' }}>
              lat: {loc.lat.toFixed(5)}, lng: {loc.lng.toFixed(5)}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={!canSave}>êµ¬ì¸ ?±ë¡</button>
          <button type="button" onClick={() => nav(-1)}>ì·¨ì†Œ</button>
        </div>
      </form>
    </main>
  );
}
