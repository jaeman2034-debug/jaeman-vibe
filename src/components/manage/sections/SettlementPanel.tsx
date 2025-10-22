import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';

export default function SettlementPanel({ eventId }: { eventId: string }) {
  const [sum, setSum] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const fn = httpsCallable(getFunctions(), 'computeSettlement');
      const { data }: any = await fn({ eventId }); 
      setSum(data);
      
      const qs = await getDocs(query(
        collection(db, `events/${eventId}/payments`), 
        orderBy('createdAt', 'desc')
      ));
      setRows(qs.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    } catch (error) {
      console.error('정산 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
    // eslint-disable-next-line 
  }, [eventId]);

  const csv = () => {
    const header = ['orderId', 'status', 'amount', 'discount', 'paid', 'bizName', 'bizRegNo', 'createdAt'];
    const lines = rows.map(r => {
      const paidAmt = (r.amount || 0) - (r.discount || 0);
      const vals = [
        r.id, 
        r.status, 
        r.amount || 0, 
        r.discount || 0, 
        paidAmt,
        r.invoice?.bizName || '', 
        r.invoice?.bizRegNo || '',
        r.createdAt?.toDate ? r.createdAt.toDate().toISOString() : ''
      ];
      return vals.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',');
    });
    
    const csvContent = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = `settlement_${eventId}.csv`; 
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">정산 리포트</h3>
        <button 
          onClick={load} 
          disabled={loading}
          className="px-3 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? '로딩중...' : '새로고침'}
        </button>
      </div>
      
      {sum && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
          <Card label="총 결제요청" value={(sum?.gross || 0).toLocaleString() + '원'} />
          <Card label="할인 합계" value={(sum?.discount || 0).toLocaleString() + '원'} />
          <Card label="수금(완료)" value={(sum?.paid || 0).toLocaleString() + '원'} />
          <Card label="환불" value={(sum?.canceled || 0).toLocaleString() + '원'} />
          <Card label="실패" value={(sum?.failed || 0).toLocaleString() + '원'} />
          <Card label="순매출" value={(sum?.net || 0).toLocaleString() + '원'} />
        </div>
      )}
      
      <div className="flex justify-end">
        <button 
          onClick={csv} 
          disabled={rows.length === 0}
          className="px-3 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-50"
        >
          CSV 다운로드
        </button>
      </div>
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
