// 🛡️ AI 거래 보증 시스템 데모 데이터 생성 스크립트
// 브라우저 콘솔에서 실행하여 Firestore에 데모 데이터를 자동 생성합니다

const createFirestoreDemoData = async () => {
  try {
    // Firebase 설정 (실제 프로젝트 정보로 수정 필요)
    const cfg = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    // Firebase 초기화
    const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getFirestore, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const app = getApps().length ? getApps()[0] : initializeApp(cfg);
    const db = getFirestore(app);

    console.log("🚀 AI 거래 보증 시스템 데모 데이터 생성 시작...");

    // 1. marketItems 컬렉션 데이터
    const marketItems = [
      {
        title: "나이키 머큐리얼 축구화",
        price: 35000,
        sellerUid: "seller_001",
        category: "축구화",
        desc: "정품 나이키 머큐리얼, 사용감 거의 없음. 사이즈 270.",
        trustScore: {
          total: 88,
          priceScore: 85,
          brandScore: 95,
          conditionScore: 90,
          descScore: 80
        },
        aiTags: {
          brand: "나이키",
          condition: "거의 새상품",
          color: "검정",
          size: "270"
        },
        tags: ["나이키", "머큐리얼", "축구화", "정품", "사이즈270"],
        createdAt: serverTimestamp()
      },
      {
        title: "아디다스 유니폼 상의",
        price: 25000,
        sellerUid: "seller_002",
        category: "유니폼",
        desc: "FC 바이에른 미넨 공식 유니폼. 세탁 한 번 한 상태.",
        trustScore: {
          total: 75,
          priceScore: 80,
          brandScore: 85,
          conditionScore: 70,
          descScore: 65
        },
        aiTags: {
          brand: "아디다스",
          condition: "좋음",
          color: "빨강",
          size: "M"
        },
        tags: ["아디다스", "유니폼", "바이에른", "M사이즈"],
        createdAt: serverTimestamp()
      },
      {
        title: "풋살공 5호",
        price: 15000,
        sellerUid: "seller_003",
        category: "용품",
        desc: "가볍고 탄탄한 풋살공. 사용감 약간 있음.",
        trustScore: {
          total: 62,
          priceScore: 70,
          brandScore: 60,
          conditionScore: 55,
          descScore: 50
        },
        aiTags: {
          brand: "미카사",
          condition: "보통",
          color: "흰색",
          size: "5호"
        },
        tags: ["미카사", "풋살공", "5호", "가벼움"],
        createdAt: serverTimestamp()
      },
      {
        title: "명품 가방",
        price: 500000,
        sellerUid: "seller_004",
        category: "기타",
        desc: "고가 가방 판매",
        trustScore: {
          total: 25,
          priceScore: 20,
          brandScore: 30,
          conditionScore: 25,
          descScore: 15
        },
        aiTags: {
          brand: "미상",
          condition: "불명",
          color: "불명",
          size: "불명"
        },
        tags: ["명품", "가방", "고가"],
        createdAt: serverTimestamp()
      }
    ];

    // 2. sellers 컬렉션 데이터
    const sellers = [
      {
        id: "seller_001",
        sellerScore: 90,
        avgTrust: 88,
        itemCount: 4,
        categoryCount: 3,
        brandCount: 5,
        summary: "정품 위주로 판매하며 거래 응답이 빠름. 신뢰도 높은 판매자입니다.",
        strengths: [
          "정품 위주 판매",
          "응답 속도 빠름",
          "설명 상세함",
          "포장 상태 양호"
        ],
        risks: [],
        categories: ["축구화", "의류", "용품"],
        brands: ["나이키", "아디다스", "퓨마", "언더아머", "뉴발란스"],
        updatedAt: serverTimestamp()
      },
      {
        id: "seller_002",
        sellerScore: 72,
        avgTrust: 75,
        itemCount: 3,
        categoryCount: 4,
        brandCount: 3,
        summary: "대체로 양호하나 포장 상태 불만 리뷰 다수. 보통 신뢰도 판매자입니다.",
        strengths: [
          "상품 다양성",
          "배송 빠름",
          "가격 합리적"
        ],
        risks: [
          "포장 불만 일부",
          "설명 부족"
        ],
        categories: ["유니폼", "의류", "용품", "기타"],
        brands: ["아디다스", "나이키", "기타"],
        updatedAt: serverTimestamp()
      },
      {
        id: "seller_003",
        sellerScore: 60,
        avgTrust: 62,
        itemCount: 2,
        categoryCount: 1,
        brandCount: 1,
        summary: "중고품 위주로 저가 거래 다수. 신뢰도 낮은 판매자입니다.",
        strengths: [
          "가격 저렴",
          "빠른 배송"
        ],
        risks: [
          "품질 편차 있음",
          "설명 부족",
          "신뢰도 낮음"
        ],
        categories: ["용품"],
        brands: ["미카사"],
        updatedAt: serverTimestamp()
      },
      {
        id: "seller_004",
        sellerScore: 30,
        avgTrust: 25,
        itemCount: 1,
        categoryCount: 1,
        brandCount: 1,
        summary: "고위험 판매자, 주의 필요. 신뢰도 매우 낮습니다.",
        strengths: [],
        risks: [
          "설명 부족",
          "신뢰도 매우 낮음",
          "고가 상품",
          "신규 판매자",
          "거래 이력 부족"
        ],
        categories: ["기타"],
        brands: ["미상"],
        updatedAt: serverTimestamp()
      }
    ];

    // 3. 데이터 생성 실행
    console.log("📦 marketItems 컬렉션 데이터 생성 중...");
    const createdItems = [];
    for (const item of marketItems) {
      const docRef = await addDoc(collection(db, "marketItems"), item);
      createdItems.push({ id: docRef.id, ...item });
      console.log(`✅ 상품 생성 완료: ${item.title} (ID: ${docRef.id})`);
    }

    console.log("👤 sellers 컬렉션 데이터 생성 중...");
    const createdSellers = [];
    for (const seller of sellers) {
      const docRef = await addDoc(collection(db, "sellers"), seller);
      createdSellers.push({ id: docRef.id, ...seller });
      console.log(`✅ 판매자 프로필 생성 완료: ${seller.id} (ID: ${docRef.id})`);
    }

    // 4. 생성 결과 요약
    console.log("\n🎉 데모 데이터 생성 완료!");
    console.log("📊 생성된 데이터 요약:");
    console.log(`- marketItems: ${createdItems.length}개`);
    console.log(`- sellers: ${createdSellers.length}개`);
    
    console.log("\n🧪 테스트 시나리오:");
    console.log("1. 일반 결제 (낮은 위험):");
    console.log(`   - itemId: ${createdItems[0].id}`);
    console.log(`   - buyerUid: buyer_demo_001`);
    console.log(`   - 결제금액: ${createdItems[0].price}`);
    console.log("   - 예상 결과: LOW 등급, 일반 결제 가능");
    
    console.log("\n2. 에스크로 결제 (높은 위험):");
    console.log(`   - itemId: ${createdItems[3].id}`);
    console.log(`   - buyerUid: buyer_demo_001`);
    console.log(`   - 결제금액: ${createdItems[3].price}`);
    console.log("   - 예상 결과: HIGH 등급, 에스크로 필요");

    console.log("\n🚀 이제 AI 거래 보증 시스템에서 테스트할 수 있습니다!");
    console.log("브라우저에서 http://127.0.0.1:5183/market 접속하여 테스트하세요.");

    return {
      success: true,
      items: createdItems,
      sellers: createdSellers
    };

  } catch (error) {
    console.error("❌ 데모 데이터 생성 실패:", error);
    return {
      success: false,
      error: String(error)
    };
  }
};

// 실행
console.log("🛡️ AI 거래 보증 시스템 데모 데이터 생성 스크립트");
console.log("실행하려면: createFirestoreDemoData()");
console.log("또는 직접 실행: createFirestoreDemoData().then(result => console.log(result));");

// 자동 실행 (선택사항)
// createFirestoreDemoData();
