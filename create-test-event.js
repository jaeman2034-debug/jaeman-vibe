// 테스트 이벤트 생성 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  // Firebase 설정은 환경변수에서 가져오거나 직접 입력
  apiKey: "AIzaSyBvQZvQZvQZvQZvQZvQZvQZvQZvQZvQZvQ",
  authDomain: "jaeman-vibe-platform.firebaseapp.com",
  projectId: "jaeman-vibe-platform",
  storageBucket: "jaeman-vibe-platform.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestEvent() {
  try {
    const eventData = {
      title: "테스트 축구 모임",
      sport: "축구",
      startAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // 내일
      endAt: Timestamp.fromDate(new Date(Date.now() + 25 * 60 * 60 * 1000)), // 내일 + 1시간
      capacity: 20,
      fee: 10000,
      status: "open",
      placeName: "서울시 강남구 테스트 경기장",
      lat: 37.5665,
      lng: 126.9780,
      images: ["https://via.placeholder.com/400x300"],
      hostId: "test-host-id",
      attendeeCount: 0,
      description: "테스트용 축구 모임입니다. 모든 기능을 테스트해보세요!",
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'events'), eventData);
    console.log('테스트 이벤트 생성 완료:', docRef.id);
    console.log('이벤트 URL:', `http://127.0.0.1:5179/events/${docRef.id}`);
  } catch (error) {
    console.error('이벤트 생성 실패:', error);
  }
}

createTestEvent();
