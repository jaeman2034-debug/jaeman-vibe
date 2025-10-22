import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AcademyList(){
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  const [rows, setRows] = useState<any[]>([]);
  
  useEffect(()=>{ 
    (async()=>{
      const s = await getDocs(collection(db,'academies'));
      setRows(s.docs.map(d=>({id:d.id, ...d.data()})));
    })(); 
  },[db]);

  const createAcademy = async () => {
    const { currentUser } = getAuth(); 
    if (!currentUser) return alert('로그인 필요');
    
    const name = prompt('아카데미 이름?'); 
    if (!name) return;
    
    const sport = prompt('종목? (예: 축구, 농구)') || '축구';
    const region = prompt('지역? (예: 서울 강남)') || '서울';
    
    const ref = await addDoc(collection(db,'academies'), { 
      name, 
      sport,
      region,
      ownerUid: currentUser.uid, 
      coaches: [], 
      ageBands: ['U8', 'U10', 'U12'],
      createdAt: serverTimestamp()
    });
    
    navigate(`/academies/${ref.id}/admin`);
  };

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-2xl font-bold">유소년 아카데미</h1>
      <button className="btn" onClick={createAcademy}>아카데미 만들기</button>
      <ul className="grid md:grid-cols-2 gap-3">
        {rows.map(r=> (
          <li key={r.id} className="rounded-xl border p-3 bg-white shadow-sm">
            <a href={`/academies/${r.id}/admin`} className="block">
              <div className="font-semibold">{r.name}</div>
              <div className="text-sm text-gray-500">{r.sport} • {r.region}</div>
              <div className="text-xs text-gray-400 mt-1">
                연령대: {r.ageBands?.join(', ') || 'U8, U10, U12'}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
