// 🔥 브라우저 콘솔에서 실행할 수 있는 sellerId 자동 수정 스크립트
// Firebase Console의 Firestore Database 페이지에서 F12 → Console → 붙여넣기 → Enter

console.log("🚀 sellerId 자동 수정 스크립트 시작...");

// Firebase SDK가 이미 로드되어 있는지 확인
if (typeof firebase === 'undefined') {
    console.error("❌ Firebase SDK가 로드되지 않았습니다. Firebase Console에서 실행해주세요.");
} else {
    console.log("✅ Firebase SDK 확인됨");
    
    // Firestore 인스턴스 가져오기
    const db = firebase.firestore();
    
    // marketItems 컬렉션의 모든 문서 가져오기
    db.collection('marketItems').get()
        .then((querySnapshot) => {
            console.log(`📦 총 ${querySnapshot.size}개의 상품을 찾았습니다.`);
            
            let updatedCount = 0;
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                
                // sellerId가 없거나 null인 경우에만 수정
                if (!data.sellerId || data.sellerId === null) {
                    console.log(`🔧 수정 중: ${data.title || '제목 없음'} (${doc.id})`);
                    
                    // sellerId 필드 추가 (현재 로그인한 사용자 UID 사용)
                    doc.ref.update({
                        sellerId: 'koHXAnJ9sXVOd4ojWxxhWNYdYOm2' // 실제 UID로 변경하세요
                    }).then(() => {
                        updatedCount++;
                        console.log(`✅ 완료: ${data.title || '제목 없음'}`);
                    }).catch((error) => {
                        console.error(`❌ 오류: ${data.title || '제목 없음'}`, error);
                    });
                } else {
                    console.log(`⏭️ 건너뛰기: ${data.title || '제목 없음'} (이미 sellerId 있음)`);
                }
            });
            
            setTimeout(() => {
                console.log(`🎉 완료! 총 ${updatedCount}개 상품의 sellerId가 수정되었습니다.`);
                console.log("🔄 이제 브라우저에서 상품 상세 페이지를 새로고침하세요!");
            }, 2000);
        })
        .catch((error) => {
            console.error("❌ 오류 발생:", error);
        });
}
