// 간단한 Firebase Storage teams/ 폴더 생성
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firebase 설정 (하드코딩)
const firebaseConfig = {
  apiKey: "AIzaSyBvOkBwJ7BwJ7BwJ7BwJ7BwJ7BwJ7BwJ7Bw",
  authDomain: "jaeman-vibe-platform.firebaseapp.com",
  projectId: "jaeman-vibe-platform",
  storageBucket: "jaeman-vibe-platform.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo"
};

async function createTeamsFolder() {
  try {
    console.log("🚀 Firebase Storage teams/ 폴더 생성 시작...");
    
    // Firebase 앱 초기화
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);
    
    // teams/ 폴더에 테스트 파일 업로드 (폴더 자동 생성)
    const testRef = ref(storage, 'teams/test-folder-creation.txt');
    const testData = new Blob(['teams 폴더 생성 테스트'], { type: 'text/plain' });
    
    console.log("📤 teams/ 폴더에 테스트 파일 업로드...");
    console.log("   경로: teams/test-folder-creation.txt");
    
    // 파일 업로드
    const snapshot = await uploadBytes(testRef, testData);
    console.log("✅ teams/ 폴더 생성 및 파일 업로드 성공!");
    console.log("   전체 경로:", snapshot.ref.fullPath);
    console.log("   파일 크기:", snapshot.metadata.size);
    
    // downloadURL 가져오기
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("✅ downloadURL 획득:", downloadURL);
    console.log("   URL 길이:", downloadURL.length);
    
    // URL 접근 테스트
    const response = await fetch(downloadURL);
    console.log("🌐 URL 접근 테스트:", response.status, response.statusText);
    
    if (response.ok) {
      console.log("✅ teams/ 폴더 생성 완료!");
      console.log("📁 Firebase Console에서 'teams' 폴더를 확인하세요!");
      console.log("🔄 Firebase Console을 새로고침하세요!");
    } else {
      console.error("❌ URL 접근 실패:", response.status);
    }
    
  } catch (error) {
    console.error("❌ teams/ 폴더 생성 실패:", error);
    console.error("   오류 코드:", error.code);
    console.error("   오류 메시지:", error.message);
  }
}

// 스크립트 실행
createTeamsFolder();
