import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { useState, useEffect } from 'react';

export default function AdminKPI() {
  const [rows, setRows] = useState<any[]>([]);
  const db = getFirestore();
  
  useEffect(()=>{ 
    (async()=>{
      const snap = await getDocs(query(collection(db, 'metrics'), orderBy('updatedAt','desc'), limit(14)));
      setRows(snap.docs.map(d=>({ id:d.id, ...d.data() })));
    })(); 
  }, [db]);
  
  const today = rows[0]||{};
  
  return (
    <div className="p-4 grid md:grid-cols-3 gap-3">
      <Card title="오늘 생성된 마켓">{today.market_created||0}</Card>
      <Card title="오늘 생성된 모임">{today.meetup_created||0}</Card>
      <Card title="오늘 생성된 지원서">{today.job_app_created||0}</Card>
      <div className="md:col-span-3">
        <h3 className="font-semibold mb-2">최근 14일 추이</h3>
        <pre className="bg-gray-50 p-3 rounded">{JSON.stringify(rows,null,2)}</pre>
      </div>
    </div>
  );
}

function Card({title, children}:{title:string; children:any}){
  return (
    <div className="rounded-2xl shadow p-4 bg-white">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold">{children}</div>
    </div>
  );
}
