// 브라우저 콘솔에서 실행할 Firebase 데이터 확인 스크립트
// F12 → Console에서 이 코드를 복사해서 실행하세요

console.log("🔍 Firebase 데이터 확인 시작...");

// Firebase 앱이 이미 초기화되어 있다고 가정
// 만약 Firebase가 없다면 먼저 Firebase를 로드해야 합니다

// Firestore 데이터 확인
async function checkFirestoreData() {
  try {
    // Firebase가 전역에 있다고 가정
    if (typeof firebase === 'undefined') {
      console.error("❌ Firebase가 로드되지 않았습니다. 먼저 Firebase를 로드하세요.");
      return;
    }
    
    const db = firebase.firestore();
    const teamsCol = db.collection("teams");
    const snapshot = await teamsCol.get();
    
    console.log(`📊 총 ${snapshot.docs.length}개 팀 발견`);
    console.log("=".repeat(50));
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n🏆 팀 ${index + 1}: ${doc.id}`);
      console.log(`   이름: ${data.name || "없음"}`);
      console.log(`   지역: ${data.region || "없음"}`);
      console.log(`   소개: ${data.intro || "없음"}`);
      console.log(`   생성일: ${data.createdAt || "없음"}`);
      console.log(`   소유자: ${data.ownerUid || "없음"}`);
      
      // 로고 URL 분석
      console.log(`\n🖼️ 로고 URL 분석:`);
      console.log(`   원본: ${data.logoUrl || "없음"}`);
      if (data.logoUrl) {
        console.log(`   타입: ${typeof data.logoUrl}`);
        console.log(`   길이: ${data.logoUrl.length}`);
        console.log(`   시작: ${data.logoUrl.substring(0, 30)}...`);
        
        if (data.logoUrl.startsWith("gs://")) {
          console.log(`   ❌ 문제: gs:// 내부 경로 (브라우저가 읽을 수 없음)`);
        } else if (data.logoUrl.startsWith("https://")) {
          console.log(`   ✅ 정상: 공개 URL`);
          console.log(`   🔗 테스트: ${data.logoUrl}`);
        } else {
          console.log(`   ⚠️  알 수 없음: ${data.logoUrl.substring(0, 20)}...`);
        }
      }
      
      // 커버 URL 분석
      console.log(`\n🖼️ 커버 URL 분석:`);
      console.log(`   원본: ${data.coverUrl || "없음"}`);
      if (data.coverUrl) {
        console.log(`   타입: ${typeof data.coverUrl}`);
        console.log(`   길이: ${data.coverUrl.length}`);
        console.log(`   시작: ${data.coverUrl.substring(0, 30)}...`);
        
        if (data.coverUrl.startsWith("gs://")) {
          console.log(`   ❌ 문제: gs:// 내부 경로 (브라우저가 읽을 수 없음)`);
        } else if (data.coverUrl.startsWith("https://")) {
          console.log(`   ✅ 정상: 공개 URL`);
          console.log(`   🔗 테스트: ${data.coverUrl}`);
        } else {
          console.log(`   ⚠️  알 수 없음: ${data.coverUrl.substring(0, 20)}...`);
        }
      }
      
      console.log("\n" + "=".repeat(50));
    });
    
  } catch (error) {
    console.error("❌ Firestore 데이터 확인 실패:", error);
  }
}

// 스크립트 실행
checkFirestoreData();
