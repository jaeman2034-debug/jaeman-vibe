// Firestore 아카데미 데이터 설정 스크립트
// 브라우저 콘솔에서 실행하세요

import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();
const auth = getAuth();

// 현재 월 (YYYYMM 형식)
const currentMonth = new Date().toISOString().slice(0,7).replace('-', '');

// 샘플 학생 데이터
const sampleStudents = [
  {
    id: 'student-001',
    name: '홍길동',
    clubId: 'club-001',
    grade: '초5',
    guardianName: '홍보호자',
    guardianPhone: '+821012345678'
  },
  {
    id: 'student-002', 
    name: '김철수',
    clubId: 'club-001',
    grade: '초6',
    guardianName: '김보호자',
    guardianPhone: '+821098765432'
  },
  {
    id: 'student-003',
    name: '이영희',
    clubId: 'club-002', 
    grade: '중1',
    guardianName: '이보호자',
    guardianPhone: '+821055512345'
  }
];

// 샘플 메트릭 데이터
const sampleMetrics = [
  {
    studentId: 'student-001',
    attendance: 92,
    sessions: 12,
    goals: 5,
    assists: 3,
    coachNote: '체력과 집중력이 크게 향상되었습니다. 팀워크도 좋아지고 있어요!'
  },
  {
    studentId: 'student-002',
    attendance: 88,
    sessions: 11,
    goals: 3,
    assists: 7,
    coachNote: '패스 정확도가 늘었고, 수비에서도 적극적으로 나서고 있습니다.'
  },
  {
    studentId: 'student-003',
    attendance: 95,
    sessions: 13,
    goals: 8,
    assists: 2,
    coachNote: '골 결정력이 뛰어나고, 리더십도 발휘하고 있습니다.'
  }
];

async function setupAcademyData() {
  try {
    console.log('아카데미 데이터 설정 시작...');
    
    // 학생 데이터 저장
    for (const student of sampleStudents) {
      await setDoc(doc(db, 'academyStudents', student.id), student);
      console.log(`학생 저장: ${student.name}`);
    }
    
    // 메트릭 데이터 저장
    for (const metric of sampleMetrics) {
      await setDoc(
        doc(db, 'academyMetrics', currentMonth, 'students', metric.studentId), 
        metric
      );
      console.log(`메트릭 저장: ${metric.studentId}`);
    }
    
    console.log('✅ 아카데미 데이터 설정 완료!');
    console.log(`현재 월: ${currentMonth}`);
    console.log(`학생 수: ${sampleStudents.length}`);
    console.log(`메트릭 수: ${sampleMetrics.length}`);
    
  } catch (error) {
    console.error('❌ 데이터 설정 실패:', error);
  }
}

// 실행
setupAcademyData();
