// 브라우저 콘솔에서 실행할 스크립트
// 1) Firestore 모듈과 앱의 db를 동적 임포트
const fs = await import('firebase/firestore');
const { db } = await import('/src/lib/firebase.ts');

// 2) 1건 시드
const id = crypto.randomUUID();
await fs.setDoc(
  fs.doc(db, 'market', id),
  {
    title: '테스트 축구화',
    price: 25000,
    category: '축구화',
    region: '송산2동',
    status: 'active',      // '판매중' 매핑
    published: true,
    createdAt: fs.serverTimestamp()
  }
);

// 3) 앞으로 편하게 쓰려면 브릿지 재노출
window.fs = fs;
window.db = db;
console.log('✅ seeded', id);
