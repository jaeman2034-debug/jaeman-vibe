// 브라우저 콘솔에서 실행할 Firestore 보정 스크립트
// 사용법: 브라우저 개발자 도구 콘솔에서 복사-붙여넣기

// ===== 단일 문서 테스트 (먼저 실행) =====
async function testSingleDocument() {
  console.log('🧪 단일 문서 테스트 시작...');
  
  // 문서 ID를 여기에 입력하세요
  const id = '문서ID'; // 예: eS5wVgVIJLTkQe6oYuHW
  
  if (id === '문서ID') {
    console.error('❌ 문서 ID를 입력해주세요!');
    return;
  }
  
  try {
    const ref = window.fs.doc(window.db, 'market_items', id);
    const d = await window.fs.getDoc(ref);
    
    if (!d.exists()) {
      console.error('❌ 문서를 찾을 수 없습니다:', id);
      return;
    }
    
    const data = d.data();
    const thumbUrl = data.thumbUrl || data.images?.[0]?.url || '';
    
    console.log('📄 문서 데이터:', {
      id,
      title: data.title,
      thumbUrl: data.thumbUrl,
      images: data.images,
      newThumbUrl: thumbUrl,
      isSold: data.isSold,
      deleted: data.deleted,
      createdAt: data.createdAt
    });
    
    await window.fs.updateDoc(ref, { 
      thumbUrl: thumbUrl || '',
      isSold: data.isSold ?? false,
      deleted: data.deleted ?? false,
      createdAt: data.createdAt ?? window.fs.serverTimestamp(),
      updatedAt: window.fs.serverTimestamp(),
    });
    
    console.log('✅ 단일 문서 테스트 완료!');
  } catch (error) {
    console.error('❌ 단일 문서 테스트 실패:', error);
  }
}

// ===== 전체 컬렉션 보정 =====
async function backfillAllDocuments() {
  console.log('🚀 전체 문서 보정 시작...');
  
  try {
    const col = window.fs.collection(window.db, 'market_items');
    const snap = await window.fs.getDocs(col);
    
    console.log(`📊 총 ${snap.docs.length}개 문서 발견`);
    
    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const docSnap of snap.docs) {
      try {
        const data = docSnap.data();
        const thumbUrl = data.thumbUrl || data.images?.[0]?.url || '';
        
        // 업데이트할 필드들
        const updates: any = {
          thumbUrl: thumbUrl || '',
          isSold: data.isSold ?? false,
          deleted: data.deleted ?? false,
          updatedAt: window.fs.serverTimestamp(),
        };
        
        // createdAt이 없으면 추가
        if (!data.createdAt) {
          updates.createdAt = window.fs.serverTimestamp();
        }
        
        // 실제로 변경사항이 있는지 확인
        const hasChanges = 
          !data.thumbUrl && thumbUrl ||
          data.isSold === undefined ||
          data.deleted === undefined ||
          !data.createdAt ||
          !data.updatedAt;
        
        if (hasChanges) {
          await window.fs.updateDoc(docSnap.ref, updates);
          updated++;
          console.log(`✅ 업데이트: ${docSnap.id} - ${data.title || 'Untitled'}`);
        } else {
          skipped++;
          console.log(`⏭️  스킵: ${docSnap.id} - ${data.title || 'Untitled'} (이미 완료)`);
        }
        
        processed++;
        
        // 진행률 표시
        if (processed % 10 === 0) {
          console.log(`📈 진행률: ${processed}/${snap.docs.length} (${Math.round(processed/snap.docs.length*100)}%)`);
        }
        
      } catch (error) {
        errors++;
        console.error(`❌ 문서 ${docSnap.id} 처리 실패:`, error);
      }
    }
    
    console.log('🎉 보정 완료!');
    console.log(`📊 결과:`);
    console.log(`  - 처리된 문서: ${processed}`);
    console.log(`  - 업데이트된 문서: ${updated}`);
    console.log(`  - 스킵된 문서: ${skipped}`);
    console.log(`  - 오류: ${errors}`);
    
  } catch (error) {
    console.error('❌ 전체 보정 실패:', error);
  }
}

// ===== 컬렉션 통계 확인 =====
async function checkCollectionStats() {
  console.log('📊 컬렉션 통계 확인 중...');
  
  try {
    const col = window.fs.collection(window.db, 'market_items');
    const snap = await window.fs.getDocs(col);
    
    let total = 0;
    let withThumbUrl = 0;
    let withImages = 0;
    let withIsSold = 0;
    let withDeleted = 0;
    let withCreatedAt = 0;
    let noImage = 0;
    
    snap.docs.forEach(doc => {
      const data = doc.data();
      total++;
      
      if (data.thumbUrl) withThumbUrl++;
      if (data.images?.[0]?.url) withImages++;
      if (data.isSold !== undefined) withIsSold++;
      if (data.deleted !== undefined) withDeleted++;
      if (data.createdAt) withCreatedAt++;
      if (!data.thumbUrl && !data.images?.[0]?.url) noImage++;
    });
    
    console.log('📊 market_items 컬렉션 통계:');
    console.log(`  - 총 문서 수: ${total}`);
    console.log(`  - thumbUrl 있는 문서: ${withThumbUrl} (${Math.round(withThumbUrl/total*100)}%)`);
    console.log(`  - images[0].url 있는 문서: ${withImages} (${Math.round(withImages/total*100)}%)`);
    console.log(`  - isSold 필드 있는 문서: ${withIsSold} (${Math.round(withIsSold/total*100)}%)`);
    console.log(`  - deleted 필드 있는 문서: ${withDeleted} (${Math.round(withDeleted/total*100)}%)`);
    console.log(`  - createdAt 필드 있는 문서: ${withCreatedAt} (${Math.round(withCreatedAt/total*100)}%)`);
    console.log(`  - 이미지 없는 문서: ${noImage} (${Math.round(noImage/total*100)}%)`);
    
  } catch (error) {
    console.error('❌ 통계 확인 실패:', error);
  }
}

// ===== 전역 함수로 등록 =====
if (typeof window !== 'undefined') {
  (window as any).testSingleDocument = testSingleDocument;
  (window as any).backfillAllDocuments = backfillAllDocuments;
  (window as any).checkCollectionStats = checkCollectionStats;
  
  console.log('🔧 콘솔 함수 등록 완료:');
  console.log('  - testSingleDocument() : 단일 문서 테스트');
  console.log('  - backfillAllDocuments() : 전체 문서 보정');
  console.log('  - checkCollectionStats() : 컬렉션 통계 확인');
}

export { testSingleDocument, backfillAllDocuments, checkCollectionStats };
