// 기존 상품들에 누락된 필드들을 추가하는 패치 스크립트
// 브라우저 콘솔에서 실행하세요

async function patchProducts() {
  try {
    // Firebase 모듈 가져오기
    const { collection, getDocs, doc, updateDoc, serverTimestamp } = window.fs;
    const db = window.db;
    
    if (!db || !collection || !getDocs || !doc || !updateDoc || !serverTimestamp) {
      console.error('Firebase 모듈을 찾을 수 없습니다. Firestore 에뮬레이터 UI에서 실행하세요.');
      return;
    }
    
    console.log('상품 패치 시작...');
    
    // 모든 상품 가져오기 (올바른 컬렉션 경로 사용)
    const productsSnapshot = await getDocs(collection(db, "market_items"));
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`총 ${products.length}개의 상품을 찾았습니다.`);
    
    let patchedCount = 0;
    
    for (const product of products) {
      const updates = {};
      let needsUpdate = false;
      
      // isActive 필드 추가
      if (product.isActive === undefined) {
        updates.isActive = true;
        needsUpdate = true;
      }
      
      // isDeleted 필드 추가
      if (product.isDeleted === undefined) {
        updates.isDeleted = false;
        needsUpdate = true;
      }
      
      // region 필드 추가
      if (!product.region) {
        updates.region = "KR";
        needsUpdate = true;
      }
      
      // status 필드 확인/수정
      if (!product.status || !["active", "reserved", "sold"].includes(product.status)) {
        updates.status = "active";
        needsUpdate = true;
      }
      
      // isSold 필드 추가
      if (product.isSold === undefined) {
        updates.isSold = false;
        needsUpdate = true;
      }
      
      // deleted 필드 추가
      if (product.deleted === undefined) {
        updates.deleted = false;
        needsUpdate = true;
      }
      
      // createdAt 필드 확인/수정
      if (!product.createdAt) {
        updates.createdAt = serverTimestamp();
        needsUpdate = true;
      }
      
      // updatedAt 필드 추가
      updates.updatedAt = serverTimestamp();
      needsUpdate = true;
      
      // 이미지 필드 통합 (기존 이미지가 있으면 thumbUrl에도 추가)
      if (product.images && product.images.length > 0 && !product.thumbUrl) {
        const firstImage = product.images[0];
        if (typeof firstImage === 'string') {
          updates.thumbUrl = firstImage;
          updates.imageUrl = firstImage;
        } else if (firstImage && firstImage.url) {
          updates.thumbUrl = firstImage.url;
          updates.imageUrl = firstImage.url;
        }
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await updateDoc(doc(db, "market_items", product.id), updates);
        console.log(`상품 ${product.id} 패치 완료:`, updates);
        patchedCount++;
      }
    }
    
    console.log(`패치 완료! ${patchedCount}개의 상품이 업데이트되었습니다.`);
    
  } catch (error) {
    console.error('패치 중 오류 발생:', error);
  }
}

// 함수 실행
patchProducts();
