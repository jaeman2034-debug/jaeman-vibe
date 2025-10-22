import React, { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function WaitlistAdvisor({ eventId }: { eventId: string }) {
  const [sug, setSug] = useState<any>(null);
  const [mode, setMode] = useState<'conservative' | 'predictive'>('conservative');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const fn = httpsCallable(getFunctions(), 'suggestWaitlistPromotion');
      const { data }: any = await fn({ eventId });
      setSug(data);
    } catch (error) {
      console.error('승격 제안 로드 실패:', error);
    }
  };

  useEffect(() => { 
    load(); 
  }, [eventId]);

  const promote = async () => {
    if (!sug) return;
    setLoading(true);
    try {
      const count = mode === 'conservative' ? sug.conservative : sug.predictive;
      if (count <= 0) {
        alert('승격 대상이 없습니다.');
        return;
      }
      
      const fn = httpsCallable(getFunctions(), 'promoteFromWaitlist');
      const { data }: any = await fn({ eventId, count, mode });
      alert(`승격 완료: ${data.promoted}명`);
      await load();
    } catch (error) {
      console.error('승격 실패:', error);
      alert('승격에 실패했습니다.');
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">대기열 승격 제안</h3>
        <button 
          onClick={load} 
          className="px-3 py-2 rounded-xl border hover:bg-gray-50"
        >
          새로고침
        </button>
      </div>

      {sug ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <Card label="정원" value={sug.context.cap} />
            <Card label="현재 참가" value={sug.context.attendeeCount} />
            <Card label="대기열" value={sug.context.waitCount} />
            <Card label="예상 노쇼율" value={`${Math.round((sug.context.nsAvg || 0) * 100)}%`} />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                checked={mode === 'conservative'} 
                onChange={() => setMode('conservative')}
                className="text-blue-600"
              />
              <span className="text-sm">
                보수적 (추천 {sug.conservative}명)
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                checked={mode === 'predictive'} 
                onChange={() => setMode('predictive')}
                className="text-blue-600"
              />
              <span className="text-sm">
                예측기반 (추천 {sug.predictive}명)
              </span>
            </label>
            <div className="flex-1" />
            <button 
              disabled={loading || (mode === 'conservative' ? sug.conservative : sug.predictive) <= 0} 
              onClick={promote}
              className={`px-4 py-2 rounded-xl ${
                loading || (mode === 'conservative' ? sug.conservative : sug.predictive) <= 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {loading ? '처리 중…' : '추천 인원 승격'}
            </button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• 안전장치: 총원은 정원의 120%를 넘지 않도록 제한됩니다.</p>
            <p>• 보수적: 남은 좌석만 승격 (안전)</p>
            <p>• 예측기반: 예상 노쇼율을 고려한 오버부킹 (최대 20%)</p>
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-500 text-center py-4">
          계산 중…
        </div>
      )}
    </section>
  );
}

function Card({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-3 rounded-lg bg-gray-50">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
