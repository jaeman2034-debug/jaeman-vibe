// K6 성능 테스트
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// 커스텀 메트릭
const errorRate = new Rate('errors');

// 테스트 설정
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // 2분간 10명으로 증가
    { duration: '5m', target: 10 }, // 5분간 10명 유지
    { duration: '2m', target: 20 }, // 2분간 20명으로 증가
    { duration: '5m', target: 20 }, // 5분간 20명 유지
    { duration: '2m', target: 0 },  // 2분간 0명으로 감소
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95%의 요청이 2초 이내
    http_req_failed: ['rate<0.1'],     // 에러율 10% 미만
    errors: ['rate<0.1'],              // 커스텀 에러율 10% 미만
  },
};

// 환경변수
const BASE_URL = __ENV.BASE_URL || 'https://asia-northeast3-jaeman-vibe-staging.cloudfunctions.net/slack';
const INTERNAL_KEY = __ENV.INTERNAL_KEY || 'test-internal-key';

// 테스트 데이터
const testApprovalData = {
  channel: 'C1234567890',
  type: 'performance-test',
  refId: `perf-test-${Date.now()}-${Math.random()}`,
  title: '성능 테스트 승인 요청',
  summary: 'K6 성능 테스트용 승인 요청입니다',
  url: 'https://example.com',
  image: 'https://via.placeholder.com/300x200',
  payload: {
    testId: `test-${Math.random()}`,
    timestamp: Date.now()
  }
};

// 헬스체크 테스트
export function healthCheck() {
  const response = http.get(`${BASE_URL}/slack/health`);
  
  const result = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 1s': (r) => r.timings.duration < 1000,
    'health check has ok field': (r) => r.json('ok') === true,
  });
  
  errorRate.add(!result);
  
  return response;
}

// 승인 요청 생성 테스트
export function createApprovalRequest() {
  const payload = JSON.stringify(testApprovalData);
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': INTERNAL_KEY,
    },
  };
  
  const response = http.post(`${BASE_URL}/slack/internal/approval/notify`, payload, params);
  
  const result = check(response, {
    'approval request status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'approval request response time < 5s': (r) => r.timings.duration < 5000,
    'approval request has ok field': (r) => r.json('ok') !== undefined,
  });
  
  errorRate.add(!result);
  
  return response;
}

// 대시보드 조회 테스트
export function getDashboard() {
  const params = {
    headers: {
      'x-internal-key': INTERNAL_KEY,
    },
  };
  
  const response = http.get(`${BASE_URL}/slack/admin/dashboard`, params);
  
  const result = check(response, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard response time < 3s': (r) => r.timings.duration < 3000,
    'dashboard has ok field': (r) => r.json('ok') === true,
  });
  
  errorRate.add(!result);
  
  return response;
}

// 통계 조회 테스트
export function getStats() {
  const params = {
    headers: {
      'x-internal-key': INTERNAL_KEY,
    },
  };
  
  const response = http.get(`${BASE_URL}/slack/admin/stats/realtime`, params);
  
  const result = check(response, {
    'stats status is 200': (r) => r.status === 200,
    'stats response time < 2s': (r) => r.timings.duration < 2000,
    'stats has ok field': (r) => r.json('ok') === true,
  });
  
  errorRate.add(!result);
  
  return response;
}

// 규칙 시뮬레이션 테스트
export function simulateRules() {
  const payload = JSON.stringify({
    type: 'performance-test',
    priority: 'normal',
    testData: {
      title: '성능 테스트 규칙 시뮬레이션',
      summary: 'K6 성능 테스트용 규칙 시뮬레이션입니다'
    }
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': INTERNAL_KEY,
    },
  };
  
  const response = http.post(`${BASE_URL}/slack/admin/rules/simulate`, payload, params);
  
  const result = check(response, {
    'simulation status is 200': (r) => r.status === 200,
    'simulation response time < 3s': (r) => r.timings.duration < 3000,
    'simulation has ok field': (r) => r.json('ok') === true,
  });
  
  errorRate.add(!result);
  
  return response;
}

// 메인 테스트 함수
export default function() {
  // 랜덤하게 테스트 선택
  const testType = Math.random();
  
  if (testType < 0.3) {
    // 30% 확률로 헬스체크
    healthCheck();
  } else if (testType < 0.6) {
    // 30% 확률로 승인 요청 생성
    createApprovalRequest();
  } else if (testType < 0.8) {
    // 20% 확률로 대시보드 조회
    getDashboard();
  } else if (testType < 0.9) {
    // 10% 확률로 통계 조회
    getStats();
  } else {
    // 10% 확률로 규칙 시뮬레이션
    simulateRules();
  }
  
  // 요청 간 대기
  sleep(1);
}

// 설정 함수
export function setup() {
  console.log('K6 성능 테스트 시작');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Internal Key: ${INTERNAL_KEY ? '설정됨' : '설정되지 않음'}`);
  
  // 초기 헬스체크
  const healthResponse = healthCheck();
  if (healthResponse.status !== 200) {
    throw new Error('초기 헬스체크 실패');
  }
  
  return { startTime: Date.now() };
}

// 정리 함수
export function teardown(data) {
  const duration = Date.now() - data.startTime;
  console.log(`성능 테스트 완료. 총 소요 시간: ${duration}ms`);
}
