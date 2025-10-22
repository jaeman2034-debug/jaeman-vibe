import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';

export default function EventReportCards({ eventId }: { eventId: string }) {
  const [m, setM] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, `events/${eventId}/metrics/summary`), s => setM(s.data()));
    return () => unsub();
  }, [eventId]);

  const recompute = async () => {
    setLoading(true);
    try {
      await httpsCallable(getFunctions(), 'recomputeEventMetrics')({ eventId });
    } catch (error) {
      console.error('메트릭 재계산 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">운영 리포트</h3>
        <button 
          onClick={recompute} 
          disabled={loading}
          className="px-3 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '계산 중...' : '지금 재계산'}
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-center">
        <Card label="참가자" value={m?.attendeeCount ?? 0} />
        <Card label="체크인" value={m?.presentCount ?? 0} />
        <Card label="결제" value={m?.paidCount ?? 0} />
        <Card label="대기열" value={m?.waitCount ?? 0} />
        <Card label="노쇼율" value={pct(m?.noShowRate)} />
        <Card label="결제 전환" value={pct(m?.payConv)} />
      </div>
      
      <div className="text-xs text-gray-500 text-right">
        업데이트: {m?.updatedAt?.toDate ? m.updatedAt.toDate().toLocaleString() : '-'}
      </div>
    </section>
  );
}

function Card({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-3 rounded-lg bg-gray-50">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-semibold">
        {typeof value === 'number' ? value : value}
      </div>
    </div>
  );
}

const pct = (x: number) => (x != null ? Math.round(x * 100) + '%' : '-');
