// Firebase Storage에 teams/ 폴더 생성 테스트
// 브라우저 콘솔에서 실행하세요

console.log("📁 Firebase Storage teams/ 폴더 생성 테스트...");

if (typeof firebase === 'undefined') {
  console.error("❌ Firebase가 로드되지 않았습니다.");
} else {
  console.log("✅ Firebase 로드됨");
  
  const storage = firebase.storage();
  
  // teams/ 폴더에 테스트 파일 업로드 (폴더 자동 생성)
  const testRef = storage.ref('teams/test-folder-creation.txt');
  const testData = new Blob(['teams 폴더 생성 테스트'], { type: 'text/plain' });
  
  console.log("📤 teams/ 폴더에 테스트 파일 업로드...");
  console.log("   경로: teams/test-folder-creation.txt");
  
  testRef.put(testData).then((snapshot) => {
    console.log("✅ teams/ 폴더 생성 및 파일 업로드 성공!");
    console.log("   전체 경로:", snapshot.ref.fullPath);
    console.log("   파일 크기:", snapshot.metadata.size);
    
    // downloadURL 가져오기
    return snapshot.ref.getDownloadURL();
  }).then((downloadURL) => {
    console.log("✅ downloadURL 획득:", downloadURL);
    console.log("   URL 길이:", downloadURL.length);
    
    // URL 접근 테스트
    return fetch(downloadURL);
  }).then(response => {
    console.log("🌐 URL 접근 테스트:", response.status, response.statusText);
    if (response.ok) {
      console.log("✅ teams/ 폴더 생성 완료! 이제 팀 이미지를 업로드할 수 있습니다.");
      console.log("📁 Firebase Console → Storage → Files에서 'teams' 폴더를 확인하세요!");
    } else {
      console.error("❌ URL 접근 실패:", response.status);
    }
  }).catch((error) => {
    console.error("❌ teams/ 폴더 생성 실패:", error);
    console.error("   오류 코드:", error.code);
    console.error("   오류 메시지:", error.message);
  });
}
