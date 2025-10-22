#!/usr/bin/env node

/**
 * n8n 아카데미 알림 시스템 테스트 스크립트
 * 
 * 사용법:
 * node test-n8n-academy-integration.js
 */

const fetch = require('node-fetch');

// 환경변수에서 n8n webhook URL 가져오기
const N8N_WEBHOOK_ENROLL = process.env.N8N_WEBHOOK_ENROLL || 'http://localhost:5678/webhook/enroll';
const N8N_WEBHOOK_PAYMENT = process.env.N8N_WEBHOOK_PAYMENT || 'http://localhost:5678/webhook/payment';

// 테스트 데이터
const testEnrollmentData = {
  type: "enroll",
  courseTitle: "유소년 주말반",
  student: "홍길동",
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
  type: "payment",
  courseTitle: "유소년 주말반",
  student: "홍길동",
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

async function runTests() {
  console.log('🚀 n8n 아카데미 알림 시스템 테스트 시작\n');
  console.log('=' * 50);

  // 환경변수 확인
  console.log('🔧 환경변수 확인:');
  console.log(`N8N_WEBHOOK_ENROLL: ${N8N_WEBHOOK_ENROLL}`);
  console.log(`N8N_WEBHOOK_PAYMENT: ${N8N_WEBHOOK_PAYMENT}`);
  console.log(`N8N_TOKEN: ${process.env.N8N_TOKEN ? '설정됨' : '설정되지 않음'}`);

  // 테스트 실행
  const enrollResult = await testWebhook(N8N_WEBHOOK_ENROLL, testEnrollmentData, '수강신청 알림');
  
  // 잠시 대기 (n8n 처리 시간 고려)
  console.log('\n⏳ 2초 대기 중...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const paymentResult = await testWebhook(N8N_WEBHOOK_PAYMENT, testPaymentData, '결제완료 알림');

  // 결과 요약
  console.log('\n' + '=' * 50);
  console.log('📊 테스트 결과 요약:');
  console.log(`수강신청 알림: ${enrollResult ? '✅ 성공' : '❌ 실패'}`);
  console.log(`결제완료 알림: ${paymentResult ? '✅ 성공' : '❌ 실패'}`);
  
  if (enrollResult && paymentResult) {
    console.log('\n🎉 모든 테스트가 성공했습니다!');
    console.log('📱 Slack, 이메일, 카카오톡, SMS 알림을 확인해보세요.');
  } else {
    console.log('\n⚠️ 일부 테스트가 실패했습니다.');
    console.log('🔍 n8n 워크플로우 설정과 환경변수를 확인해주세요.');
  }

  console.log('\n📚 자세한 설정 방법은 N8N_ACADEMY_INTEGRATION_GUIDE.md를 참고하세요.');
}

// 스크립트 실행
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testWebhook, testEnrollmentData, testPaymentData };
