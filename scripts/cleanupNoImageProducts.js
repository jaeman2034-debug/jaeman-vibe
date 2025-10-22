import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

// Firebase 설정 (환경변수에서 가져오기)
const firebaseConfig = {
  apiKey: process.env.VITE_FB_API_KEY,
  authDomain: process.env.VITE_FB_AUTH_DOMAIN,
  projectId: process.env.VITE_FB_PROJECT_ID,
  storageBucket: process.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FB_APP_ID,
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteNoImageProducts() {
  console.log("🧹 이미지 없는 상품 정리 시작...");
  
  try {
    // marketItems 컬렉션에서 모든 문서 가져오기
    const productsRef = collection(db, "marketItems");
    const snapshot = await getDocs(productsRef);

    let deletedCount = 0;
    let totalCount = snapshot.docs.length;

    console.log(`📊 총 ${totalCount}개의 상품을 검사합니다...`);

    for (const d of snapshot.docs) {
      const data = d.data();
      
      // imageUrl이 없거나 빈 문자열인 경우 삭제
      if (!data.imageUrl || data.imageUrl.trim() === "" || data.imageUrl === null) {
        await deleteDoc(doc(db, "marketItems", d.id));
        console.log(`🗑️ 삭제됨: ${d.id} (${data.title || "제목 없음"})`);
        deletedCount++;
      }
    }

    console.log(`✅ 정리 완료! 총 ${deletedCount}개의 이미지 없는 상품이 삭제되었습니다.`);
    console.log(`📈 남은 상품: ${totalCount - deletedCount}개`);
    
  } catch (error) {
    console.error("❌ 정리 중 오류 발생:", error);
  }
}

// 스크립트 실행
deleteNoImageProducts()
  .then(() => {
    console.log("🎉 스크립트 실행 완료!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 스크립트 실행 실패:", error);
    process.exit(1);
  });
