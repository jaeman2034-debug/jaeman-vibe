// Firebase Firestore 데이터 확인 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBvOkBwJ7BwJ7BwJ7BwJ7BwJ7BwJ7BwJ7Bw",
  authDomain: "jaeman-vibe-platform.firebaseapp.com",
  projectId: "jaeman-vibe-platform",
  storageBucket: "jaeman-vibe-platform.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkFirestoreData() {
  try {
    console.log("🔍 Firestore 팀 데이터 확인 중...");
    
    const teamsCol = collection(db, "teams");
    const snapshot = await getDocs(teamsCol);
    
    console.log(`📊 총 ${snapshot.docs.length}개 팀 발견`);
    console.log("=" * 50);
    
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
        } else {
          console.log(`   ⚠️  알 수 없음: ${data.coverUrl.substring(0, 20)}...`);
        }
      }
      
      console.log("\n" + "=" * 50);
    });
    
  } catch (error) {
    console.error("❌ Firestore 데이터 확인 실패:", error);
  }
}

// 스크립트 실행
checkFirestoreData();
