import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar } from 'recharts';

export default function EventReportCharts({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const qs = await getDocs(query(collection(db, `events/${eventId}/metrics/history`), orderBy('date', 'asc')));
      const data = qs.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setRows(data);
    } catch (error) {
      console.error('히스토리 로드 실패:', error);
    }
  };

  useEffect(() => { 
    load(); 
  }, [eventId]);

  const recompute = async () => {
    setLoading(true);
    try {
      await httpsCallable(getFunctions(), 'recomputeEventHistory')({ eventId, days: 30 });
      await load();
    } catch (error) {
      console.error('히스토리 재계산 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">추이 차트 (최근 30일)</h3>
        <button 
          onClick={recompute} 
          disabled={loading}
          className="px-3 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '계산 중...' : '재계산'}
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          데이터가 없습니다. 재계산 버튼을 눌러주세요.
        </div>
      ) : (
        <>
          <div className="h-64">
            <h4 className="text-sm font-medium mb-2">참가자/체크인/결제 추이</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="attendees" stroke="#3b82f6" name="참가자" />
                <Line type="monotone" dataKey="presence" stroke="#10b981" name="체크인" />
                <Line type="monotone" dataKey="paid" stroke="#8b5cf6" name="결제" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="h-64">
            <h4 className="text-sm font-medium mb-2">대기열 추이</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="wait" fill="#f59e0b" name="대기자" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
