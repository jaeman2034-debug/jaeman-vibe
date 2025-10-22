import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';

interface PenaltyData {
  id: string;
  type: string;
  eventId: string;
  points: number;
  at: any;
  actorId: string;
  note?: string;
}

interface PenaltyPanelProps {
  eventId: string;
  uid: string;
}

export default function PenaltyPanel({ eventId, uid }: PenaltyPanelProps) {
  const [penalties, setPenalties] = useState<PenaltyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `users/${uid}/penalties`), 
      orderBy('at', 'desc')
    );
    
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PenaltyData[];
        setPenalties(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching penalties:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  const waivePenalty = async (penaltyId: string) => {
    if (!confirm('이 페널티를 감면할까요?')) return;
    
    try {
      const waiveFunction = httpsCallable(getFunctions(), 'waivePenalty');
      await waiveFunction({ 
        uid, 
        penaltyId, 
        eventId 
      });
      alert('페널티가 감면되었습니다.');
    } catch (error: any) {
      console.error('Error waiving penalty:', error);
      alert(error.message || '페널티 감면에 실패했습니다.');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '알 수 없음';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('ko-KR');
    } catch {
      return '알 수 없음';
    }
  };

  if (loading) {
    return (
      <section className="rounded-xl border p-4">
        <h3 className="font-semibold mb-2">페널티 내역 ({uid})</h3>
        <div className="text-sm text-gray-500">로딩 중...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border p-4">
        <h3 className="font-semibold mb-2">페널티 내역 ({uid})</h3>
        <div className="text-sm text-red-500">오류: {error}</div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border p-4">
      <h3 className="font-semibold mb-2">페널티 내역 ({uid})</h3>
      
      {penalties.length === 0 ? (
        <div className="text-sm text-gray-500">내역 없음</div>
      ) : (
        <div className="space-y-3">
          {penalties.map((penalty) => (
            <div key={penalty.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    penalty.type === 'no_show' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {penalty.type === 'no_show' ? '노쇼' : penalty.type}
                  </span>
                  <span className="text-gray-600">이벤트: {penalty.eventId}</span>
                  <span className="text-gray-500">+{penalty.points}점</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDate(penalty.at)} · {penalty.actorId}
                </div>
                {penalty.note && (
                  <div className="text-xs text-gray-600 mt-1">
                    메모: {penalty.note}
                  </div>
                )}
              </div>
              <button 
                onClick={() => waivePenalty(penalty.id)}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                감면
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
