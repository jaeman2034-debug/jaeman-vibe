import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Firebase 초기화
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedAcademy() {
  try {
    console.log("🚀 아카데미 기본 데이터 등록 시작...");

    await setDoc(doc(db, "academy", "academy_001"), {
      name: "소흘 축구 아카데미",
      intro: "유소년 축구를 전문적으로 지도하는 아카데미입니다. 체계적인 훈련과 개인별 맞춤 지도를 통해 아이들의 축구 실력 향상과 인성 발달을 도모합니다.",
      logoUrl: "https://example.com/logo.png",
      location: "경기 포천시 소흘 체육공원 A구장",
      contact: "010-1234-5678",
      website: "https://yago-vibe.com/academy",
      sns: "@socheol_fc_official",
      // 대표자 정보 (신뢰 포인트)
      ownerName: "김철수 원장",
      ownerPhoto: "https://example.com/owner-photo.jpg",
      ownerMessage: "아이들의 성장과 꿈을 최우선으로 생각하며, 체계적인 지도를 통해 인성과 실력을 함께 키워나가겠습니다.",
              ownerTitle: "소흘 축구 아카데미 원장",
              ownerCredentials: ["축구지도자 자격증", "유소년 지도 경력 10년", "대회 수상 경력"],
              // 홍보 정보
              slogan: "⚽ 아이들의 꿈을 키우는 축구 아카데미 ⚽",
              createdAt: new Date(),
              updatedAt: new Date(),
    });

    console.log("✅ 아카데미 기본 데이터 등록 완료!");
    console.log("📋 등록된 정보:");
    console.log("   - 학원명: 소흘 축구 아카데미");
    console.log("   - 위치: 경기 포천시 소흘 체육공원 A구장");
    console.log("   - 연락처: 010-1234-5678");
    console.log("   - 웹사이트: https://yago-vibe.com/academy");
    console.log("   - SNS: @socheol_fc_official");
    console.log("   - 대표자: 김철수 원장");
    console.log("   - 대표자 인사말: 아이들의 성장과 꿈을 최우선으로...");
    console.log("   - 자격/경력: 축구지도자 자격증, 유소년 지도 경력 10년, 대회 수상 경력");
  } catch (error) {
    console.error("❌ 아카데미 데이터 등록 실패:", error);
    throw error;
  }
}

// 스크립트 실행
seedAcademy()
  .then(() => {
    console.log("🎉 아카데미 시드 스크립트 완료!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 스크립트 실행 실패:", error);
    process.exit(1);
  });
