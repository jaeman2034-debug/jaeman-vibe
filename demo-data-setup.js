// Firestore 데모 데이터 생성 스크립트
// 이 스크립트를 브라우저 콘솔에서 실행하여 데모 데이터를 생성할 수 있습니다

const createDemoData = async () => {
  const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
  const { getFirestore, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

  const cfg = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    appId: "your-app-id"
  };

  const app = getApps().length ? getApps()[0] : initializeApp(cfg);
  const db = getFirestore(app);

  // 데모 상품 데이터
  const demoItems = [
    {
      title: "나이키 축구화",
      price: 30000,
      sellerUid: "user_seller_001",
      trustScore: { 
        total: 85, 
        priceScore: 80, 
        brandScore: 90, 
        conditionScore: 85, 
        descScore: 75 
      },
      category: "축구화",
      desc: "나이키 정품 축구화, 사용감 적음, 사이즈 270",
      aiTags: ["나이키", "축구화", "정품", "사용감적음"],
      createdAt: serverTimestamp()
    },
    {
      title: "아디다스 유니폼",
      price: 15000,
      sellerUid: "user_seller_002", 
      trustScore: { 
        total: 72, 
        priceScore: 75, 
        brandScore: 85, 
        conditionScore: 70, 
        descScore: 60 
      },
      category: "유니폼",
      desc: "아디다스 유니폼, M사이즈, 깨끗함",
      aiTags: ["아디다스", "유니폼", "M사이즈"],
      createdAt: serverTimestamp()
    },
    {
      title: "축구공",
      price: 8000,
      sellerUid: "user_seller_003",
      trustScore: { 
        total: 45, 
        priceScore: 50, 
        brandScore: 40, 
        conditionScore: 45, 
        descScore: 30 
      },
      category: "공",
      desc: "축구공 판매",
      aiTags: ["축구공"],
      createdAt: serverTimestamp()
    },
    {
      title: "명품 가방",
      price: 500000,
      sellerUid: "user_seller_004",
      trustScore: { 
        total: 25, 
        priceScore: 20, 
        brandScore: 30, 
        conditionScore: 25, 
        descScore: 15 
      },
      category: "기타",
      desc: "고가 가방",
      aiTags: ["명품", "가방"],
      createdAt: serverTimestamp()
    }
  ];

  // 데모 판매자 프로필 데이터
  const demoSellers = [
    {
      id: "user_seller_001",
      sellerScore: 88,
      summary: "신뢰도 높은 판매자, 정품 위주 판매",
      strengths: ["정품 판매", "신뢰도 높음", "설명 상세"],
      risks: [],
      avgTrust: 85,
      itemCount: 15,
      categoryCount: 3,
      brandCount: 5,
      categories: ["축구화", "의류", "용품"],
      brands: ["나이키", "아디다스", "퓨마", "언더아머", "뉴발란스"],
      updatedAt: serverTimestamp()
    },
    {
      id: "user_seller_002",
      sellerScore: 75,
      summary: "보통 신뢰도 판매자, 다양한 상품 판매",
      strengths: ["다양한 상품", "가격 합리적"],
      risks: ["설명 부족"],
      avgTrust: 72,
      itemCount: 8,
      categoryCount: 4,
      brandCount: 3,
      categories: ["유니폼", "의류", "용품", "기타"],
      brands: ["아디다스", "나이키", "기타"],
      updatedAt: serverTimestamp()
    },
    {
      id: "user_seller_003",
      sellerScore: 45,
      summary: "신규 판매자, 신뢰도 낮음",
      strengths: ["저렴한 가격"],
      risks: ["설명 부족", "신뢰도 낮음", "신규 판매자"],
      avgTrust: 45,
      itemCount: 2,
      categoryCount: 1,
      brandCount: 1,
      categories: ["공"],
      brands: ["기타"],
      updatedAt: serverTimestamp()
    },
    {
      id: "user_seller_004",
      sellerScore: 30,
      summary: "고위험 판매자, 주의 필요",
      strengths: [],
      risks: ["설명 부족", "신뢰도 매우 낮음", "고가 상품"],
      avgTrust: 25,
      itemCount: 1,
      categoryCount: 1,
      brandCount: 1,
      categories: ["기타"],
      brands: ["기타"],
      updatedAt: serverTimestamp()
    }
  ];

  try {
    console.log("데모 데이터 생성 시작...");

    // 상품 데이터 생성
    for (const item of demoItems) {
      const docRef = await addDoc(collection(db, "marketItems"), item);
      console.log(`상품 생성 완료: ${item.title} (ID: ${docRef.id})`);
    }

    // 판매자 프로필 데이터 생성
    for (const seller of demoSellers) {
      await addDoc(collection(db, "sellers"), seller);
      console.log(`판매자 프로필 생성 완료: ${seller.id}`);
    }

    console.log("✅ 모든 데모 데이터 생성 완료!");
    console.log("이제 AI 거래 보증 시스템에서 테스트할 수 있습니다.");
    
  } catch (error) {
    console.error("데모 데이터 생성 실패:", error);
  }
};

// 실행
createDemoData();
