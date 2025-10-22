// scripts/seedAcademy.cjs
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

async function seedAcademy() {
  const app = initializeApp({
    projectId: process.env.VITE_FB_PROJECT_ID || "your-project-id", // ✅ 실제 Firebase 프로젝트 ID로 교체
  });
  const db = getFirestore(app);

  console.log("🌱 Seeding Firestore demo data...");

  // 아카데미 강좌 더미 데이터
  const coursesRef = db.collection("academyCourses");

  const demoCourse = {
    title: "⚽ 유소년 축구 아카데미",
    description: "주 2회 훈련, 기본기 & 체력 강화",
    coach: "홍코치",
    schedule: "매주 화/목 오후 5시",
    fee: 150000,
    createdAt: new Date(),
  };

  const docRef = await coursesRef.add(demoCourse);
  console.log(`✅ Demo course created with ID: ${docRef.id}`);

  // 수강생 샘플 등록
  await db.collection(`academyCourses/${docRef.id}/enrollments`).add({
    student: "김민수",
    phone: "01012345678",
    email: "minsu@example.com",
    paid: false,
    createdAt: new Date(),
  });

  console.log("✅ Sample enrollment created");
  console.log("🌱 Seeding complete!");
}

seedAcademy().catch((err) => {
  console.error("❌ Error seeding Firestore:", err);
});
