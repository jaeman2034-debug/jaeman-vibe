"use strict";
// Slack API 목킹 모듈
// 로컬/스테이징 환경에서 실제 Slack API 호출 없이 테스트 가능
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockScenarios = exports.mockHelpers = void 0;
exports.mockSlackApi = mockSlackApi;
exports.updateMockConfig = updateMockConfig;
exports.setMockResponse = setMockResponse;
exports.setMockError = setMockError;
exports.setMockSuccess = setMockSuccess;
exports.isMockEnabled = isMockEnabled;
exports.getMockStats = getMockStats;
const SLACK_MOCK_ENABLED = process.env.SLACK_MOCK === 'true' || process.env.NODE_ENV === 'development';
const mockConfig = {
    enabled: SLACK_MOCK_ENABLED,
    delay: 100, // 100ms 지연
    responses: {
        'chat.postMessage': (body) => ({
            ok: true,
            channel: body.channel || 'C1234567890',
            ts: `${Date.now()}.${Math.floor(Math.random() * 1000)}`
        }),
        'chat.update': (body) => ({
            ok: true,
            channel: body.channel || 'C1234567890',
            ts: body.ts || `${Date.now()}.${Math.floor(Math.random() * 1000)}`
        }),
        'views.open': (body) => ({
            ok: true
        }),
        'users.info': (body) => ({
            ok: true,
            user: {
                id: body.user || 'U1234567890',
                name: 'testuser',
                real_name: 'Test User',
                profile: {
                    display_name: 'Test User',
                    email: 'test@example.com'
                }
            }
        }),
        'conversations.info': (body) => ({
            ok: true,
            channel: {
                id: body.channel || 'C1234567890',
                name: 'test-channel',
                is_channel: true,
                is_group: false,
                is_im: false
            }
        })
    }
};
// 목킹된 Slack API 호출
async function mockSlackApi(method, body) {
    if (!mockConfig.enabled) {
        throw new Error('Mock is disabled');
    }
    // 지연 시뮬레이션
    if (mockConfig.delay) {
        await new Promise(resolve => setTimeout(resolve, mockConfig.delay));
    }
    const response = mockConfig.responses[method];
    if (!response) {
        return {
            ok: false,
            error: 'method_not_found'
        };
    }
    // 함수인 경우 호출, 아니면 그대로 반환
    if (typeof response === 'function') {
        return response(body);
    }
    return response;
}
// 목킹 설정 업데이트
function updateMockConfig(updates) {
    Object.assign(mockConfig, updates);
}
// 특정 메서드의 응답 설정
function setMockResponse(method, response) {
    mockConfig.responses[method] = response;
}
// 에러 응답 시뮬레이션
function setMockError(method, error, retryAfter) {
    mockConfig.responses[method] = {
        ok: false,
        error,
        retry_after: retryAfter
    };
}
// 성공 응답 시뮬레이션
function setMockSuccess(method, response) {
    mockConfig.responses[method] = {
        ok: true,
        ...response
    };
}
// 목킹 상태 확인
function isMockEnabled() {
    return mockConfig.enabled;
}
// 목킹 통계
function getMockStats() {
    return {
        enabled: mockConfig.enabled,
        delay: mockConfig.delay,
        methods: Object.keys(mockConfig.responses)
    };
}
// 테스트용 헬퍼 함수들
exports.mockHelpers = {
    // 승인 요청 시뮬레이션
    simulateApprovalRequest: (title, type = 'test') => ({
        channel: 'C1234567890',
        type,
        refId: `test-${Date.now()}`,
        title,
        summary: '테스트 승인 요청',
        url: 'https://example.com',
        image: 'https://via.placeholder.com/300x200'
    }),
    // 승인 액션 시뮬레이션
    simulateApprovalAction: (docId, userId = 'U1234567890') => ({
        type: 'block_actions',
        user: { id: userId, username: 'testuser', name: 'Test User' },
        channel: { id: 'C1234567890' },
        message: { ts: `${Date.now()}.123` },
        actions: [{ action_id: 'approve', value: docId }]
    }),
    // 반려 액션 시뮬레이션
    simulateRejectAction: (docId, userId = 'U1234567890') => ({
        type: 'block_actions',
        user: { id: userId, username: 'testuser', name: 'Test User' },
        channel: { id: 'C1234567890' },
        message: { ts: `${Date.now()}.123` },
        actions: [{ action_id: 'reject', value: docId }]
    }),
    // 모달 제출 시뮬레이션
    simulateModalSubmission: (docId, reason, userId = 'U1234567890') => ({
        type: 'view_submission',
        user: { id: userId, username: 'testuser', name: 'Test User' },
        view: {
            callback_id: 'reject_reason',
            private_metadata: docId,
            state: {
                values: {
                    reason_block: {
                        reason: { value: reason }
                    }
                }
            }
        }
    })
};
// E2E 테스트용 시나리오
exports.mockScenarios = {
    // 정상 승인 플로우
    normalApproval: () => {
        setMockSuccess('chat.postMessage', {
            channel: 'C1234567890',
            ts: `${Date.now()}.123`
        });
        setMockSuccess('chat.update', {
            channel: 'C1234567890',
            ts: `${Date.now()}.123`
        });
    },
    // 레이트리밋 시뮬레이션
    rateLimit: () => {
        setMockError('chat.postMessage', 'rate_limited', 60);
    },
    // 네트워크 에러 시뮬레이션
    networkError: () => {
        setMockError('chat.postMessage', 'network_error');
    },
    // 부분 실패 시뮬레이션
    partialFailure: () => {
        let callCount = 0;
        setMockResponse('chat.postMessage', (body) => {
            callCount++;
            if (callCount === 1) {
                return { ok: false, error: 'rate_limited', retry_after: 1 };
            }
            return { ok: true, channel: body.channel, ts: `${Date.now()}.123` };
        });
    }
};
exports.default = {
    mockSlackApi,
    updateMockConfig,
    setMockResponse,
    setMockError,
    setMockSuccess,
    isMockEnabled,
    getMockStats,
    mockHelpers: exports.mockHelpers,
    mockScenarios: exports.mockScenarios
};
