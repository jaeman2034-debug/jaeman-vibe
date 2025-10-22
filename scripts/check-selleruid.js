/**
 * 🔍 Firestore sellerUid 진단 스크립트
 * 
 * marketItems 컬렉션의 모든 상품을 확인하고
 * sellerUid 필드 상태를 리포트합니다.
 * 
 * 사용법:
 * node scripts/check-selleruid.js
 */

const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json"); // ← 실제 경로로 수정

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkSellerUid() {
  try {
    console.log("🔍 marketItems 컬렉션 분석 시작...\n");
    
    const snapshot = await db.collection("marketItems").get();
    
    if (snapshot.empty) {
      console.log("❌ marketItems 컬렉션이 비어있습니다.");
      return;
    }
    
    let totalCount = 0;
    let hasSellerUid = 0;
    let nullSellerUid = 0;
    let noFieldSellerUid = 0;
    
    console.log("📊 상품별 sellerUid 상태:\n");
    console.log("ID".padEnd(25) + "제목".padEnd(20) + "sellerUid 상태");
    console.log("─".repeat(70));
    
    snapshot.docs.forEach((doc) => {
      totalCount++;
      const data = doc.data();
      const id = doc.id.substring(0, 20);
      const title = (data.title || "제목없음").substring(0, 15);
      
      if (data.sellerUid !== undefined) {
        if (data.sellerUid === null) {
          nullSellerUid++;
          console.log(`${id.padEnd(25)}${title.padEnd(20)}❌ null`);
        } else {
          hasSellerUid++;
          const uid = String(data.sellerUid).substring(0, 20);
          console.log(`${id.padEnd(25)}${title.padEnd(20)}✅ ${uid}...`);
        }
      } else {
        noFieldSellerUid++;
        console.log(`${id.padEnd(25)}${title.padEnd(20)}⚠️ 필드 없음`);
      }
    });
    
    console.log("─".repeat(70));
    console.log("\n📈 요약:");
    console.log(`  전체 상품: ${totalCount}개`);
    console.log(`  ✅ sellerUid 정상: ${hasSellerUid}개`);
    console.log(`  ❌ sellerUid null: ${nullSellerUid}개`);
    console.log(`  ⚠️ sellerUid 필드 없음: ${noFieldSellerUid}개`);
    
    const problemCount = nullSellerUid + noFieldSellerUid;
    if (problemCount > 0) {
      console.log(`\n⚠️ 수정이 필요한 상품: ${problemCount}개`);
      console.log("\n💡 해결 방법:");
      console.log("  1. Firebase Console에서 수동 수정");
      console.log("  2. scripts/fix-selleruid.js 스크립트 실행");
    } else {
      console.log("\n✅ 모든 상품이 정상입니다!");
    }
    
  } catch (error) {
    console.error("❌ 오류 발생:", error);
  }
}

// 실행
checkSellerUid()
  .then(() => {
    console.log("\n🎉 진단 완료!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 진단 실패:", error);
    process.exit(1);
  });

