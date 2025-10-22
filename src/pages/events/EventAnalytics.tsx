// src/pages/events/EventAnalytics.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function EventAnalytics(){
  const { id } = useParams();
  const [data, setData] = useState<any|null>(null);
  useEffect(()=>{ (async()=>{
    if(!id) return;
    const fn = httpsCallable(getFunctions(),'computeEventAnalytics');
    const { data }: any = await fn({ eventId: id });
    setData(data);
  })(); },[id]);

  const series = useMemo(()=>{
    if(!data) return [];
    return Object.entries(data.byMinute).map(([k,v])=> ({ time: new Date(k).toLocaleTimeString(), count:v as number }));
  },[data]);

  if(!id) return null;
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/events/${id}/manage`} className="text-blue-600 underline">← 관리</Link>
        <h1 className="text-xl font-semibold">체크인 대시보드</h1>
      </div>
      {data && (
        <div className="grid md:grid-cols-4 gap-3">
          <div className="rounded-xl border p-4"><div className="text-sm text-gray-500">참가 신청</div><div className="text-2xl font-semibold">{data.total}</div></div>
          <div className="rounded-xl border p-4"><div className="text-sm text-gray-500">현장 체크인</div><div className="text-2xl font-semibold">{data.checked}</div></div>
          <div className="rounded-xl border p-4"><div className="text-sm text-gray-500">노쇼</div><div className="text-2xl font-semibold">{data.noShow}</div></div>
          <div className="rounded-xl border p-4"><div className="text-sm text-gray-500">매출(원)</div><div className="text-2xl font-semibold">{(data?.revenue||0).toLocaleString()}</div></div>
        </div>
      )}
      <div className="rounded-xl border p-4">
        <div className="text-sm font-semibold mb-2">분당 체크인 추이</div>
        <div className="h-64">
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            차트 라이브러리 설치 필요 (recharts)
          </div>
        </div>
      </div>
    </div>
  );
}
