import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function AcademyAttendance(){
  const { id } = useParams();
  const navigate = useNavigate();
  const db = getFirestore();
  const [students, setStudents] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(()=>{ 
    (async()=>{
      const s = await getDocs(collection(db,'academies', id!, 'students'));
      setStudents(s.docs.map(d=>({id:d.id, ...d.data()})));
    })(); 
  },[id, db]);

  const mark = async (uid: string, status: 'present' | 'late' | 'absent') => {
    const sid = sessionId || new Date().toISOString().slice(0,10);
    setSessionId(sid);
    await setDoc(doc(db,'academies', id!, 'attendance', sid, uid), {
      status, 
      markedAt: serverTimestamp(),
      markedBy: 'coach' // TODO: 실제 코치 ID
    }, {merge: true});
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">출석 체크</h1>
        <button className="btn" onClick={() => navigate(`/academies/${id}/admin`)}>관리</button>
      </div>
      
      <div className="text-sm text-gray-500">세션: {sessionId || '오늘'}</div>
      
      <ul className="space-y-2">
        {students.map(st=> (
          <li key={st.id} className="rounded-xl border p-3 flex justify-between items-center bg-white">
            <div>
              <div className="font-semibold">{st.name} 
                <span className="text-xs text-gray-500 ml-2">({st.band})</span>
              </div>
              <div className="text-xs text-gray-500">
                보호자: {st.guardian?.name} {st.guardian?.phone}
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                className="btn bg-green-100 text-green-800" 
                onClick={()=>mark(st.id,'present')}
              >
                출석
              </button>
              <button 
                className="btn bg-yellow-100 text-yellow-800" 
                onClick={()=>mark(st.id,'late')}
              >
                지각
              </button>
              <button 
                className="btn bg-red-100 text-red-800" 
                onClick={()=>mark(st.id,'absent')}
              >
                결석
              </button>
            </div>
          </li>
        ))}
      </ul>
      
      {students.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          등록된 학생이 없습니다.
        </div>
      )}
    </div>
  );
}
