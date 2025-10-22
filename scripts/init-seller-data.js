/**
 * 판매자 학습 데이터 초기화 스크립트
 * 
 * 사용법:
 * node scripts/init-seller-data.js
 */

const admin = require('firebase-admin');

// Firebase Admin 초기화
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'jaeman-vibe-platform'
});

const db = admin.firestore();

// 📚 판매자 학습 데이터 샘플
const sellerDataSamples = [
  {
    sellerId: 'seller001',
    intro: '안녕하세요! 소흘 FC 공식 용품 전문 판매자입니다. ⚽ 정품만 취급하며 빠른 배송을 약속드립니다!',
    faq: [
      '배송은 얼마나 걸리나요? → 결제 후 1-2일 이내 발송됩니다.',
      '사이즈 교환이 가능한가요? → 미착용 상태라면 7일 이내 교환 가능합니다.',
      '단체 주문 할인 있나요? → 10개 이상 구매 시 15% 할인해드립니다!',
      '직거래 가능한가요? → 낙양동 소흘 FC 근처에서 직거래 가능합니다.',
      '정품 보증되나요? → 모든 제품 정품 보증서와 함께 발송됩니다.'
    ],
    productTags: ['축구화', '유니폼', '축구공', '트레이닝복', '골키퍼장갑'],
    memory: []
  },
  {
    sellerId: 'seller002',
    intro: '안녕하세요! 스포츠 중고 매니아입니다. 깨끗한 상태의 중고 용품만 판매합니다! 💪',
    faq: [
      '중고 상태는 어떤가요? → 사용감 거의 없는 A급 제품만 취급합니다.',
      '세탁은 하셨나요? → 모든 제품 세탁 및 소독 완료 후 발송합니다.',
      '환불 가능한가요? → 상품 하자 시 전액 환불 가능합니다.',
      '배송비 있나요? → 3만원 이상 구매 시 무료배송입니다.'
    ],
    productTags: ['중고', '빈티지', '리미티드'],
    memory: []
  }
];

// 🚀 초기화 실행
async function initSellerData() {
  console.log('🚀 판매자 학습 데이터 초기화 시작...\n');

  for (const seller of sellerDataSamples) {
    try {
      await db.collection('sellers').doc(seller.sellerId).set({
        ...seller,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ ${seller.sellerId} 초기화 완료`);
      console.log(`   - FAQ: ${seller.faq.length}개`);
      console.log(`   - 태그: ${seller.productTags.join(', ')}\n`);
    } catch (error) {
      console.error(`❌ ${seller.sellerId} 초기화 실패:`, error);
    }
  }

  console.log('🎉 판매자 학습 데이터 초기화 완료!');
  process.exit(0);
}

// 실행
initSellerData().catch(error => {
  console.error('❌ 초기화 스크립트 오류:', error);
  process.exit(1);
});

