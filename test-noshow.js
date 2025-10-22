// 노쇼 페널티 시스템 테스트 스크립트
// 사용법: node test-noshow.js

const admin = require('firebase-admin');

// Firebase 초기화 (서비스 계정 키 필요)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // 또는 서비스 계정 키 파일 사용:
    // credential: admin.credential.cert(require('./path/to/service-account-key.json')),
  });
}

const db = admin.firestore();

async function createTestData() {
  console.log('🧪 테스트 데이터 생성 중...');
  
  // 테스트 이벤트 생성 (2시간 전에 종료된 이벤트)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const eventRef = db.collection('events').doc('test-event-noshow');
  
  await eventRef.set({
    title: '노쇼 테스트 이벤트',
    sport: '테스트',
    startAt: admin.firestore.Timestamp.fromDate(new Date(twoHoursAgo.getTime() - 2 * 60 * 60 * 1000)),
    endAt: admin.firestore.Timestamp.fromDate(twoHoursAgo),
    capacity: 5,
    fee: 0,
    status: 'open',
    placeName: '테스트 장소',
    hostId: 'test-host',
    attendeeCount: 2,
    description: '노쇼 페널티 테스트용 이벤트'
  });
  
  // 테스트 참가자 2명 추가 (1명은 체크인, 1명은 노쇼)
  const attendee1 = eventRef.collection('attendees').doc('test-user-present');
  const attendee2 = eventRef.collection('attendees').doc('test-user-absent');
  
  await attendee1.set({ joinedAt: admin.firestore.Timestamp.now() });
  await attendee2.set({ joinedAt: admin.firestore.Timestamp.now() });
  
  // 1명만 체크인
  const presence1 = eventRef.collection('presence').doc('test-user-present');
  await presence1.set({ 
    checkedInAt: admin.firestore.Timestamp.now(),
    method: 'test'
  });
  
  console.log('✅ 테스트 데이터 생성 완료');
  console.log('- 이벤트 ID: test-event-noshow');
  console.log('- 참가자: test-user-present (체크인), test-user-absent (노쇼)');
  console.log('- 이벤트 종료 시간: 2시간 전');
}

async function checkUserDiscipline(uid) {
  console.log(`\n🔍 사용자 ${uid}의 페널티 상태 확인...`);
  
  const userRef = db.doc(`users/${uid}`);
  const userDoc = await userRef.get();
  
  if (userDoc.exists) {
    const data = userDoc.data();
    const discipline = data.discipline || {};
    console.log(`- 스트라이크 수: ${discipline.strikeCount || 0}`);
    console.log(`- 제한 만료: ${discipline.strikeUntil ? discipline.strikeUntil.toDate() : '없음'}`);
  } else {
    console.log('- 사용자 문서가 존재하지 않음');
  }
  
  // 페널티 내역 확인
  const penaltiesRef = db.collection(`users/${uid}/penalties`);
  const penalties = await penaltiesRef.orderBy('at', 'desc').get();
  
  console.log(`- 페널티 내역 (${penalties.size}개):`);
  penalties.forEach(doc => {
    const data = doc.data();
    console.log(`  * ${data.type} - ${data.eventId} - ${data.at.toDate()}`);
  });
}

async function runManualSweep() {
  console.log('\n🧹 수동 스윕 실행...');
  
  try {
    const { getFunctions, httpsCallable } = require('firebase-functions');
    const functions = getFunctions();
    const manualSweep = httpsCallable(functions, 'manualSweepNoShows');
    
    const result = await manualSweep({});
    console.log('✅ 수동 스윕 완료:', result.data);
  } catch (error) {
    console.error('❌ 수동 스윕 실패:', error.message);
  }
}

async function cleanup() {
  console.log('\n🧹 테스트 데이터 정리 중...');
  
  // 테스트 이벤트 삭제
  const eventRef = db.collection('events').doc('test-event-noshow');
  await eventRef.delete();
  
  // 테스트 사용자 페널티 삭제
  const testUsers = ['test-user-present', 'test-user-absent'];
  for (const uid of testUsers) {
    const penaltiesRef = db.collection(`users/${uid}/penalties`);
    const penalties = await penaltiesRef.get();
    const batch = db.batch();
    penalties.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    // 사용자 문서의 discipline 초기화
    await db.doc(`users/${uid}`).set({
      discipline: { strikeCount: 0 }
    }, { merge: true });
  }
  
  console.log('✅ 테스트 데이터 정리 완료');
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      await createTestData();
      break;
    case 'check':
      const uid = process.argv[3] || 'test-user-absent';
      await checkUserDiscipline(uid);
      break;
    case 'sweep':
      await runManualSweep();
      break;
    case 'cleanup':
      await cleanup();
      break;
    case 'full-test':
      console.log('🚀 전체 테스트 실행...');
      await createTestData();
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
      await checkUserDiscipline('test-user-absent');
      await runManualSweep();
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
      await checkUserDiscipline('test-user-absent');
      await cleanup();
      break;
    default:
      console.log('사용법:');
      console.log('  node test-noshow.js setup     - 테스트 데이터 생성');
      console.log('  node test-noshow.js check [uid] - 사용자 페널티 상태 확인');
      console.log('  node test-noshow.js sweep     - 수동 스윕 실행');
      console.log('  node test-noshow.js cleanup   - 테스트 데이터 정리');
      console.log('  node test-noshow.js full-test - 전체 테스트 실행');
      break;
  }
}

main().catch(console.error);
