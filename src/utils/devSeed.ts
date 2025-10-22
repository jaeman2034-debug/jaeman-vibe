import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// 실행 가드 - 한번만 실행되도록 보장
let __seedRan = false;

// 개발용 시드 데이터 생성 (VITE_DEV_SEED=1일 때만 실행)
export async function seedFootballProductKR() {
  // 시드 비활성화 체크
  if (import.meta.env.VITE_DEV_SEED !== "1" && import.meta.env.VITE_DEV_SEED !== "true") {
    console.log("🔧 [SEED] VITE_DEV_SEED가 비활성화됨 - 시드 데이터 생성 건너뛰기");
    return;
  }
  
  try {
    const id = "demo-football-1";
    await setDoc(doc(db, "products", id), {
      id,
      name: "아모 축구공",
      price: 39000,
      status: "active",
      categoryId: "football", // ✅ 중요: 카테고리 ID
      region: "KR",           // ✅ 중요: 지역 필터
      description: "축구 연습용 공입니다. 상태 좋음.",
      images: ["/img/placeholder.svg"],
      ownerId: "demo-user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    console.log("⚽ 축구 상품 샘플 데이터 생성 완료:", id);
    return id;
  } catch (error) {
    console.error("❌ 샘플 데이터 생성 실패:", error);
    throw error;
  }
}

export async function seedFootballProducts() {
  // 시드 비활성화 체크
  if (import.meta.env.VITE_DEV_SEED !== "1" && import.meta.env.VITE_DEV_SEED !== "true") {
    console.log("🔧 [SEED] VITE_DEV_SEED가 비활성화됨 - 시드 데이터 생성 건너뛰기");
    return;
  }
  
  try {
    const products = [
      {
        id: "demo-football-1",
        name: "아모 축구공",
        price: 39000,
        status: "active",
        categoryId: "football",
        region: "KR",
        description: "축구 연습용 공입니다. 상태 좋음.",
        images: ["/img/placeholder.svg"],
        ownerId: "demo-user",
      },
      {
        id: "demo-football-2", 
        name: "축구화(사이즈270)",
        price: 89000,
        status: "active",
        categoryId: "football",
        region: "KR",
        description: "NIKE 축구화입니다. 거의 새상품",
        images: ["/img/placeholder.svg"],
        ownerId: "demo-user",
      },
      {
        id: "demo-football-3",
        name: "축구 유니폼",
        price: 25000,
        status: "active", 
        categoryId: "football",
        region: "KR",
        description: "깨끗한 유니폼입니다. 깨끗함",
        images: ["/img/placeholder.svg"],
        ownerId: "demo-user",
      }
    ];

    for (const product of products) {
      await setDoc(doc(db, "products", product.id), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    
    console.log("⚽ 축구 상품 3개 샘플 데이터 생성 완료");
    return products.length;
  } catch (error) {
    console.error("❌ 샘플 데이터 생성 실패:", error);
    throw error;
  }
}

// ✅ 개발용으로 한번만 실행되는 함수 (실행 가드 포함)
export async function runDevSeedOnce() {
  // 이미 실행되었으면 실제로 금지
  if (__seedRan) return;
  __seedRan = true;

  const enabled =
    import.meta.env.VITE_DEV_SEED === '1' ||
    import.meta.env.VITE_DEV_SEED === 'true';

  console.log('🔧 개발용 샘플 데이터 생성 시작...');
  if (!enabled) {
    console.log('🔧 [SEED] VITE_DEV_SEED가 비활성화됨 - 시드 데이터 생성 건너뛰기');
    return;
  }

  try {
    await seedFootballProducts();
    console.log('✅ 개발용 샘플 데이터 생성 완료');
  } catch (error) {
    console.error('❌ 개발용 샘플 데이터 생성 실패:', error);
    throw error;
  }
}

// ✅ 수동 초기화 함수 (필요시 사용)
export function resetSeedFlag() {
  __seedRan = false;
  console.log('🔧 시드 실행 플래그가 초기화됨');
}

// 기존 함수와의 호환성을 위해 유지 (deprecated)
export function runDevSeed() {
  console.warn('⚠️ runDevSeed()는 deprecated이니 runDevSeedOnce()를 사용하세요');
  runDevSeedOnce().catch(console.error);
}