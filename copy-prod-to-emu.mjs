// copy-prod-to-emu.mjs
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, getDocs, doc, setDoc, connectFirestoreEmulator
} from 'firebase/firestore';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';

// 🔧 Firebase 구성값 (에뮬레이터용)
const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "jaeman-vibe-platform",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo"
};

const emuApp = initializeApp(firebaseConfig, 'emu');
const emuDb = getFirestore(emuApp);
connectFirestoreEmulator(emuDb, '127.0.0.1', 58081);

// 인증 설정
const emuAuth = getAuth(emuApp);
connectAuthEmulator(emuAuth, 'http://127.0.0.1:50199');

async function createSampleData(colName) {
  try {
    console.log(`Creating sample data for ${colName}...`);
    
    // 샘플 데이터 생성
    const sampleData = {
      market: [
        { id: '1', title: '핸드폰', price: 3333, location: '민락동', timeAgo: '6분 전' },
        { id: '2', title: '가방', price: 4, location: '알 수 없음', timeAgo: '1시간 전' }
      ],
      users: [
        { id: 'user1', name: '테스트 사용자', email: 'test@example.com' }
      ],
      chats: [
        { id: 'chat1', participants: ['user1'], lastMessage: '안녕하세요' }
      ],
      categories: [
        { id: '1', name: '전체', active: true },
        { id: '2', name: '축구화', active: false },
        { id: '3', name: '유니폼', active: false }
      ]
    };
    
    const data = sampleData[colName] || [];
    for (const item of data) {
      await setDoc(doc(emuDb, colName, item.id), item, { merge: true });
    }
    console.log(`✅ Created ${data.length} sample documents for ${colName}`);
  } catch (error) {
    console.error(`❌ Error creating sample data for ${colName}:`, error.message);
  }
}

// 에뮬레이터가 실행 중인지 확인
console.log('🚀 Starting sample data creation in emulator...');
console.log('⚠️  Make sure emulator is running: npm run emu');

// 익명 로그인으로 인증
console.log('🔐 Authenticating...');
await signInAnonymously(emuAuth);
console.log('✅ Authentication successful');

// 샘플 데이터 생성
await createSampleData('market');
await createSampleData('users');
await createSampleData('chats');
await createSampleData('categories');

console.log('🎉 All sample data created successfully!');
console.log('💡 You can now view the data in Emulator UI: http://127.0.0.1:4001/');
process.exit(0);
