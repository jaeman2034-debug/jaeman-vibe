import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, limit, query } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

export default function AdminKPICharts() {
  const [rows, setRows] = useState<any[]>([]);
  const db = getFirestore();
  
  useEffect(()=>{ 
    (async()=>{
      const snap = await getDocs(query(collection(db, 'metrics'), orderBy('updatedAt','desc'), limit(30)));
      const arr = snap.docs.map(d=>({ id:d.id, ...d.data() }));
      setRows(arr);
    })(); 
  }, [db]);

  const data = useMemo(()=>{
    // id 예: daily_20250912 → x축 라벨로 YYYY-MM-DD 가공
    return [...rows].reverse().map(r=>{
      const m = /daily_(\d{4})(\d{2})(\d{2})/.exec(r.id);
      const label = m ? `${m[1]}-${m[2]}-${m[3]}` : r.id;
      return {
        date: label,
        market: r.market_created || 0,
        meetups: r.meetup_created || 0,
        applications: r.job_app_created || 0,
      };
    });
  }, [rows]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">KPI (최근 30일)</h1>
      <div className="rounded-2xl bg-white shadow p-4">
        <div className="text-sm text-gray-500 mb-2">일자별 생성 건수</div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="market" name="마켓" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="meetups" name="모임" stroke="#059669" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="applications" name="지원서" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
