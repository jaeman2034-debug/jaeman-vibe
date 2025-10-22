import * as admin from 'firebase-admin';
interface ThrottleConfig {
    channel: string;
    capacity: number;
    refillPerSec: number;
    lastTuned: admin.firestore.Timestamp;
    tuningHistory: Array<{
        timestamp: admin.firestore.Timestamp;
        capacity: number;
        refillPerSec: number;
        reason: string;
        metrics: {
            rateLimitHits: number;
            avgLatency: number;
            queueLength: number;
        };
    }>;
}
interface ThrottleMetrics {
    channel: string;
    timestamp: admin.firestore.Timestamp;
    rateLimitHits: number;
    avgLatency: number;
    queueLength: number;
    successRate: number;
    throughput: number;
}
export declare class AutoThrottleTuner {
    static recordMetrics(metrics: Omit<ThrottleMetrics, 'timestamp'>): Promise<void>;
    static getThrottleConfig(channel: string): Promise<ThrottleConfig | null>;
    static setThrottleConfig(config: Omit<ThrottleConfig, 'lastTuned'>): Promise<void>;
    static tuneAllChannels(): Promise<{
        tuned: number;
        skipped: number;
        errors: string[];
    }>;
    private static shouldTuneChannel;
    static tuneChannel(channel: string): Promise<{
        oldCapacity: number;
        newCapacity: number;
        oldRefillPerSec: number;
        newRefillPerSec: number;
        reason: string;
    }>;
    private static calculateOptimalThrottle;
    private static getRecentMetrics;
    private static calculateAverageMetrics;
    static getTuningHistory(channel: string): Promise<ThrottleConfig['tuningHistory']>;
    static getThrottleReport(channel: string, days?: number): Promise<{
        channel: string;
        period: string;
        currentConfig: {
            capacity: number;
            refillPerSec: number;
        };
        performance: {
            avgRateLimitHits: number;
            avgLatency: number;
            avgQueueLength: number;
            avgSuccessRate: number;
            avgThroughput: number;
        };
        tuningHistory: Array<{
            date: string;
            capacity: number;
            refillPerSec: number;
            reason: string;
        }>;
        recommendations: string[];
    }>;
    static emergencyThrottleAdjustment(channel: string, capacity: number, refillPerSec: number, reason: string): Promise<void>;
    static cleanupOldMetrics(daysToKeep?: number): Promise<number>;
}
declare const _default: {
    AutoThrottleTuner: typeof AutoThrottleTuner;
};
export default _default;
//# sourceMappingURL=autoThrottle.d.ts.map
