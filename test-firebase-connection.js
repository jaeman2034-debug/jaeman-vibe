// Firebase 연결 및 상품 등록 테스트 스크립트
// 브라우저 콘솔에서 실행하세요

console.log('🧪 Firebase 연결 테스트 시작...');

// 1. Firebase 초기화 확인
console.log('1️⃣ Firebase 초기화 확인:');
console.log('  - window.auth:', window.auth);
console.log('  - window.db:', window.db);
console.log('  - window.storage:', window.storage);

// 2. 현재 사용자 확인
if (window.auth && window.auth.currentUser) {
  console.log('2️⃣ 현재 사용자:');
  console.log('  - uid:', window.auth.currentUser.uid);
  console.log('  - displayName:', window.auth.currentUser.displayName);
  console.log('  - email:', window.auth.currentUser.email);
} else {
  console.log('❌ 2️⃣ 사용자 로그인 안 됨');
}

// 3. Firestore 연결 테스트
async function testFirestore() {
  console.log('3️⃣ Firestore 연결 테스트:');
  try {
    const { collection, getDocs, query, limit } = await import('firebase/firestore');
    const q = query(collection(window.db, 'marketItems'), limit(1));
    const snap = await getDocs(q);
    console.log('  ✅ Firestore 연결 성공');
    console.log('  - 문서 개수:', snap.size);
    if (snap.size > 0) {
      const doc = snap.docs[0];
      const data = doc.data();
      console.log('  - 첫 번째 문서 ID:', doc.id);
      console.log('  - sellerUid 필드:', data.sellerUid || 'null');
      console.log('  - status 필드:', data.status || 'null');
    }
  } catch (error) {
    console.error('  ❌ Firestore 연결 실패:', error);
  }
}

// 4. Storage 연결 테스트
async function testStorage() {
  console.log('4️⃣ Storage 연결 테스트:');
  try {
    const { ref, uploadString } = await import('firebase/storage');
    const testRef = ref(window.storage, 'test-connection.txt');
    await uploadString(testRef, 'test');
    console.log('  ✅ Storage 연결 성공');
    // 테스트 파일 삭제
    const { deleteObject } = await import('firebase/storage');
    await deleteObject(testRef);
    console.log('  ✅ 테스트 파일 삭제 완료');
  } catch (error) {
    console.error('  ❌ Storage 연결 실패:', error);
  }
}

// 테스트 실행
testFirestore().then(() => testStorage());

console.log('🧪 테스트 완료 - 위 결과를 확인하세요!');
