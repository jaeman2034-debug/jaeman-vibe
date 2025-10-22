/**
 * 🔧 기존 상품의 sellerUid 일괄 수정 스크립트
 * 
 * sellerUid가 null인 상품들을 특정 UID로 일괄 수정합니다.
 * 
 * 사용법:
 * 1. DEFAULT_SELLER_UID를 실제 UID로 변경
 * 2. node scripts/fix-selleruid.js 실행
 */

const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json"); // ← 실제 경로로 수정

// Firebase Admin 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 🔹 기본 판매자 UID (실제 값으로 교체 필요!)
const DEFAULT_SELLER_UID = "kohXYANy9sVX0o4dJWxkhWHdYOm2";

async function fixSellerUid() {
  try {
    console.log("🔍 sellerUid가 null인 상품 검색 중...");
    
    const snapshot = await db.collection("marketItems").get();
    
    let totalCount = 0;
    let nullCount = 0;
    let fixedCount = 0;
    
    const batch = db.batch();
    
    snapshot.docs.forEach((doc) => {
      totalCount++;
      const data = doc.data();
      
      // sellerUid가 null이거나 undefined인 경우
      if (!data.sellerUid) {
        nullCount++;
        console.log(`❌ null 발견: ${doc.id} - ${data.title}`);
        
        // batch에 추가
        batch.update(doc.ref, {
          sellerUid: DEFAULT_SELLER_UID,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        fixedCount++;
      } else {
        console.log(`✅ 정상: ${doc.id} - sellerUid: ${data.sellerUid}`);
      }
    });
    
    if (fixedCount > 0) {
      console.log(`\n📝 ${fixedCount}개 문서 수정 중...`);
      await batch.commit();
      console.log(`✅ ${fixedCount}개 문서 수정 완료!`);
    } else {
      console.log("\n✅ 수정할 문서가 없습니다. 모든 상품에 sellerUid가 있습니다.");
    }
    
    console.log("\n📊 요약:");
    console.log(`  - 전체 상품: ${totalCount}개`);
    console.log(`  - null 상품: ${nullCount}개`);
    console.log(`  - 수정 완료: ${fixedCount}개`);
    
  } catch (error) {
    console.error("❌ 오류 발생:", error);
  }
}

// 실행
fixSellerUid()
  .then(() => {
    console.log("\n🎉 스크립트 실행 완료!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 스크립트 실행 실패:", error);
    process.exit(1);
  });
