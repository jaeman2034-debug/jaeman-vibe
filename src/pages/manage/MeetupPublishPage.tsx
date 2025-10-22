import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';

export default function MeetupPublishPage() {
  const clubId = location.pathname.split('/')[2];
  const id = location.pathname.split('/')[4];
  const { user } = useAuth();
  const [channels, setChannels] = useState<string[]>(['x', 'instagram']);
  const [sites, setSites] = useState(false);
  const [when, setWhen] = useState('now'); // or ISO e.g. 2025-09-14T11:00:00+09:00
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const r = await fetch(`/admin/publish/meetups/${id}`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ channels, sites, when }) 
      });
      const j = await r.json();
      alert(j.ok ? '발행 요청 완료' : '실패');
    } catch (error) {
      alert('오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6 space-y-3">
      <h1 className="text-2xl font-bold">OG & 소셜 퍼블리시</h1>
      
      <div className="text-sm text-zinc-500">채널 선택</div>
      <div className="flex gap-2 flex-wrap">
        {['x', 'instagram', 'naverblog', 'kakao'].map(c => (
          <label key={c} className="px-3 py-1 rounded-full border cursor-pointer hover:bg-gray-50">
            <input 
              type="checkbox" 
              checked={channels.includes(c)} 
              onChange={(e) => setChannels(p => e.target.checked ? [...p, c] : p.filter(x => x !== c))} 
              className="mr-2"
            /> 
            {c}
          </label>
        ))}
      </div>
      
      <label className="flex items-center gap-2 text-sm">
        <input 
          type="checkbox" 
          checked={sites} 
          onChange={e => setSites(e.target.checked)} 
        /> 
        Google Sites 동시 게시
      </label>
      
      <div className="text-sm">게시 시각(빈 값은 즉시)</div>
      <input 
        className="w-full px-3 py-2 rounded-lg border" 
        placeholder="now 또는 ISO 시각" 
        value={when} 
        onChange={e => setWhen(e.target.value)} 
      />
      
      <div className="pt-2">
        <button 
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50" 
          onClick={run}
          disabled={loading}
        >
          {loading ? '발행 중...' : '발행'}
        </button>
      </div>
      
      <div className="text-xs text-zinc-500">
        * OG 이미지가 자동으로 생성되고 선택한 채널에 게시됩니다.
      </div>
    </div>
  );
}
