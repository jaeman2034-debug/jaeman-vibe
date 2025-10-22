/**
 * ?몄떆 ?뚮┝ ?꾩넚 濡쒓렇 湲곕줉
 */
export declare function logPush(payload: {
    title: string;
    body: string;
    tokens: string[];
    data?: any;
    successCount?: number;
    failureCount?: number;
}): Promise<void>;
/**
 * 釉뚮━???꾩넚 濡쒓렇 湲곕줉
 */
export declare function logBriefing(payload: {
    summary: string;
    audience: string;
    sentCount: number;
    itemCount: number;
    teamCount: number;
    totalCount: number;
    data?: any[];
}): Promise<void>;
/**
 * ?먮윭 濡쒓렇 湲곕줉
 */
export declare function logError(source: string, err: any, meta?: any, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<void>;
/**
 * ?ъ슜???쒕룞 濡쒓렇 湲곕줉
 */
export declare function logUserActivity(payload: {
    userId: string;
    activity: string;
    details?: any;
    location?: {
        lat: number;
        lng: number;
    };
    sessionId?: string;
}): Promise<void>;
/**
 * AI ?붿껌 濡쒓렇 湲곕줉
 */
export declare function logAIRequest(payload: {
    type: 'summary' | 'description' | 'tags' | 'briefing';
    input: string;
    output: string;
    model: string;
    tokensUsed?: number;
    processingTime?: number;
    userId?: string;
}): Promise<void>;
/**
 * ?쒖뒪???깅뒫 濡쒓렇 湲곕줉
 */
export declare function logPerformance(payload: {
    functionName: string;
    executionTime: number;
    memoryUsed?: number;
    success: boolean;
    errorMessage?: string;
    metadata?: any;
}): Promise<void>;
/**
 * ?쇱씪 ?듦퀎 ?낅뜲?댄듃
 */
export declare function updateDailyStats(date: string, stats: {
    newItems?: number;
    newSessions?: number;
    pushSent?: number;
    errors?: number;
    aiRequests?: number;
    uniqueUsers?: number;
}): Promise<void>;
/**
 * ?ㅼ떆媛?硫뷀듃由??낅뜲?댄듃
 */
export declare function updateRealtimeMetrics(metrics: {
    activeUsers?: number;
    currentSessions?: number;
    queueSize?: number;
    systemLoad?: number;
}): Promise<void>;
/**
 * 濡쒓렇 ?뺣━ ?⑥닔 (30???댁긽 ??濡쒓렇 ??젣)
 */
export declare function cleanupOldLogs(): Promise<void>;
/**
 * ??쒕낫?쒖슜 吏묎퀎 ?곗씠???앹꽦
 */
export declare function generateDashboardMetrics(): Promise<{
    newItems: number;
    newSessions: number;
    pushSent: number;
    errors: number;
    aiRequests: number;
    uniqueUsers: number;
} | null>;
//# sourceMappingURL=loggingUtils.d.ts.map
