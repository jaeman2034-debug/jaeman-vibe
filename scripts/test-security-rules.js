#!/usr/bin/env node

/**
 * 보안 규칙 테스트 스크립트
 * 
 * 사용법:
 * node scripts/test-security-rules.js
 * 
 * 주의: Firebase 에뮬레이터가 실행 중이어야 합니다.
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  connectFirestoreEmulator 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL
} from 'firebase/storage';
import { connectStorageEmulator } from 'firebase/storage';

// Firebase 설정 (에뮬레이터용)
const firebaseConfig = {
  apiKey: "test-api-key",
  authDomain: "test-project.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "test-app-id"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// 에뮬레이터 연결
connectFirestoreEmulator(db, 'localhost', 8080);
connectStorageEmulator(storage, 'localhost', 9199);

// 테스트 사용자 정보
const testUsers = {
  user1: { uid: 'user1', email: 'user1@test.com' },
  user2: { uid: 'user2', email: 'user2@test.com' },
  admin: { uid: 'admin', email: 'admin@test.com' }
};

// 테스트 결과
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// 테스트 헬퍼 함수
function addTest(name, testFn) {
  testResults.tests.push({ name, testFn });
}

function logTest(name, passed, message = '') {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}: ${passed ? '통과' : '실패'}`);
  if (message) console.log(`   ${message}`);
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// Firestore 보안 규칙 테스트
async function testFirestoreRules() {
  console.log('\n🔥 Firestore 보안 규칙 테스트');
  console.log('=' .repeat(50));
  
  // 테스트 1: 인증되지 않은 사용자의 상품 생성 시도
  addTest('인증되지 않은 사용자 상품 생성 차단', async () => {
    try {
      await setDoc(doc(db, 'market_items', 'test-item-1'), {
        title: '테스트 상품',
        ownerId: 'anonymous',
        createdAt: new Date()
      });
      return false; // 성공하면 안됨
    } catch (error) {
      return error.message.includes('permission-denied');
    }
  });
  
  // 테스트 2: 다른 사용자의 상품 수정 시도
  addTest('다른 사용자 상품 수정 차단', async () => {
    try {
      // 먼저 user1의 상품 생성 (에뮬레이터에서는 허용될 수 있음)
      await setDoc(doc(db, 'market_items', 'test-item-2'), {
        title: 'user1의 상품',
        ownerId: 'user1',
        createdAt: new Date()
      });
      
      // user2가 user1의 상품 수정 시도
      await updateDoc(doc(db, 'market_items', 'test-item-2'), {
        title: '수정된 상품'
      });
      return false; // 성공하면 안됨
    } catch (error) {
      return error.message.includes('permission-denied');
    }
  });
  
  // 테스트 3: 자신의 상품 수정 허용
  addTest('자신의 상품 수정 허용', async () => {
    try {
      const itemRef = doc(db, 'market_items', 'test-item-3');
      await setDoc(itemRef, {
        title: 'user1의 상품',
        ownerId: 'user1',
        createdAt: new Date()
      });
      
      await updateDoc(itemRef, {
        title: '수정된 상품'
      });
      return true; // 성공해야 함
    } catch (error) {
      return false;
    }
  });
  
  // 테스트 4: 찜하기 규칙 테스트
  addTest('다른 사용자 찜하기 접근 차단', async () => {
    try {
      await getDoc(doc(db, 'favorites', 'user1', 'items', 'test-item'));
      return false; // 성공하면 안됨
    } catch (error) {
      return error.message.includes('permission-denied');
    }
  });
}

// Storage 보안 규칙 테스트
async function testStorageRules() {
  console.log('\n📁 Storage 보안 규칙 테스트');
  console.log('=' .repeat(50));
  
  // 테스트 1: 인증되지 않은 사용자의 파일 업로드 차단
  addTest('인증되지 않은 사용자 파일 업로드 차단', async () => {
    try {
      const fileRef = ref(storage, 'products/anonymous/test.jpg');
      const testBlob = new Blob(['test content'], { type: 'image/jpeg' });
      await uploadBytes(fileRef, testBlob);
      return false; // 성공하면 안됨
    } catch (error) {
      return error.message.includes('unauthorized');
    }
  });
  
  // 테스트 2: 다른 사용자의 폴더에 파일 업로드 차단
  addTest('다른 사용자 폴더 파일 업로드 차단', async () => {
    try {
      const fileRef = ref(storage, 'products/user1/test.jpg');
      const testBlob = new Blob(['test content'], { type: 'image/jpeg' });
      await uploadBytes(fileRef, testBlob);
      return false; // 성공하면 안됨
    } catch (error) {
      return error.message.includes('unauthorized');
    }
  });
}

// 테스트 실행
async function runTests() {
  console.log('🔒 Firebase 보안 규칙 테스트 시작');
  console.log('=' .repeat(50));
  
  // 테스트 추가
  testFirestoreRules();
  testStorageRules();
  
  // 테스트 실행
  for (const test of testResults.tests) {
    try {
      const result = await test.testFn();
      logTest(test.name, result);
    } catch (error) {
      logTest(test.name, false, `에러: ${error.message}`);
    }
  }
  
  // 결과 요약
  console.log('\n📊 테스트 결과 요약');
  console.log('=' .repeat(50));
  console.log(`총 테스트: ${testResults.tests.length}`);
  console.log(`통과: ${testResults.passed}`);
  console.log(`실패: ${testResults.failed}`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 모든 테스트가 통과했습니다!');
  } else {
    console.log('\n⚠️  일부 테스트가 실패했습니다. 보안 규칙을 확인해주세요.');
  }
  
  console.log('\n💡 참고사항:');
  console.log('- 에뮬레이터에서는 일부 규칙이 다르게 작동할 수 있습니다.');
  console.log('- 프로덕션 배포 전에 실제 환경에서 테스트해보세요.');
}

// 스크립트 실행
runTests().catch(console.error);

export { runTests, testResults }; 