interface MockSlackResponse {
    ok: boolean;
    channel?: string;
    ts?: string;
    error?: string;
    retry_after?: number;
}
interface MockSlackConfig {
    enabled: boolean;
    responses: {
        [method: string]: MockSlackResponse | ((body: any) => MockSlackResponse);
    };
    delay?: number;
}
export declare function mockSlackApi(method: string, body: any): Promise<MockSlackResponse>;
export declare function updateMockConfig(updates: Partial<MockSlackConfig>): void;
export declare function setMockResponse(method: string, response: MockSlackResponse | ((body: any) => MockSlackResponse)): void;
export declare function setMockError(method: string, error: string, retryAfter?: number): void;
export declare function setMockSuccess(method: string, response: Partial<MockSlackResponse>): void;
export declare function isMockEnabled(): boolean;
export declare function getMockStats(): {
    enabled: boolean;
    delay: number | undefined;
    methods: string[];
};
export declare const mockHelpers: {
    simulateApprovalRequest: (title: string, type?: string) => {
        channel: string;
        type: string;
        refId: string;
        title: string;
        summary: string;
        url: string;
        image: string;
    };
    simulateApprovalAction: (docId: string, userId?: string) => {
        type: string;
        user: {
            id: string;
            username: string;
            name: string;
        };
        channel: {
            id: string;
        };
        message: {
            ts: string;
        };
        actions: {
            action_id: string;
            value: string;
        }[];
    };
    simulateRejectAction: (docId: string, userId?: string) => {
        type: string;
        user: {
            id: string;
            username: string;
            name: string;
        };
        channel: {
            id: string;
        };
        message: {
            ts: string;
        };
        actions: {
            action_id: string;
            value: string;
        }[];
    };
    simulateModalSubmission: (docId: string, reason: string, userId?: string) => {
        type: string;
        user: {
            id: string;
            username: string;
            name: string;
        };
        view: {
            callback_id: string;
            private_metadata: string;
            state: {
                values: {
                    reason_block: {
                        reason: {
                            value: string;
                        };
                    };
                };
            };
        };
    };
};
export declare const mockScenarios: {
    normalApproval: () => void;
    rateLimit: () => void;
    networkError: () => void;
    partialFailure: () => void;
};
declare const _default: {
    mockSlackApi: typeof mockSlackApi;
    updateMockConfig: typeof updateMockConfig;
    setMockResponse: typeof setMockResponse;
    setMockError: typeof setMockError;
    setMockSuccess: typeof setMockSuccess;
    isMockEnabled: typeof isMockEnabled;
    getMockStats: typeof getMockStats;
    mockHelpers: {
        simulateApprovalRequest: (title: string, type?: string) => {
            channel: string;
            type: string;
            refId: string;
            title: string;
            summary: string;
            url: string;
            image: string;
        };
        simulateApprovalAction: (docId: string, userId?: string) => {
            type: string;
            user: {
                id: string;
                username: string;
                name: string;
            };
            channel: {
                id: string;
            };
            message: {
                ts: string;
            };
            actions: {
                action_id: string;
                value: string;
            }[];
        };
        simulateRejectAction: (docId: string, userId?: string) => {
            type: string;
            user: {
                id: string;
                username: string;
                name: string;
            };
            channel: {
                id: string;
            };
            message: {
                ts: string;
            };
            actions: {
                action_id: string;
                value: string;
            }[];
        };
        simulateModalSubmission: (docId: string, reason: string, userId?: string) => {
            type: string;
            user: {
                id: string;
                username: string;
                name: string;
            };
            view: {
                callback_id: string;
                private_metadata: string;
                state: {
                    values: {
                        reason_block: {
                            reason: {
                                value: string;
                            };
                        };
                    };
                };
            };
        };
    };
    mockScenarios: {
        normalApproval: () => void;
        rateLimit: () => void;
        networkError: () => void;
        partialFailure: () => void;
    };
};
export default _default;
//# sourceMappingURL=slackMock.d.ts.map
