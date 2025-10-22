// Firebase Storage 업로드 테스트 스크립트
// 브라우저 콘솔에서 실행하세요

console.log("🧪 Firebase Storage 업로드 테스트 시작...");

// Firebase가 전역에 있다고 가정
if (typeof firebase === 'undefined') {
  console.error("❌ Firebase가 로드되지 않았습니다.");
} else {
  console.log("✅ Firebase 로드됨");
  
  // Storage 참조 생성
  const storage = firebase.storage();
  const testRef = storage.ref('test/upload-test.txt');
  
  // 테스트 데이터 생성
  const testData = new Blob(['테스트 업로드 데이터'], { type: 'text/plain' });
  
  console.log("📤 테스트 파일 업로드 시작...");
  
  testRef.put(testData).then((snapshot) => {
    console.log("✅ 업로드 성공:", snapshot);
    console.log("   파일 경로:", snapshot.ref.fullPath);
    console.log("   파일 크기:", snapshot.metadata.size);
    
    // downloadURL 가져오기
    return snapshot.ref.getDownloadURL();
  }).then((downloadURL) => {
    console.log("✅ downloadURL 획득:", downloadURL);
    console.log("   URL 길이:", downloadURL.length);
    console.log("   URL 시작:", downloadURL.substring(0, 50) + "...");
    
    // URL 유효성 검사
    if (downloadURL.startsWith("https://firebasestorage.googleapis.com/")) {
      console.log("✅ 유효한 Firebase Storage URL");
      
      // 실제 URL 접근 테스트
      fetch(downloadURL)
        .then(response => {
          console.log("🌐 URL 접근 테스트:", response.status, response.statusText);
          if (response.ok) {
            console.log("✅ URL 접근 성공!");
          } else {
            console.error("❌ URL 접근 실패:", response.status);
          }
        })
        .catch(error => {
          console.error("❌ URL 접근 오류:", error);
        });
    } else {
      console.error("❌ 잘못된 URL 형식:", downloadURL);
    }
  }).catch((error) => {
    console.error("❌ 업로드 실패:", error);
    console.error("   오류 코드:", error.code);
    console.error("   오류 메시지:", error.message);
  });
}
