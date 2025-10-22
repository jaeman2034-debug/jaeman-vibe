// 브라우저 콘솔에서 실행할 테스트 이벤트 생성 스크립트
// http://127.0.0.1:5179 에서 F12 → Console에서 실행하세요

async function createTestEvent() {
  try {
    // Firebase가 이미 초기화되어 있다고 가정
    const { db } = await import('./src/lib/firebase.ts');
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    
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
    console.log('✅ 테스트 이벤트 생성 완료:', docRef.id);
    console.log('🔗 이벤트 URL:', `http://127.0.0.1:5179/events/${docRef.id}`);
    
    // 자동으로 이벤트 페이지로 이동
    window.open(`/events/${docRef.id}`, '_blank');
    
    return docRef.id;
  } catch (error) {
    console.error('❌ 이벤트 생성 실패:', error);
    return null;
  }
}

// 사용법 안내
console.log(`
🚀 테스트 이벤트 생성 스크립트 로드됨

사용법:
1. createTestEvent() 실행
2. 생성된 이벤트 ID로 자동 이동
3. 이벤트 목록에서도 확인 가능

실행: createTestEvent()
`);

// 자동 실행 (선택사항)
// createTestEvent();
