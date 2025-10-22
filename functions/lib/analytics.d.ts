import * as admin from 'firebase-admin';
interface ExperimentLog {
    docId: string;
    teamId: string;
    variant: string;
    experimentId: string;
    event: 'posted' | 'clicked' | 'approved' | 'rejected';
    timestamp: admin.firestore.Timestamp;
    metadata?: Record<string, any>;
}
export declare class AnalyticsManager {
    static recordClick(docId: string, teamId: string, userId: string, userAgent: string, ip: string, variant?: string, experimentId?: string): Promise<void>;
    static recordExperiment(experimentLog: Omit<ExperimentLog, 'timestamp'>): Promise<void>;
    static calculateCTR(teamId: string, startDate: Date, endDate: Date): Promise<{
        totalPosted: number;
        totalClicks: number;
        ctr: number;
        byVariant: Record<string, {
            posted: number;
            clicks: number;
            ctr: number;
        }>;
    }>;
    static getExperimentStats(experimentId: string, startDate: Date, endDate: Date): Promise<{
        experimentId: string;
        totalEvents: number;
        byVariant: Record<string, {
            posted: number;
            clicked: number;
            approved: number;
            rejected: number;
            ctr: number;
            approvalRate: number;
        }>;
    }>;
}
export declare function createRedirectUrl(docId: string, teamId: string, variant?: string, experimentId?: string): string;
export declare function wrapWithTracking(originalUrl: string, docId: string, teamId: string, variant?: string, experimentId?: string): string;
declare const _default: {
    AnalyticsManager: typeof AnalyticsManager;
    createRedirectUrl: typeof createRedirectUrl;
    wrapWithTracking: typeof wrapWithTracking;
};
export default _default;
//# sourceMappingURL=analytics.d.ts.map
