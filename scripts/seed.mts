import * as admin from 'firebase-admin';

// Firebase 초기화
admin.initializeApp();
const db = admin.firestore();

async function seed() {
  console.log('🌱 Starting seed data creation...');
  
  const now = admin.firestore.FieldValue.serverTimestamp();
  const testSellerUid = 'TEST_SELLER_UID';
  const testBuyerUid = 'TEST_BUYER_UID';
  
  try {
    // 1. 테스트 사용자 생성
    console.log('👤 Creating test users...');
    await db.doc(`users/${testSellerUid}`).set({
      role: 'seller',
      email: 'seller@test.com',
      displayName: '테스트 판매자',
      createdAt: now
    });
    
    await db.doc(`users/${testBuyerUid}`).set({
      role: 'buyer',
      email: 'buyer@test.com',
      displayName: '테스트 구매자',
      createdAt: now
    });

    // 2. 파일럿 Allowlist에 추가
    console.log('🎯 Adding users to pilot allowlist...');
    await db.doc(`pilot_allowlist/${testSellerUid}`).set({
      addedAt: now,
      email: 'seller@test.com',
      name: '테스트 판매자'
    });
    
    await db.doc(`pilot_allowlist/${testBuyerUid}`).set({
      addedAt: now,
      email: 'buyer@test.com',
      name: '테스트 구매자'
    });

    // 3. 마켓 아이템 생성
    console.log('🛒 Creating market items...');
    const market = await db.collection('market').add({
      ownerId: testSellerUid,
      title: '파일럿 축구화(270)',
      description: '파일럿 테스트용 축구화입니다. 상태 양호.',
      price: 39000,
      category: 'footwear',
      region: 'KR',
      state: 'listed',
      createdAt: now,
      published: true,
      status: 'active',
      keywords: ['축구화', '270', '파일럿', '테스트']
    });

    // 4. 클럽/모임 생성
    console.log('⚽ Creating club events...');
    const club = await db.collection('clubs').add({
      ownerId: testSellerUid,
      name: '도봉 풋살 번개',
      description: '파일럿 테스트용 풋살 모임입니다.',
      date: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 86400000)),
      capacity: 10,
      location: '도봉구 풋살장',
      createdAt: now,
      status: 'active'
    });

    // 5. 구인구직 생성
    console.log('💼 Creating job postings...');
    const job = await db.collection('jobs').add({
      ownerId: testSellerUid,
      title: '주말 심판 모집',
      description: '파일럿 테스트용 심판 모집 공고입니다.',
      pay: 50000,
      location: '서울 도봉',
      type: 'part-time',
      createdAt: now,
      status: 'active'
    });

    // 6. 시설/대관 생성
    console.log('🏟️ Creating facilities...');
    const facility = await db.collection('facilities').add({
      ownerId: testSellerUid,
      name: '창동 풋살장 A',
      description: '파일럿 테스트용 풋살장입니다.',
      pricePerHour: 40000,
      slots: ['19:00', '20:00', '21:00'],
      location: '서울 도봉구 창동',
      createdAt: now,
      status: 'active'
    });

    // 7. Runtime Feature Flags 초기화
    console.log('🚩 Setting up feature flags...');
    await db.doc('config/runtime').set({
      payments_enabled: false,
      pilot_mode: true,
      moderation_required: true,
      search_v2: false,
      voice_signup_v2: false,
      updatedAt: now,
      updatedBy: 'system'
    }, { merge: true });

    console.log('✅ Seed data created successfully!');
    console.log('📊 Created items:');
    console.log(`  - Market: ${market.id}`);
    console.log(`  - Club: ${club.id}`);
    console.log(`  - Job: ${job.id}`);
    console.log(`  - Facility: ${facility.id}`);
    console.log(`  - Pilot users: ${testSellerUid}, ${testBuyerUid}`);
    
  } catch (error) {
    console.error('❌ Seed data creation failed:', error);
    throw error;
  }
}

// 실행
seed()
  .then(() => {
    console.log('🎉 Seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed failed:', error);
    process.exit(1);
  });
