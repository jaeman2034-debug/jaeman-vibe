// test-kakaotalk-ci.js
const https = require('https');

const N8N_WEBHOOK_URL = process.env.N8N_KAKAO_WEBHOOK || 'http://localhost:5678/webhook/ci-kakao-alert';

async function testKakaoTalkCI() {
  console.log('📱 카카오톡 CI 알림 테스트 시작...\n');

  // 성공 시나리오 테스트
  console.log('✅ 성공 시나리오 테스트');
  const successPayload = {
    status: 'success',
    repo: 'jaeman-vibe',
    branch: 'develop',
    author: '홍길동',
    timestamp: new Date().toISOString(),
    commit_message: 'feat: 아카데미 알림 시스템 추가'
  };

  try {
    const successResponse = await sendWebhook(successPayload);
    console.log(`✅ 성공 알림 전송: ${successResponse.status}`);
  } catch (error) {
    console.error(`❌ 성공 알림 실패: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 실패 시나리오 테스트
  console.log('❌ 실패 시나리오 테스트');
  const failurePayload = {
    status: 'failure',
    repo: 'jaeman-vibe',
    branch: 'develop',
    author: '홍길동',
    timestamp: new Date().toISOString(),
    commit_message: 'fix: 테스트 오류 수정'
  };

  try {
    const failureResponse = await sendWebhook(failurePayload);
    console.log(`❌ 실패 알림 전송: ${failureResponse.status}`);
  } catch (error) {
    console.error(`❌ 실패 알림 실패: ${error.message}`);
  }

  console.log('\n🎉 카카오톡 CI 알림 테스트 완료!');
}

function sendWebhook(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(N8N_WEBHOOK_URL, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// 실행
testKakaoTalkCI().catch(console.error);
