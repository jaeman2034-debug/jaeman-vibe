#!/usr/bin/env node

/**
 * 카카오톡 알림톡 n8n 연동 테스트 스크립트
 * 
 * 사용법:
 * node test-kakaotalk-integration.js
 */

const fetch = require('node-fetch');

// 환경변수에서 n8n webhook URL 가져오기
const N8N_WEBHOOK_ENROLL = process.env.N8N_WEBHOOK_ENROLL || 'http://localhost:5678/webhook/enroll';
const N8N_WEBHOOK_PAYMENT = process.env.N8N_WEBHOOK_PAYMENT || 'http://localhost:5678/webhook/payment';

// 테스트 데이터
const testEnrollmentData = {
  student: "홍길동",
  courseTitle: "유소년 주말반",
  phone: "010-1234-5678",
  email: "test@example.com",
  courseId: "test-course-001",
  enrollId: "test-enroll-001",
  coach: "김코치",
  startDate: "2024-02-01",
  endDate: "2024-02-28",
  price: 150000,
  createdAt: new Date().toISOString()
};

const testPaymentData = {
  student: "홍길동",
  courseTitle: "유소년 주말반",
  phone: "010-1234-5678",
  email: "test@example.com",
  courseId: "test-course-001",
  enrollId: "test-enroll-001",
  coach: "김코치",
  startDate: "2024-02-01",
  endDate: "2024-02-28",
  price: 150000,
  paymentAmount: 150000,
  paymentMethod: "카드",
  paidAt: new Date().toISOString()
};

async function testWebhook(url, data, testName) {
  console.log(`\n🧪 ${testName} 테스트 시작...`);
  console.log(`📡 URL: ${url}`);
  console.log(`📦 데이터:`, JSON.stringify(data, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-n8n-token': process.env.N8N_TOKEN || 'n8n_default_token_please_change'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const result = await response.text();
      console.log(`✅ ${testName} 성공!`);
      console.log(`📄 응답: ${result}`);
      return true;
    } else {
      console.log(`❌ ${testName} 실패!`);
      console.log(`📊 상태 코드: ${response.status}`);
      console.log(`📄 응답: ${await response.text()}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${testName} 오류 발생!`);
    console.log(`🚨 오류: ${error.message}`);
    return false;
  }
}

async function testKakaoAPI() {
  console.log('\n📱 카카오톡 API 직접 테스트...');
  
  const kakaoToken = process.env.KAKAO_ACCESS_TOKEN;
  if (!kakaoToken) {
    console.log('⚠️ KAKAO_ACCESS_TOKEN 환경변수가 설정되지 않았습니다.');
    console.log('카카오 개발자센터에서 발급받은 액세스 토큰을 설정해주세요.');
    return false;
  }

  const testMessage = {
    template_object: {
      object_type: "text",
      text: "🧪 카카오톡 API 테스트\n\n이 메시지가 정상적으로 발송되면 카카오톡 연동이 성공입니다!",
      link: {
        web_url: "https://yago.sports"
      },
      button_title: "YAGO 홈페이지"
    }
  };

  try {
    const response = await fetch('https://api.talk.kakao.com/v2/api/talk/memo/default/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kakaoToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        template_object: JSON.stringify(testMessage.template_object)
      })
    });

    if (response.ok) {
      console.log('✅ 카카오톡 API 직접 테스트 성공!');
      console.log('📱 카카오톡에서 테스트 메시지를 확인해보세요.');
      return true;
    } else {
      console.log('❌ 카카오톡 API 직접 테스트 실패!');
      console.log(`📊 상태 코드: ${response.status}`);
      console.log(`📄 응답: ${await response.text()}`);
      return false;
    }
  } catch (error) {
    console.log('❌ 카카오톡 API 직접 테스트 오류 발생!');
    console.log(`🚨 오류: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 카카오톡 알림톡 n8n 연동 테스트 시작\n');
  console.log('=' * 50);

  // 환경변수 확인
  console.log('🔧 환경변수 확인:');
  console.log(`N8N_WEBHOOK_ENROLL: ${N8N_WEBHOOK_ENROLL}`);
  console.log(`N8N_WEBHOOK_PAYMENT: ${N8N_WEBHOOK_PAYMENT}`);
  console.log(`N8N_TOKEN: ${process.env.N8N_TOKEN ? '설정됨' : '설정되지 않음'}`);
  console.log(`KAKAO_ACCESS_TOKEN: ${process.env.KAKAO_ACCESS_TOKEN ? '설정됨' : '설정되지 않음'}`);

  // 카카오톡 API 직접 테스트
  const kakaoResult = await testKakaoAPI();

  // n8n 웹훅 테스트
  const enrollResult = await testWebhook(N8N_WEBHOOK_ENROLL, testEnrollmentData, '수강신청 카카오톡 알림');
  
  // 잠시 대기 (n8n 처리 시간 고려)
  console.log('\n⏳ 2초 대기 중...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const paymentResult = await testWebhook(N8N_WEBHOOK_PAYMENT, testPaymentData, '결제완료 카카오톡 알림');

  // 결과 요약
  console.log('\n' + '=' * 50);
  console.log('📊 테스트 결과 요약:');
  console.log(`카카오톡 API 직접 테스트: ${kakaoResult ? '✅ 성공' : '❌ 실패'}`);
  console.log(`수강신청 카카오톡 알림: ${enrollResult ? '✅ 성공' : '❌ 실패'}`);
  console.log(`결제완료 카카오톡 알림: ${paymentResult ? '✅ 성공' : '❌ 실패'}`);
  
  if (kakaoResult && enrollResult && paymentResult) {
    console.log('\n🎉 모든 테스트가 성공했습니다!');
    console.log('📱 카카오톡에서 알림 메시지를 확인해보세요.');
  } else {
    console.log('\n⚠️ 일부 테스트가 실패했습니다.');
    console.log('🔍 다음을 확인해주세요:');
    console.log('  1. 카카오 개발자센터 앱 설정');
    console.log('  2. 액세스 토큰 유효성');
    console.log('  3. n8n 워크플로우 설정');
    console.log('  4. 자격증명 설정');
  }

  console.log('\n📚 자세한 설정 방법은 KAKAO_TALK_SETUP_GUIDE.md를 참고하세요.');
}

// 스크립트 실행
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testWebhook, testKakaoAPI, testEnrollmentData, testPaymentData };
