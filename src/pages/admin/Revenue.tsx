import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function Revenue(){
  const today = new Date().toISOString().slice(0,10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [rows, setRows] = useState<any[]>([]);
  const [mode, setMode] = useState<'day'|'event'>('day');

  const run = async ()=>{
    const fn = httpsCallable(getFunctions(), 'createRevenueReport');
    const { data }: any = await fn({ from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z`, groupBy: mode });
    setRows(data.rows || []);
  };
  const exportCsv = async ()=>{
    const fn = httpsCallable(getFunctions(), 'exportRevenueCsv');
    const { data }: any = await fn({ from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z` });
    window.open(data.url, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">매출 리포트</h1>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <div className="text-xs text-gray-500">From</div>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="rounded border p-2"/>
        </div>
        <div>
          <div className="text-xs text-gray-500">To</div>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="rounded border p-2"/>
        </div>
        <div>
          <div className="text-xs text-gray-500">Group</div>
          <select value={mode} onChange={e=>setMode(e.target.value as any)} className="rounded border p-2">
            <option value="day">일별</option>
            <option value="event">이벤트별</option>
          </select>
        </div>
        <button onClick={run} className="px-3 py-2 rounded-xl border">집계</button>
        <button onClick={exportCsv} className="px-3 py-2 rounded-xl border">CSV 내보내기</button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            {mode==='day' ? (<><th className="py-2">날짜</th><th>매출</th><th>건수</th></>) : (<><th className="py-2">이벤트ID</th><th>매출</th><th>건수</th></>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r:any,i:number)=> (
            <tr key={i} className="border-b">
              {mode==='day' ? (<><td className="py-2">{r.day}</td><td>{r.total.toLocaleString()}원</td><td>{r.count}</td></>) : (<><td className="py-2">{r.eventId}</td><td>{r.total.toLocaleString()}원</td><td>{r.count}</td></>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
