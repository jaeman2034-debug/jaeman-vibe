import { db } from "../src/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * 샘플 후기 데이터 생성 스크립트
 * 각 판매자에 대한 다양한 후기를 생성합니다.
 */

// 샘플 후기 데이터
const sampleReviews = [
  // 김축구 (user1) - 우수 판매자
  {
    productId: "product1",
    buyerId: "buyer1",
    sellerId: "user1",
    rating: 5,
    comment: "정말 깨끗한 상태로 잘 받았습니다! 포장도 꼼꼼하게 해주시고, 설명도 정확했어요. 다음에도 거래하고 싶어요!",
    createdAt: serverTimestamp()
  },
  {
    productId: "product2", 
    buyerId: "buyer2",
    sellerId: "user1",
    rating: 5,
    comment: "빠른 배송과 친절한 응답 감사합니다. 상품 상태가 설명과 정확히 일치했어요.",
    createdAt: serverTimestamp()
  },
  {
    productId: "product3",
    buyerId: "buyer3", 
    sellerId: "user1",
    rating: 4,
    comment: "좋은 상품이었습니다. 약간의 사용감은 있지만 전반적으로 만족해요.",
    createdAt: serverTimestamp()
  },

  // 박축구 (user2) - 양호 판매자
  {
    productId: "product4",
    buyerId: "buyer4",
    sellerId: "user2", 
    rating: 4,
    comment: "거래가 원활했습니다. 상품도 괜찮고 가격도 합리적이었어요.",
    createdAt: serverTimestamp()
  },
  {
    productId: "product5",
    buyerId: "buyer5",
    sellerId: "user2",
    rating: 4,
    comment: "응답이 빠르고 친절했습니다. 상품 상태도 양호해요.",
    createdAt: serverTimestamp()
  },

  // 이축구 (user3) - 양호 판매자  
  {
    productId: "product6",
    buyerId: "buyer6",
    sellerId: "user3",
    rating: 4,
    comment: "첫 거래였는데 안전하게 잘 마무리되었습니다.",
    createdAt: serverTimestamp()
  },

  // 최축구 (user4) - 우수 판매자
  {
    productId: "product7",
    buyerId: "buyer7", 
    sellerId: "user4",
    rating: 5,
    comment: "정말 믿을 수 있는 판매자입니다! 상품 설명이 정확하고 거래도 매우 원활했어요.",
    createdAt: serverTimestamp()
  },
  {
    productId: "product8",
    buyerId: "buyer8",
    sellerId: "user4",
    rating: 5,
    comment: "최고의 거래 경험이었습니다. 포장도 완벽하고 상품도 새것 같아요!",
    createdAt: serverTimestamp()
  },
  {
    productId: "product9",
    buyerId: "buyer9",
    sellerId: "user4",
    rating: 5,
    comment: "빠른 응답과 정확한 상품 설명에 감사합니다. 강력 추천!",
    createdAt: serverTimestamp()
  },

  // 정축구 (user5) - 보통 판매자
  {
    productId: "product10",
    buyerId: "buyer10",
    sellerId: "user5",
    rating: 3,
    comment: "거래는 성사되었지만 응답이 좀 늦었어요. 상품은 괜찮습니다.",
    createdAt: serverTimestamp()
  },
  {
    productId: "product11",
    buyerId: "buyer11",
    sellerId: "user5", 
    rating: 3,
    comment: "가격은 합리적이었지만 상품 상태가 설명과 조금 달랐어요.",
    createdAt: serverTimestamp()
  },

  // 한골프 (user6) - 우수 판매자
  {
    productId: "product12",
    buyerId: "buyer12",
    sellerId: "user6",
    rating: 5,
    comment: "골프 용품 전문가답게 정확한 설명과 좋은 상품을 제공해주셨어요!",
    createdAt: serverTimestamp()
  },
  {
    productId: "product13",
    buyerId: "buyer13",
    sellerId: "user6",
    rating: 5,
    comment: "고급 골프 클럽을 합리적인 가격에 구매할 수 있어서 만족합니다.",
    createdAt: serverTimestamp()
  }
];

export async function seedReviews() {
  console.log("🚀 샘플 후기 데이터 생성 시작...");

  try {
    for (const review of sampleReviews) {
      await addDoc(collection(db, "reviews"), review);
      console.log(`✅ 후기 생성 완료: ${review.sellerId} - ${review.rating}점`);
    }

    console.log("🎉 모든 후기 데이터 생성 완료!");
    console.log("\n📊 후기 분포:");
    console.log("🔥 우수 판매자 (4.5+): 김축구, 최축구, 한골프");
    console.log("👍 양호 판매자 (4.0+): 박축구, 이축구");
    console.log("👌 보통 판매자 (3.0+): 정축구");

  } catch (error) {
    console.error("❌ 후기 데이터 생성 실패:", error);
  }
}

// 직접 실행 (개발 환경에서만)
if (typeof window === "undefined") {
  seedReviews();
}
