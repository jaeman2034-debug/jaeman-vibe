// 🔥 가장 간단한 sellerId 수정 스크립트
// YAGO VIBE 웹사이트에서 F12 → Console → 붙여넣기 → Enter

console.log("🚀 sellerId 자동 수정 시작...");

// Firebase가 이미 로드되어 있는지 확인
if (typeof window !== 'undefined' && window.firebase) {
    const db = firebase.firestore();
    
    db.collection('marketItems').get().then((snapshot) => {
        let count = 0;
        snapshot.forEach((doc) => {
            if (!doc.data().sellerId) {
                doc.ref.update({
                    sellerId: 'koHXAnJ9sXVOd4ojWxxhWNYdYOm2'
                }).then(() => {
                    count++;
                    console.log(`✅ ${doc.data().title} 수정완료`);
                });
            }
        });
        
        setTimeout(() => {
            console.log(`🎉 총 ${count}개 상품 수정완료! 새로고침하세요!`);
        }, 1000);
    });
} else {
    console.log("❌ Firebase가 로드되지 않았습니다.");
    console.log("📝 대신 새 상품을 등록해서 테스트해보세요!");
}
