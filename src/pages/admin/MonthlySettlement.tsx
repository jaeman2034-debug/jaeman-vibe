import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function MonthlySettlement() {
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [sum, setSum] = useState<any>(null);
  const [csvUrl, setCsvUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const fn = httpsCallable(getFunctions(), 'computeMonthlySettlement');
      const { data }: any = await fn({ month, projectWide: true }); // 전체 집계(운영자)
      setSum(data);
      
      const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' });
      setCsvUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error('월간 정산 계산 실패:', error);
      alert('월간 정산 계산에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">월간 정산</h1>
      
      <div className="flex items-center gap-2">
        <input 
          type="month" 
          value={month} 
          onChange={e => setMonth(e.target.value)} 
          className="border rounded-lg p-2"
        />
        <button 
          onClick={run} 
          disabled={loading}
          className="px-3 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? '집계중...' : '집계'}
        </button>
        {csvUrl && (
          <a 
            href={csvUrl} 
            download={`settlement_${month}.csv`} 
            className="px-3 py-2 rounded-xl border hover:bg-gray-50"
          >
            CSV 다운로드
          </a>
        )}
      </div>
      
      {sum && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
          <Card label="건수" value={sum.count} />
          <Card label="총요청" value={(sum.gross || 0).toLocaleString() + '원'} />
          <Card label="할인" value={(sum.discount || 0).toLocaleString() + '원'} />
          <Card label="수금" value={(sum.paid || 0).toLocaleString() + '원'} />
          <Card label="환불" value={(sum.canceled || 0).toLocaleString() + '원'} />
          <Card label="순매출" value={(sum.net || 0).toLocaleString() + '원'} />
        </div>
      )}
    </div>
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
