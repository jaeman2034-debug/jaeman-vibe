// 기존 상품의 sellerUid를 수정하는 스크립트
// 브라우저 콘솔에서 실행하세요

console.log('🔧 기존 상품 sellerUid 수정 시작...');

async function fixExistingProducts() {
  try {
    // Firestore import
    const { collection, getDocs, updateDoc, doc } = await import('firebase/firestore');
    const { getFirestore } = await import('firebase/firestore');
    
    // 현재 사용자 확인
    const currentUser = window.auth?.currentUser;
    if (!currentUser) {
      console.error('❌ 로그인된 사용자가 없습니다.');
      return;
    }
    
    console.log('✅ 현재 사용자:', currentUser.uid);
    
    // marketItems 컬렉션의 모든 문서 가져오기
    const db = window.db || getFirestore();
    const querySnapshot = await getDocs(collection(db, 'marketItems'));
    
    console.log(`📦 총 ${querySnapshot.size}개의 상품을 확인합니다...`);
    
    let fixedCount = 0;
    let alreadyFixedCount = 0;
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const docId = docSnapshot.id;
      
      console.log(`\n📄 문서 ID: ${docId}`);
      console.log(`  - 제목: ${data.title || 'N/A'}`);
      console.log(`  - 현재 sellerUid: ${data.sellerUid || 'null'}`);
      
      if (data.sellerUid) {
        console.log('  ✅ 이미 sellerUid가 있습니다.');
        alreadyFixedCount++;
      } else {
        console.log('  🔧 sellerUid를 추가합니다...');
        
        try {
          await updateDoc(doc(db, 'marketItems', docId), {
            sellerUid: currentUser.uid,
            updatedAt: new Date().toISOString()
          });
          
          console.log('  ✅ sellerUid 추가 완료!');
          fixedCount++;
        } catch (error) {
          console.error('  ❌ sellerUid 추가 실패:', error);
        }
      }
    }
    
    console.log('\n🎉 수정 완료!');
    console.log(`  - 수정된 상품: ${fixedCount}개`);
    console.log(`  - 이미 정상인 상품: ${alreadyFixedCount}개`);
    console.log(`  - 총 상품: ${querySnapshot.size}개`);
    
    if (fixedCount > 0) {
      console.log('\n🔄 페이지를 새로고침하면 관리자 메뉴가 표시됩니다!');
    }
    
  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error);
  }
}

// 실행
fixExistingProducts();
