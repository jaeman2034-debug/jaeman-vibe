import * as admin from 'firebase-admin';
interface SLOMetric {
    service: string;
    timestamp: admin.firestore.Timestamp;
    latency: number;
    success: boolean;
    errorCode?: string;
    endpoint?: string;
    userId?: string;
    metadata?: Record<string, any>;
}
interface SLOTarget {
    service: string;
    latencyP99: number;
    errorRate: number;
    availability: number;
    window: number;
    enabled: boolean;
}
interface SLOStatus {
    service: string;
    window: number;
    currentLatencyP99: number;
    currentErrorRate: number;
    currentAvailability: number;
    targetLatencyP99: number;
    targetErrorRate: number;
    targetAvailability: number;
    latencySLO: boolean;
    errorRateSLO: boolean;
    availabilitySLO: boolean;
    overallSLO: boolean;
    lastUpdated: admin.firestore.Timestamp;
}
export declare class SLOMonitoring {
    static recordMetric(metric: Omit<SLOMetric, 'timestamp'>): Promise<void>;
    static setSLOTarget(target: Omit<SLOTarget, 'service'> & {
        service: string;
    }): Promise<void>;
    static getSLOTarget(service: string): Promise<SLOTarget | null>;
    static calculateSLOStatus(service: string, windowHours?: number): Promise<SLOStatus | null>;
    static saveSLOStatus(status: SLOStatus): Promise<void>;
    static getAllSLOStatus(windowHours?: number): Promise<SLOStatus[]>;
    static checkSLOViolations(): Promise<{
        violations: SLOStatus[];
        alerts: string[];
    }>;
    private static generateSLOAlert;
    static getSLODashboard(): Promise<{
        services: SLOStatus[];
        overallHealth: number;
        criticalIssues: number;
        trends: {
            [service: string]: {
                latency: number[];
                errorRate: number[];
                availability: number[];
                timestamps: string[];
            };
        };
    }>;
    static getSLOTrends(service: string, days: number): Promise<{
        latency: number[];
        errorRate: number[];
        availability: number[];
        timestamps: string[];
    }>;
    static cleanupOldMetrics(daysToKeep?: number): Promise<number>;
    static generateSLOReport(service: string, days?: number): Promise<{
        service: string;
        period: string;
        summary: {
            avgLatency: number;
            p99Latency: number;
            errorRate: number;
            availability: number;
        };
        dailyBreakdown: Array<{
            date: string;
            latency: number;
            errorRate: number;
            availability: number;
        }>;
        recommendations: string[];
    }>;
}
declare const _default: {
    SLOMonitoring: typeof SLOMonitoring;
};
export default _default;
//# sourceMappingURL=sloMonitoring.d.ts.map
