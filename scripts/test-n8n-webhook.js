// 🔥 n8n AI 리포트 워크플로 테스트 스크립트
const fetch = require('node-fetch');

// n8n 웹훅 URL (실제 배포 후 변경 필요)
const N8N_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/ai-report';

// Firebase Functions URL (배포 후 실제 URL로 변경)
const FIREBASE_FUNCTION_URL = 'https://us-central1-jaeman-vibe-platform.cloudfunctions.net/sendAdminReport';

// 테스트 데이터
const testData = {
  date: new Date().toISOString().split('T')[0],
  stats: {
    newUsers: Math.floor(Math.random() * 50) + 10,
    transactions: Math.floor(Math.random() * 100) + 20,
    responseRate: Math.floor(Math.random() * 20) + 80,
    activeUsers: Math.floor(Math.random() * 200) + 100,
    aiResponses: Math.floor(Math.random() * 30) + 15,
    sellerResponses: Math.floor(Math.random() * 25) + 10
  },
  insights: [
    "신규 사용자 증가율이 전주 대비 12% 상승했습니다.",
    "AI 응답률이 92%로 높은 만족도를 보이고 있습니다.",
    "주요 거래 카테고리는 축구용품과 운동복입니다.",
    "저녁 시간대 활성 사용자가 증가하는 추세입니다."
  ]
};

async function testN8nWebhook() {
  console.log('🔥 n8n AI 리포트 워크플로 테스트 시작...');
  console.log('📊 테스트 데이터:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ n8n 워크플로 실행 성공!');
      console.log('📋 응답 결과:', JSON.stringify(result, null, 2));
      
      console.log('\n🎯 다음 단계:');
      console.log('1. Firebase Functions가 실행되었는지 확인');
      console.log('2. Firestore adminReports 컬렉션에 데이터 저장 확인');
      console.log('3. FCM 푸시 알림 발송 확인');
      console.log('4. 스마트폰에서 알림 수신 및 TTS 재생 테스트');
      
    } else {
      console.error('❌ n8n 워크플로 실행 실패:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('에러 내용:', errorText);
    }

  } catch (error) {
    console.error('❌ 테스트 실행 오류:', error.message);
  }
}

// 직접 Firebase Functions 테스트 (n8n 없이)
async function testDirectFirebase() {
  console.log('\n🔥 직접 Firebase Functions 테스트...');
  
  const firebaseUrl = FIREBASE_FUNCTION_URL;
  
  try {
    const response = await fetch(firebaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: '테스트 AI 리포트입니다. 신규 가입자 25명, 거래량 45건, 응답률 88%를 기록했습니다. 전반적으로 양호한 성과를 보이고 있으며, 사용자 만족도가 높은 편입니다.',
        kpis: [
          { label: "신규 가입", value: 25 },
          { label: "거래량", value: 45 },
          { label: "응답률", value: "88%" },
          { label: "활성 사용자", value: 156 }
        ]
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Firebase Functions 실행 성공!');
      console.log('📋 응답 결과:', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Firebase Functions 실행 실패:', response.status);
    }

  } catch (error) {
    console.error('❌ Firebase Functions 테스트 오류:', error.message);
  }
}

// 실행
if (require.main === module) {
  console.log('🚀 AI 리포트 자동 발송 시스템 테스트\n');
  
  // n8n 웹훅 테스트 (주석 해제하여 사용)
  // testN8nWebhook();
  
  // 직접 Firebase Functions 테스트
  testDirectFirebase();
}

module.exports = { testN8nWebhook, testDirectFirebase };
