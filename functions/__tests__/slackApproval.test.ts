// Jest 테스트 스텁
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import * as admin from 'firebase-admin';
import { app } from '../src/slackApproval';

// Firebase Admin 초기화 (테스트용)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'test-project',
    credential: admin.credential.applicationDefault()
  });
}

// Mock 설정
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    applicationDefault: jest.fn()
  },
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn(),
      doc: jest.fn(() => ({
        get: jest.fn(),
        update: jest.fn(),
        set: jest.fn()
      })),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn()
          }))
        }))
      }))
    }))
  })),
  FieldValue: {
    serverTimestamp: jest.fn(() => 'mock-timestamp'),
    increment: jest.fn((value) => ({ _increment: value }))
  },
  Timestamp: {
    fromMillis: jest.fn((ms) => ({ _timestamp: ms })),
    fromDate: jest.fn((date) => ({ _timestamp: date.getTime() }))
  }
}));

// Slack API Mock
const mockSlackApi = jest.fn();
jest.mock('../src/slackApproval', () => ({
  ...jest.requireActual('../src/slackApproval'),
  slackApi: mockSlackApi
}));

describe('Slack Approval System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSlackApi.mockResolvedValue({
      ok: true,
      channel: 'C1234567890',
      ts: '1234567890.123456'
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /slack/internal/approval/notify', () => {
    it('should create approval request successfully', async () => {
      const approvalData = {
        channel: 'C1234567890',
        type: 'test',
        refId: 'test-123',
        title: '테스트 승인 요청',
        summary: '테스트용 승인 요청입니다',
        url: 'https://example.com',
        image: 'https://via.placeholder.com/300x200'
      };

      const response = await request(app)
        .post('/slack/internal/approval/notify')
        .set('x-internal-key', 'test-internal-key')
        .send(approvalData);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.docId).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/slack/internal/approval/notify')
        .set('x-internal-key', 'test-internal-key')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 401 for missing internal key', async () => {
      const response = await request(app)
        .post('/slack/internal/approval/notify')
        .send({ title: 'test' });

      expect(response.status).toBe(401);
    });

    it('should handle Slack API errors', async () => {
      mockSlackApi.mockResolvedValueOnce({
        ok: false,
        error: 'rate_limited',
        retry_after: 60
      });

      const response = await request(app)
        .post('/slack/internal/approval/notify')
        .set('x-internal-key', 'test-internal-key')
        .send({
          title: 'test',
          channel: 'C1234567890'
        });

      expect(response.status).toBe(202);
      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBe('rate_limited');
    });
  });

  describe('POST /slack/interactive', () => {
    it('should handle approve action', async () => {
      const payload = {
        type: 'block_actions',
        user: { id: 'U1234567890', username: 'testuser' },
        channel: { id: 'C1234567890' },
        message: { ts: '1234567890.123456' },
        actions: [{ action_id: 'approve', value: 'test-doc-id' }]
      };

      const response = await request(app)
        .post('/slack/interactive')
        .send({ payload: JSON.stringify(payload) });

      expect(response.status).toBe(200);
    });

    it('should handle reject action', async () => {
      const payload = {
        type: 'block_actions',
        user: { id: 'U1234567890', username: 'testuser' },
        channel: { id: 'C1234567890' },
        message: { ts: '1234567890.123456' },
        actions: [{ action_id: 'reject', value: 'test-doc-id' }]
      };

      const response = await request(app)
        .post('/slack/interactive')
        .send({ payload: JSON.stringify(payload) });

      expect(response.status).toBe(200);
    });

    it('should handle modal submission', async () => {
      const payload = {
        type: 'view_submission',
        user: { id: 'U1234567890', username: 'testuser' },
        view: {
          callback_id: 'reject_reason',
          private_metadata: 'test-doc-id',
          state: {
            values: {
              reason_block: {
                reason: { value: '테스트 반려 사유' }
              }
            }
          }
        }
      };

      const response = await request(app)
        .post('/slack/interactive')
        .send({ payload: JSON.stringify(payload) });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /slack/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/slack/health');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.region).toBe('asia-northeast3');
    });

    it('should return channel-specific health status', async () => {
      const response = await request(app)
        .get('/slack/health?channel=C1234567890');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.channel).toBe('C1234567890');
    });
  });

  describe('Admin APIs', () => {
    it('should return dashboard data', async () => {
      const response = await request(app)
        .get('/slack/admin/dashboard')
        .set('x-internal-key', 'test-internal-key');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should update throttle configuration', async () => {
      const response = await request(app)
        .post('/slack/admin/throttle/C1234567890')
        .set('x-internal-key', 'test-internal-key')
        .send({ capacity: 10, refillPerSec: 2 });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should retry queue items', async () => {
      const response = await request(app)
        .post('/slack/admin/retry/webhook_retry')
        .set('x-internal-key', 'test-internal-key');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });
  });

  describe('Rules Simulator', () => {
    it('should simulate approval rules', async () => {
      const response = await request(app)
        .post('/slack/admin/rules/simulate')
        .set('x-internal-key', 'test-internal-key')
        .send({
          type: 'test',
          priority: 'normal',
          testData: {
            title: '테스트 승인 요청',
            summary: '시뮬레이션용 승인 요청입니다'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.simulation).toBeDefined();
    });

    it('should run rule tests', async () => {
      const response = await request(app)
        .post('/slack/admin/rules/test')
        .set('x-internal-key', 'test-internal-key')
        .send({
          type: 'test',
          priority: 'normal',
          testData: {
            title: '테스트 승인 요청',
            summary: '시뮬레이션용 승인 요청입니다'
          },
          dryRun: true
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.simulation).toBeDefined();
    });
  });
});

// 통합 테스트
describe('Integration Tests', () => {
  it('should handle complete approval flow', async () => {
    // 1. 승인 요청 생성
    const approvalResponse = await request(app)
      .post('/slack/internal/approval/notify')
      .set('x-internal-key', 'test-internal-key')
      .send({
        title: '통합 테스트 승인 요청',
        channel: 'C1234567890',
        type: 'test',
        refId: 'integration-test-123'
      });

    expect(approvalResponse.status).toBe(200);
    const docId = approvalResponse.body.docId;

    // 2. 승인 액션
    const approvePayload = {
      type: 'block_actions',
      user: { id: 'U1234567890', username: 'testuser' },
      channel: { id: 'C1234567890' },
      message: { ts: '1234567890.123456' },
      actions: [{ action_id: 'approve', value: docId }]
    };

    const approveResponse = await request(app)
      .post('/slack/interactive')
      .send({ payload: JSON.stringify(approvePayload) });

    expect(approveResponse.status).toBe(200);
  });

  it('should handle error scenarios', async () => {
    // Slack API 에러 시뮬레이션
    mockSlackApi.mockResolvedValueOnce({
      ok: false,
      error: 'channel_not_found'
    });

    const response = await request(app)
      .post('/slack/internal/approval/notify')
      .set('x-internal-key', 'test-internal-key')
      .send({
        title: '에러 테스트',
        channel: 'C9999999999'
      });

    expect(response.status).toBe(202);
    expect(response.body.ok).toBe(false);
  });
});

// 성능 테스트
describe('Performance Tests', () => {
  it('should handle concurrent requests', async () => {
    const requests = Array.from({ length: 10 }, (_, i) => 
      request(app)
        .post('/slack/internal/approval/notify')
        .set('x-internal-key', 'test-internal-key')
        .send({
          title: `동시 요청 ${i}`,
          channel: 'C1234567890'
        })
    );

    const responses = await Promise.all(requests);
    
    responses.forEach(response => {
      expect(response.status).toBeOneOf([200, 429]); // 성공 또는 레이트리밋
    });
  });

  it('should complete within timeout', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .post('/slack/internal/approval/notify')
      .set('x-internal-key', 'test-internal-key')
      .send({
        title: '타임아웃 테스트',
        channel: 'C1234567890'
      });

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // 5초 이내
    expect(response.status).toBe(200);
  });
});
