// 기존 팀들의 logoUrl 즉시 수정
console.log("🔧 기존 팀들의 logoUrl 즉시 수정 시작...");

if (typeof firebase === 'undefined') {
  console.error("❌ Firebase가 로드되지 않았습니다.");
} else {
  const db = firebase.firestore();
  const defaultLogoUrl = "https://via.placeholder.com/120x120.png?text=Team+Logo";
  
  console.log("📊 모든 팀 데이터 조회 중...");
  
  db.collection("teams").get().then((snapshot) => {
    console.log(`📊 총 ${snapshot.docs.length}개 팀 발견`);
    
    const promises = [];
    let updateCount = 0;
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`\n🏆 팀 [${doc.id}] 처리 중...`);
      console.log(`   현재 logoUrl:`, data.logoUrl);
      console.log(`   팀 이름:`, data.name);
      
      // logoUrl이 없거나 비어있는 경우 수정
      if (!data.logoUrl || data.logoUrl.trim() === "" || data.logoUrl === "undefined") {
        console.log(`   🔄 logoUrl 수정 필요 → 기본 이미지로 설정`);
        
        const updatePromise = doc.ref.update({
          logoUrl: defaultLogoUrl
        }).then(() => {
          console.log(`   ✅ 팀 [${doc.id}] logoUrl 업데이트 완료`);
          updateCount++;
        }).catch((error) => {
          console.error(`   ❌ 팀 [${doc.id}] 업데이트 실패:`, error);
        });
        
        promises.push(updatePromise);
      } else {
        console.log(`   ⏭️ 팀 [${doc.id}] logoUrl 이미 존재:`, data.logoUrl);
      }
    });
    
    // 모든 업데이트 완료 후 결과 출력
    Promise.all(promises).then(() => {
      console.log(`\n🎉 팀 logoUrl 수정 완료! ${updateCount}개 팀 업데이트됨`);
      console.log("🔄 페이지를 새로고침하세요! (F5 키)");
      console.log("📱 새로고침 후 블로그 목록에서 이미지를 확인하세요!");
    }).catch((error) => {
      console.error("❌ 일부 업데이트 실패:", error);
    });
    
  }).catch((error) => {
    console.error("❌ 팀 데이터 조회 실패:", error);
  });
}
