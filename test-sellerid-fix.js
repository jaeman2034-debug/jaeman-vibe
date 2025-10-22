// sellerId 수정 테스트 스크립트
// 브라우저 콘솔에서 실행하세요

console.log('🧪 sellerId 수정 테스트 시작...');

async function testSellerIdFix() {
  try {
    // Firestore import
    const { collection, getDocs, updateDoc, doc } = await import('firebase/firestore');
    
    // 현재 사용자 확인
    const currentUser = window.auth?.currentUser;
    if (!currentUser) {
      console.error('❌ 로그인된 사용자가 없습니다.');
      return;
    }
    
    console.log('✅ 현재 사용자:', currentUser.uid);
    
    // marketItems 컬렉션의 모든 문서 가져오기
    const db = window.db;
    const querySnapshot = await getDocs(collection(db, 'marketItems'));
    
    console.log(`📦 총 ${querySnapshot.size}개의 상품을 확인합니다...`);
    
    let fixedCount = 0;
    let alreadyFixedCount = 0;
    let errorCount = 0;
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const docId = docSnapshot.id;
      
      console.log(`\n📄 문서 ID: ${docId}`);
      console.log(`  - 제목: ${data.title || 'N/A'}`);
      console.log(`  - 현재 sellerId: ${data.sellerId || 'null'}`);
      console.log(`  - 현재 sellerUid: ${data.sellerUid || 'null'}`);
      
      // sellerId가 있으면 이미 수정됨
      if (data.sellerId) {
        console.log('  ✅ 이미 sellerId가 있습니다.');
        alreadyFixedCount++;
        continue;
      }
      
      // sellerUid가 있으면 sellerId로 이동
      if (data.sellerUid) {
        console.log('  🔄 sellerUid를 sellerId로 이동합니다...');
        try {
          await updateDoc(doc(db, 'marketItems', docId), {
            sellerId: data.sellerUid,
            updatedAt: new Date().toISOString()
          });
          
          console.log('  ✅ sellerId 이동 완료!');
          fixedCount++;
        } catch (error) {
          console.error('  ❌ sellerId 이동 실패:', error);
          errorCount++;
        }
      } else {
        // 둘 다 없으면 현재 사용자 ID로 설정
        console.log('  🔧 sellerId를 현재 사용자로 설정합니다...');
        try {
          await updateDoc(doc(db, 'marketItems', docId), {
            sellerId: currentUser.uid,
            updatedAt: new Date().toISOString()
          });
          
          console.log('  ✅ sellerId 설정 완료!');
          fixedCount++;
        } catch (error) {
          console.error('  ❌ sellerId 설정 실패:', error);
          errorCount++;
        }
      }
    }
    
    console.log('\n🎉 수정 완료!');
    console.log(`  - 수정된 상품: ${fixedCount}개`);
    console.log(`  - 이미 정상인 상품: ${alreadyFixedCount}개`);
    console.log(`  - 오류 발생: ${errorCount}개`);
    console.log(`  - 총 상품: ${querySnapshot.size}개`);
    
    if (fixedCount > 0) {
      console.log('\n🔄 페이지를 새로고침하면 관리자 메뉴가 표시됩니다!');
      console.log('✅ 예상 결과:');
      console.log('  - userId: kohXYANy9sVX0o4dJWxkhWHdYOm2');
      console.log('  - sellerId: kohXYANy9sVX0o4dJWxkhWHdYOm2');
      console.log('  - isOwner: true');
    }
    
  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error);
  }
}

// 실행
testSellerIdFix();
