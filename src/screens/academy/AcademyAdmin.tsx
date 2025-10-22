import { collection, doc, getDocs, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

function SkillEditor({aid, student}: {aid: string, student: any}){
  const db = getFirestore();
  const [skill, setSkill] = useState('드리블');
  const [level, setLevel] = useState(3);
  const [note, setNote] = useState('');
  
  const save = () => setDoc(doc(db,'academies', aid, 'skills', student.id, skill), {
    name: skill, 
    level, 
    note, 
    updatedAt: serverTimestamp()
  }, {merge: true});
  
  return (
    <div className="flex gap-2 items-end">
      <input 
        className="input" 
        value={skill} 
        onChange={e=>setSkill(e.target.value)} 
        placeholder="기술명"
      />
      <input 
        className="input w-24" 
        type="number" 
        min={1} 
        max={5} 
        value={level} 
        onChange={e=>setLevel(Number(e.target.value))} 
      />
      <input 
        className="input flex-1" 
        placeholder="메모" 
        value={note} 
        onChange={e=>setNote(e.target.value)} 
      />
      <button className="btn" onClick={save}>저장</button>
    </div>
  );
}

export default function AcademyAdmin(){
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  const [academy, setAcademy] = useState<any>();
  const [students, setStudents] = useState<any[]>([]);
  const [newStudent, setNewStudent] = useState({
    name: '',
    dob: '',
    band: 'U10',
    guardian: { name: '', phone: '', email: '' }
  });

  useEffect(()=>{ 
    (async()=>{
      const a = await getDocs(collection(db,'academies'));
      const academyData = a.docs.find(d => d.id === id);
      if (academyData) {
        setAcademy({ id: academyData.id, ...academyData.data() });
      }
      
      const s = await getDocs(collection(db,'academies', id!, 'students'));
      setStudents(s.docs.map(d=>({id:d.id, ...d.data()})));
    })(); 
  },[id, db]);

  const addStudent = async () => {
    if (!newStudent.name || !newStudent.guardian.name) {
      alert('학생 이름과 보호자 이름을 입력해주세요');
      return;
    }
    
    await addDoc(collection(db,'academies', id!, 'students'), {
      ...newStudent,
      status: 'active',
      createdAt: serverTimestamp()
    });
    
    setNewStudent({
      name: '',
      dob: '',
      band: 'U10',
      guardian: { name: '', phone: '', email: '' }
    });
    
    // 페이지 새로고침
    window.location.reload();
  };

  const sendPaymentLink = async (student: any) => {
    if (!student.guardian.email) {
      alert('보호자 이메일이 없습니다');
      return;
    }
    
    try {
      const hook = (import.meta as any).env.VITE_N8N_WEBHOOK_DUES_CHECKOUT;
      if (hook) {
        await fetch(hook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: student.id,
            parentEmail: student.guardian.email,
            clubId: id
          })
        });
        alert('결제 링크가 이메일로 발송되었습니다');
      } else {
        alert('결제 시스템이 설정되지 않았습니다');
      }
    } catch (e) {
      alert('결제 링크 발송 실패');
    }
  };

  if (!academy) return <div className="p-4">로딩 중...</div>;
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{academy.name} – 관리</h1>
        <div className="flex gap-2">
          <button className="btn" onClick={() => navigate(`/academies/${id}/attendance`)}>
            출석 체크
          </button>
          <button className="btn" onClick={() => navigate(`/academies`)}>
            목록
          </button>
        </div>
      </div>

      {/* 새 학생 등록 */}
      <section className="rounded-xl border p-4 bg-white">
        <h3 className="font-semibold mb-3">새 학생 등록</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <input 
            className="input" 
            placeholder="학생 이름" 
            value={newStudent.name} 
            onChange={e=>setNewStudent({...newStudent, name: e.target.value})} 
          />
          <input 
            className="input" 
            type="date" 
            placeholder="생년월일" 
            value={newStudent.dob} 
            onChange={e=>setNewStudent({...newStudent, dob: e.target.value})} 
          />
          <select 
            className="input" 
            value={newStudent.band} 
            onChange={e=>setNewStudent({...newStudent, band: e.target.value})}
          >
            <option value="U8">U8 (8세 이하)</option>
            <option value="U10">U10 (10세 이하)</option>
            <option value="U12">U12 (12세 이하)</option>
          </select>
          <input 
            className="input" 
            placeholder="보호자 이름" 
            value={newStudent.guardian.name} 
            onChange={e=>setNewStudent({
              ...newStudent, 
              guardian: {...newStudent.guardian, name: e.target.value}
            })} 
          />
          <input 
            className="input" 
            placeholder="보호자 전화번호" 
            value={newStudent.guardian.phone} 
            onChange={e=>setNewStudent({
              ...newStudent, 
              guardian: {...newStudent.guardian, phone: e.target.value}
            })} 
          />
          <input 
            className="input" 
            type="email" 
            placeholder="보호자 이메일" 
            value={newStudent.guardian.email} 
            onChange={e=>setNewStudent({
              ...newStudent, 
              guardian: {...newStudent.guardian, email: e.target.value}
            })} 
          />
        </div>
        <button className="btn-primary mt-3" onClick={addStudent}>학생 등록</button>
      </section>

      {/* 학생 목록 */}
      <section className="rounded-xl border p-4 bg-white">
        <h3 className="font-semibold mb-3">학생 목록 ({students.length})</h3>
        <div className="space-y-3">
          {students.map(student => (
            <div key={student.id} className="border rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{student.name} 
                    <span className="text-sm text-gray-500 ml-2">({student.band})</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    보호자: {student.guardian?.name} {student.guardian?.phone}
                  </div>
                  <div className="text-xs text-gray-500">
                    상태: {student.status || 'active'}
                  </div>
                </div>
                <button 
                  className="btn" 
                  onClick={() => sendPaymentLink(student)}
                >
                  결제 링크
                </button>
              </div>
              
              {/* 기술 평가 */}
              <div className="mt-3">
                <div className="text-sm font-medium mb-2">기술 평가</div>
                <SkillEditor aid={id!} student={student} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
