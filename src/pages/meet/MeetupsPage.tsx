import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query, where, limit } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { MeetupsMapView } from './components/MeetupsMapView';

type ViewMode = 'list'|'map';

export default function MeetupsPage() {
  const [mode, setMode] = useState<ViewMode>('list');
  const [items, setItems] = useState<any[]>([]);
  const [reco, setReco] = useState<any[]>([]);
  const db = getFirestore();

  useEffect(()=>{ 
    (async()=>{
      try {
        const now = new Date();
        const q1 = query(collection(db,'meetups'), where('timeStart','>=', now), orderBy('timeStart','asc'), limit(20));
        const s1 = await getDocs(q1);
        setItems(s1.docs.map(d=>({ id:d.id, ...d.data() })) as any);
        
        // 추천: 주말/저녁 타임 + 근거리(후속 개선)
        const q2 = query(collection(db,'meetups'), orderBy('timeStart','asc'), limit(5));
        const s2 = await getDocs(q2);
        setReco(s2.docs.map(d=>({ id:d.id, ...d.data() })) as any);
      } catch (error) {
        console.error('모임 데이터 로드 실패:', error);
        // 빈 배열로 설정하여 오류 방지
        setItems([]);
        setReco([]);
      }
    })(); 
  }, [db]);

  const empty = items.length === 0;

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">모임</h1>
        <div className="flex gap-2">
          <button className={`btn ${mode==='list'?'btn-primary':''}`} onClick={()=>setMode('list')}>목록</button>
          <button className={`btn ${mode==='map'?'btn-primary':''}`} onClick={()=>setMode('map')}>지도로 보기</button>
          <Link className="btn" to="/meetups/new" data-testid="btn-create-meetup" onClick={(e)=> e.stopPropagation()}>모임 만들기</Link>
        </div>
      </div>

      {empty ? (
        <div className="rounded-2xl border p-6 text-center bg-white">
          <p className="text-gray-500 mb-3">아직 등록된 모임이 없습니다.</p>
          <Link className="btn" to="/meetups/new" data-testid="btn-create-meetup-empty" onClick={(e)=> e.stopPropagation()}>모임 만들기</Link>
          {reco.length>0 && (
            <div className="text-left mt-6">
              <h3 className="font-semibold mb-2">이런 모임은 어떠세요?</h3>
              <ul className="grid md:grid-cols-2 gap-3">
                {reco.map(m => (
                  <li key={m.id} className="rounded-xl border p-3 bg-white shadow-sm">
                    <div className="font-semibold">{m.title}</div>
                    <div className="text-sm text-gray-500">{new Date(m.timeStart?.seconds? m.timeStart.seconds*1000 : m.timeStart).toLocaleString()}</div>
                    <div className="text-sm">{m.place?.name || m.place}</div>
                    {m.place?.lat && m.place?.lng && (
                      <a className="text-blue-600 text-sm" target="_blank" href={`https://map.kakao.com/link/map/${encodeURIComponent(m.title)},${m.place.lat},${m.place.lng}`}>지도에서 열기</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        mode==='list' ? (
          <ul className="space-y-3">
            {items.map(m => (
              <li key={m.id} className="rounded-xl border p-3 bg-white shadow-sm">
                <Link to={`/meetups/${m.id}`} className="block">
                  <div className="font-semibold">{m.title}</div>
                  <div className="text-sm text-gray-500">{new Date(m.timeStart?.seconds? m.timeStart.seconds*1000 : m.timeStart).toLocaleString()}</div>
                  <div className="text-sm">{m.place?.name || m.place}</div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <MeetupsMapView items={items} />
        )
      )}
    </div>
  );
}
