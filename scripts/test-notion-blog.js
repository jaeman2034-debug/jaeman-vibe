// Notion 블로그 기능 테스트 스크립트
// 브라우저 콘솔에서 실행

console.log('🧪 Notion 블로그 기능 테스트를 시작합니다...\n');

// 1. n8n 웹훅 테스트
async function testN8nWebhook() {
  console.log('1️⃣ n8n 웹훅 테스트...');
  
  const testPayload = {
    clubId: 'test-123',
    name: '테스트 FC',
    sport: '축구',
    region: '서울 강남구',
    intro: '테스트용 클럽입니다.',
    fee: 30000,
    schedule: ['화 20:00-22:00', '토 09:00-11:00']
  };
  
  try {
    const response = await fetch('https://your-n8n-host/webhook/club-blog-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': 'your-internal-key'
      },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.json();
    console.log('✅ n8n 응답:', result);
    return result;
  } catch (error) {
    console.error('❌ n8n 테스트 실패:', error);
    return null;
  }
}

// 2. Firebase Functions 테스트
async function testFirebaseFunction() {
  console.log('\n2️⃣ Firebase Functions 테스트...');
  
  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const { getAuth } = await import('firebase/auth');
    
    const auth = getAuth();
    if (!auth.currentUser) {
      console.error('❌ 로그인이 필요합니다');
      return;
    }
    
    const fn = httpsCallable(getFunctions(), 'createClubBlog');
    const result = await fn({ clubId: 'test-club-id' });
    
    console.log('✅ Functions 응답:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Functions 테스트 실패:', error);
    return null;
  }
}

// 3. 일괄 생성 테스트
async function backfillClubBlogs() {
  console.log('\n3️⃣ 일괄 생성 테스트...');
  
  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const { getFirestore, collection, getDocs } = await import('firebase/firestore');
    
    const db = getFirestore();
    const fn = httpsCallable(getFunctions(), 'createClubBlog');
    const snap = await getDocs(collection(db, 'clubs'));
    
    let ok = 0, skip = 0, fail = 0;
    
    for (const doc of snap.docs) {
      const d = doc.data() || {};
      if (d.blogUrl) { 
        skip++; 
        continue; 
      }
      
      try {
        console.log(`[CreateBlog] ${doc.id} ${d.name || ''}`);
        const res = await fn({ clubId: doc.id });
        console.log(`  → ${res?.data?.notionUrl || null}`);
        ok++;
      } catch (e) {
        console.warn(`  × fail ${doc.id}`, e?.message || e);
        fail++;
      }
      
      // 레이트리밋 회피
      await new Promise(r => setTimeout(r, 600));
    }
    
    console.log(`\n📊 결과: 성공=${ok}, 건너뜀=${skip}, 실패=${fail}`);
  } catch (error) {
    console.error('❌ 일괄 생성 실패:', error);
  }
}

// 4. 롤백/재생성 도움
async function resetClubBlog(clubId) {
  console.log(`\n4️⃣ 클럽 ${clubId} 블로그 필드 초기화...`);
  
  try {
    const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
    const db = getFirestore();
    
    await updateDoc(doc(db, 'clubs', clubId), {
      blogProvider: null,
      blogUrl: null,
      blogCreatedAt: null,
    });
    
    console.log('✅ 초기화 완료');
  } catch (error) {
    console.error('❌ 초기화 실패:', error);
  }
}

// 실행
console.log('테스트를 실행하려면 다음 함수를 호출하세요:');
console.log('- testN8nWebhook() : n8n 웹훅 테스트');
console.log('- testFirebaseFunction() : Firebase Functions 테스트');
console.log('- backfillClubBlogs() : 일괄 생성 테스트');
console.log('- resetClubBlog("club-id") : 특정 클럽 블로그 필드 초기화');

// 자동 실행 (옵션)
// testN8nWebhook();
// testFirebaseFunction();
