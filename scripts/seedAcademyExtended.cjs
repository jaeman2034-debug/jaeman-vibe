// scripts/seedAcademyExtended.cjs
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

async function seedAcademyExtended() {
  const app = initializeApp({
    projectId: process.env.VITE_FB_PROJECT_ID || "your-project-id",
  });
  const db = getFirestore(app);

  console.log("🌱 Seeding extended Firestore demo data...");

  // 아카데미 강좌 더미 데이터 (여러 강좌)
  const coursesRef = db.collection("academyCourses");

  const courses = [
    {
      title: "⚽ 유소년 축구 아카데미",
      description: "주 2회 훈련, 기본기 & 체력 강화",
      coach: "홍코치",
      schedule: "매주 화/목 오후 5시",
      fee: 150000,
      maxStudents: 20,
      currentStudents: 0,
      startDate: "2024-02-01",
      endDate: "2024-02-28",
      createdAt: new Date(),
    },
    {
      title: "🏀 청소년 농구 아카데미",
      description: "주 3회 훈련, 기술 & 전술 연습",
      coach: "김코치",
      schedule: "매주 월/수/금 오후 6시",
      fee: 200000,
      maxStudents: 15,
      currentStudents: 0,
      startDate: "2024-02-05",
      endDate: "2024-03-05",
      createdAt: new Date(),
    },
    {
      title: "🎾 테니스 기초반",
      description: "테니스 기본기부터 시작하는 초보자반",
      coach: "박코치",
      schedule: "매주 토/일 오전 10시",
      fee: 120000,
      maxStudents: 12,
      currentStudents: 0,
      startDate: "2024-02-10",
      endDate: "2024-03-10",
      createdAt: new Date(),
    }
  ];

  const courseIds = [];
  for (const course of courses) {
    const docRef = await coursesRef.add(course);
    courseIds.push(docRef.id);
    console.log(`✅ Course created: ${course.title} (ID: ${docRef.id})`);
  }

  // 각 강좌별 샘플 수강생 등록
  const enrollments = [
    // 축구 아카데미 수강생들
    {
      courseId: courseIds[0],
      student: "김민수",
      phone: "01012345678",
      email: "minsu@example.com",
      paid: false,
      createdAt: new Date(),
    },
    {
      courseId: courseIds[0],
      student: "이지은",
      phone: "01023456789",
      email: "jieun@example.com",
      paid: true,
      paymentAmount: 150000,
      paymentMethod: "카드",
      paidAt: new Date(),
      createdAt: new Date(),
    },
    {
      courseId: courseIds[0],
      student: "박준호",
      phone: "01034567890",
      email: "junho@example.com",
      paid: false,
      createdAt: new Date(),
    },
    // 농구 아카데미 수강생들
    {
      courseId: courseIds[1],
      student: "최수진",
      phone: "01045678901",
      email: "sujin@example.com",
      paid: true,
      paymentAmount: 200000,
      paymentMethod: "계좌이체",
      paidAt: new Date(),
      createdAt: new Date(),
    },
    {
      courseId: courseIds[1],
      student: "정민우",
      phone: "01056789012",
      email: "minwoo@example.com",
      paid: false,
      createdAt: new Date(),
    },
    // 테니스 기초반 수강생들
    {
      courseId: courseIds[2],
      student: "한소영",
      phone: "01067890123",
      email: "soyoung@example.com",
      paid: true,
      paymentAmount: 120000,
      paymentMethod: "카드",
      paidAt: new Date(),
      createdAt: new Date(),
    }
  ];

  // 수강생 등록 데이터 생성
  for (const enrollment of enrollments) {
    const { courseId, ...enrollmentData } = enrollment;
    await db.collection(`academyCourses/${courseId}/enrollments`).add(enrollmentData);
    console.log(`✅ Enrollment created: ${enrollmentData.student} for course ${courseId}`);
  }

  // 강좌별 현재 수강생 수 업데이트
  for (let i = 0; i < courseIds.length; i++) {
    const courseId = courseIds[i];
    const enrollmentsSnapshot = await db.collection(`academyCourses/${courseId}/enrollments`).get();
    const currentStudents = enrollmentsSnapshot.size;
    
    await db.collection("academyCourses").doc(courseId).update({
      currentStudents: currentStudents
    });
    
    console.log(`✅ Updated current students for course ${courseId}: ${currentStudents}`);
  }

  console.log("🌱 Extended seeding complete!");
  console.log(`📊 Created ${courses.length} courses and ${enrollments.length} enrollments`);
}

seedAcademyExtended().catch((err) => {
  console.error("❌ Error seeding Firestore:", err);
});
