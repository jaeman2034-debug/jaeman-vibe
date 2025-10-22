import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

// Firebase 초기화
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateCourses() {
  console.log("🚀 강좌 마이그레이션 시작...");
  
  try {
    const snap = await getDocs(collection(db, "courses"));
    console.log(`📊 총 ${snap.docs.length}개의 강좌 문서를 발견했습니다.`);

    let updatedCount = 0;

    for (const c of snap.docs) {
      const ref = doc(db, "courses", c.id);
      const data = c.data();

      const updates: any = {};

      // 새 필드들이 없으면 기본값으로 추가
      if (!("schedule" in data)) {
        updates.schedule = "매주 토요일 오전 10시 ~ 12시";
      }
      if (!("location" in data)) {
        updates.location = "소흘 체육공원 A구장";
      }
      if (!("fee" in data)) {
        updates.fee = "무료";
      }
      if (!("items" in data)) {
        updates.items = "운동화, 개인 물병";
      }
      if (!("target" in data)) {
        updates.target = "초등학생 저학년 (7~10세)";
      }
      if (!("curriculum" in data)) {
        updates.curriculum = [
          "드리블 기본 훈련",
          "패스 & 팀워크",
          "미니게임 실습"
        ];
      }
      if (!("contact" in data)) {
        updates.contact = "010-1234-5678";
      }

      // 업데이트할 필드가 있으면 실행
      if (Object.keys(updates).length > 0) {
        console.log(`📝 업데이트 중: ${c.id}`, updates);
        await updateDoc(ref, updates);
        updatedCount++;
      } else {
        console.log(`✅ 이미 완료: ${c.id} (업데이트 불필요)`);
      }
    }

    console.log(`🎉 마이그레이션 완료! ${updatedCount}개 문서가 업데이트되었습니다.`);
    
  } catch (error) {
    console.error("❌ 마이그레이션 중 오류 발생:", error);
    throw error;
  }
}

// 마이그레이션 실행
migrateCourses()
  .then(() => {
    console.log("✅ 강좌 마이그레이션 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 마이그레이션 실패:", error);
    process.exit(1);
  });
