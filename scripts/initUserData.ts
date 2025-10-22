import { db } from "../src/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

/**
 * 사용자 신뢰도 데이터 초기화 스크립트
 * 새로운 사용자나 기존 사용자에게 신뢰도 필드를 추가합니다.
 */

// 샘플 사용자 데이터
const sampleUsers = [
  {
    uid: "user1",
    displayName: "김축구",
    photoURL: "https://via.placeholder.com/100x100?text=김축구",
    tradeCount: 15,
    totalRating: 68,
    ratingCount: 15,
    avgRating: 4.5
  },
  {
    uid: "user2", 
    displayName: "박축구",
    photoURL: "https://via.placeholder.com/100x100?text=박축구",
    tradeCount: 8,
    totalRating: 32,
    ratingCount: 8,
    avgRating: 4.0
  },
  {
    uid: "user3",
    displayName: "이축구", 
    photoURL: "https://via.placeholder.com/100x100?text=이축구",
    tradeCount: 3,
    totalRating: 12,
    ratingCount: 3,
    avgRating: 4.0
  },
  {
    uid: "user4",
    displayName: "최축구",
    photoURL: "https://via.placeholder.com/100x100?text=최축구", 
    tradeCount: 25,
    totalRating: 115,
    ratingCount: 25,
    avgRating: 4.6
  },
  {
    uid: "user5",
    displayName: "정축구",
    photoURL: "https://via.placeholder.com/100x100?text=정축구",
    tradeCount: 2,
    totalRating: 6,
    ratingCount: 2,
    avgRating: 3.0
  },
  {
    uid: "user6",
    displayName: "한골프",
    photoURL: "https://via.placeholder.com/100x100?text=한골프",
    tradeCount: 12,
    totalRating: 55,
    ratingCount: 12,
    avgRating: 4.6
  }
];

export async function initUserData() {
  console.log("🚀 사용자 신뢰도 데이터 초기화 시작...");

  try {
    for (const user of sampleUsers) {
      await setDoc(doc(db, "users", user.uid), {
        ...user,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`✅ 사용자 ${user.displayName} 데이터 초기화 완료`);
    }

    console.log("🎉 모든 사용자 데이터 초기화 완료!");
    console.log("\n📊 신뢰도 레벨 분포:");
    console.log("🔥 우수 (4.5+): 김축구, 최축구, 한골프");
    console.log("👍 양호 (4.0+): 박축구, 이축구"); 
    console.log("👌 보통 (3.0+): 정축구");
    console.log("🆕 신규: 기타 사용자들");

  } catch (error) {
    console.error("❌ 사용자 데이터 초기화 실패:", error);
  }
}

// 직접 실행 (개발 환경에서만)
if (typeof window === "undefined") {
  initUserData();
}
