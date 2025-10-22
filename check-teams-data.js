// 기존 팀들의 데이터 상태 확인
console.log("🔍 기존 팀들의 데이터 상태 확인...");

if (typeof firebase === 'undefined') {
  console.error("❌ Firebase가 로드되지 않았습니다.");
} else {
  const db = firebase.firestore();
  
  console.log("📊 모든 팀 데이터 조회 중...");
  
  db.collection("teams").get().then((snapshot) => {
    console.log(`📊 총 ${snapshot.docs.length}개 팀 발견`);
    console.log("=".repeat(50));
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n🏆 팀 ${index + 1}: ${doc.id}`);
      console.log(`   팀 이름: ${data.name || "없음"}`);
      console.log(`   지역: ${data.region || "없음"}`);
      console.log(`   소개: ${data.intro || "없음"}`);
      console.log(`   로고 URL: ${data.logoUrl || "없음"}`);
      console.log(`   커버 URL: ${data.coverUrl || "없음"}`);
      console.log(`   생성일: ${data.createdAt || "없음"}`);
      console.log(`   소유자: ${data.ownerUid || "없음"}`);
      
      // logoUrl 분석
      if (data.logoUrl) {
        console.log(`   📸 로고 URL 분석:`);
        console.log(`     - 타입: ${typeof data.logoUrl}`);
        console.log(`     - 길이: ${data.logoUrl.length}`);
        console.log(`     - 시작: ${data.logoUrl.substring(0, 30)}...`);
        
        if (data.logoUrl.startsWith("https://")) {
          console.log(`     - ✅ 공개 URL (정상)`);
        } else if (data.logoUrl.startsWith("gs://")) {
          console.log(`     - ❌ 내부 경로 (브라우저가 읽을 수 없음)`);
        } else {
          console.log(`     - ⚠️  알 수 없는 형식`);
        }
      } else {
        console.log(`   📸 로고 URL: 없음 (빈 값)`);
      }
      
      console.log("-".repeat(30));
    });
    
    console.log("\n🎯 결론:");
    console.log("   - logoUrl이 비어있거나 잘못된 형식이면 이미지가 안 보입니다");
    console.log("   - https://로 시작하는 공개 URL이어야 브라우저에서 표시됩니다");
    console.log("   - teams/ 폴더에 실제 파일이 있어야 getDownloadURL()이 작동합니다");
    
  }).catch((error) => {
    console.error("❌ 팀 데이터 조회 실패:", error);
  });
}
