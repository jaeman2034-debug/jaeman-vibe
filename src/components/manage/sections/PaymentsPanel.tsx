import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';

type Row = { 
  id: string; 
  uid?: string; 
  amount?: number; 
  status?: string; 
  createdAt?: any; 
  approvedAt?: any; 
  canceledAt?: any; 
  orderName?: string; 
};

export default function PaymentsPanel({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<'all' | 'pending' | 'paid' | 'failed' | 'canceled'>('all');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, `events/${eventId}/payments`), orderBy('createdAt', 'desc'));
      if (status !== 'all') {
        q = query(
          collection(db, `events/${eventId}/payments`), 
          where('status', '==', status), 
          orderBy('createdAt', 'desc')
        );
      }
      const snap = await getDocs(q);
      setRows(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    } catch (error) {
      console.error('결제 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
    // eslint-disable-next-line 
  }, [eventId, status]);

  const refund = async (orderId: string) => {
    if (!confirm('이 결제를 환불할까요?')) return;
    try {
      const fn = httpsCallable(getFunctions(), 'refundPayment');
      await fn({ eventId, orderId, reason: 'admin_panel' });
      await load();
    } catch (error) {
      console.error('환불 실패:', error);
      alert('환불에 실패했습니다.');
    }
  };

  const toCSV = () => {
    const header = ['orderId', 'uid', 'status', 'amount', 'createdAt', 'approvedAt', 'canceledAt', 'orderName'];
    const body = rows.map(r => [
      r.id, 
      r.uid || '', 
      r.status || '', 
      (r.amount || 0).toString(),
      r.createdAt?.toDate ? r.createdAt.toDate().toISOString() : '',
      r.approvedAt?.toDate ? r.approvedAt.toDate().toISOString() : '',
      r.canceledAt?.toDate ? r.canceledAt.toDate().toISOString() : '',
      (r as any).orderName || ''
    ].map(v => `"${String(v).replaceAll('"', '""')}"`).join(','));
    
    const csvContent = [header.join(','), ...body].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = `payments_${eventId}.csv`; 
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'canceled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('ko-KR');
    } catch {
      return '-';
    }
  };

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">결제 관리</h3>
        <div className="flex items-center gap-2">
          <select 
            value={status} 
            onChange={e => setStatus(e.target.value as any)}
            className="border rounded-lg p-2 text-sm"
          >
            <option value="all">전체</option>
            <option value="pending">대기</option>
            <option value="paid">완료</option>
            <option value="failed">실패</option>
            <option value="canceled">취소</option>
          </select>
          <button 
            onClick={toCSV} 
            className="px-3 py-2 rounded-xl border hover:bg-gray-50"
            disabled={rows.length === 0}
          >
            CSV
          </button>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left w-40">주문번호</th>
              <th className="p-2 text-left w-40">유저</th>
              <th className="p-2 text-right w-28">금액</th>
              <th className="p-2 text-left w-24">상태</th>
              <th className="p-2 text-left w-44">시간</th>
              <th className="p-2 text-left">액션</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  결제 없음
                </td>
              </tr>
            ) : (
              rows.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-2 font-mono text-xs">{r.id}</td>
                  <td className="p-2">{r.uid || '-'}</td>
                  <td className="p-2 text-right font-medium">
                    {(r.amount || 0).toLocaleString()}원
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(r.status || '')}`}>
                      {r.status || 'unknown'}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="text-xs text-gray-600">
                      {r.approvedAt?.toDate ? `완료 ${formatDate(r.approvedAt)}` :
                       r.canceledAt?.toDate ? `취소 ${formatDate(r.canceledAt)}` :
                       r.createdAt?.toDate ? `생성 ${formatDate(r.createdAt)}` : '-'}
                    </div>
                  </td>
                  <td className="p-2">
                    {r.status === 'paid' ? (
                      <button 
                        onClick={() => refund(r.id)} 
                        className="px-3 py-1 rounded-lg border text-red-600 hover:bg-red-50"
                      >
                        환불
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
