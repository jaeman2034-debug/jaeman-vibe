// Jest 테스트 설정
import 'jest';

// 전역 테스트 설정
beforeAll(() => {
  // 테스트 환경 설정
  process.env.NODE_ENV = 'test';
  process.env.SLACK_BOT_TOKEN = 'xoxb-test-token';
  process.env.SLACK_SIGNING_SECRET = 'test-signing-secret';
  process.env.INTERNAL_KEY = 'test-internal-key';
  process.env.SLACK_APPROVER_CHANNEL = 'C1234567890';
  process.env.N8N_WEBHOOK_APPROVED = 'https://test-n8n.com/webhook/approved';
  process.env.BIGQUERY_DATASET = 'test_dataset';
  process.env.ADMIN_ORIGIN = 'https://test-admin.com';
});

afterAll(() => {
  // 테스트 정리
  jest.clearAllMocks();
});

// 커스텀 매처
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});

// 타입 정의
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}
