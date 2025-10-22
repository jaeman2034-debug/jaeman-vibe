import { initializeApp } from "firebase/app";
import { getFirestore, doc, deleteDoc, collection, getDocs } from "firebase/firestore";

// Firebase 초기화
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listCourses() {
  try {
    console.log("📚 등록된 강좌 목록:");
    console.log("=" .repeat(50));
    
    const querySnapshot = await getDocs(collection(db, "academy", "courses", "list"));
    
    if (querySnapshot.empty) {
      console.log("등록된 강좌가 없습니다.");
      return;
    }
    
    querySnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ID: ${doc.id}`);
      console.log(`   제목: ${data.title}`);
      console.log(`   강사: ${data.instructor}`);
      console.log(`   일정: ${data.date}`);
      console.log(`   가격: ${data.price === 0 ? "무료" : `${data.price.toLocaleString()}원`}`);
      console.log("   " + "-".repeat(40));
    });
    
    console.log("\n💡 사용법:");
    console.log("특정 강좌를 삭제하려면:");
    console.log("npx ts-node scripts/deleteCourse.ts --delete COURSE_ID");
    console.log("\n예시:");
    console.log("npx ts-node scripts/deleteCourse.ts --delete abc123def456");
    
  } catch (error) {
    console.error("❌ 강좌 목록 조회 실패:", error);
  }
}

async function deleteSpecificCourse(courseId: string) {
  try {
    console.log(`🗑️ 강좌 삭제 시도: ${courseId}`);
    
    const courseRef = doc(db, "academy", "courses", "list", courseId);
    await deleteDoc(courseRef);
    
    console.log("✅ 강좌가 성공적으로 삭제되었습니다!");
    
  } catch (error) {
    console.error("❌ 강좌 삭제 실패:", error);
    console.log("\n가능한 원인:");
    console.log("1. 강좌 ID가 잘못되었습니다.");
    console.log("2. Firebase 권한이 없습니다.");
    console.log("3. 네트워크 연결 문제입니다.");
  }
}

// 명령행 인수 처리
const args = process.argv.slice(2);

if (args.includes("--delete") && args.length > 1) {
  const courseId = args[args.indexOf("--delete") + 1];
  if (courseId) {
    deleteSpecificCourse(courseId);
  } else {
    console.log("❌ 삭제할 강좌 ID를 입력해주세요.");
    console.log("사용법: npx ts-node scripts/deleteCourse.ts --delete COURSE_ID");
  }
} else {
  listCourses();
}
