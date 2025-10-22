import * as admin from 'firebase-admin';
interface Experiment {
    id: string;
    name: string;
    variants: string[];
    epsilon: number;
    status: 'active' | 'paused' | 'completed';
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
}
interface VariantStats {
    variant: string;
    exposures: number;
    conversions: number;
    clicks: number;
    conversionRate: number;
    clickRate: number;
    confidence: number;
}
export declare class ABTestingManager {
    static createExperiment(name: string, variants: string[], epsilon?: number): Promise<string>;
    static recordEvent(experimentId: string, variant: string, userId: string, event: 'exposure' | 'conversion' | 'click', metadata?: Record<string, any>): Promise<void>;
    static selectVariant(experimentId: string, userId: string): Promise<string>;
    static getVariantStats(experimentId: string): Promise<VariantStats[]>;
    private static calculateConfidence;
    private static getBestVariant;
    static getExperiment(experimentId: string): Promise<Experiment | null>;
    static listExperiments(): Promise<Experiment[]>;
    static updateExperimentStatus(experimentId: string, status: 'active' | 'paused' | 'completed'): Promise<void>;
    static analyzeExperiment(experimentId: string): Promise<{
        experiment: Experiment;
        stats: VariantStats[];
        winner: string | null;
        significance: boolean;
        recommendation: string;
    }>;
    private static isSignificant;
    static optimizeExperiments(): Promise<void>;
    private static calculateOptimalEpsilon;
}
declare const _default: {
    ABTestingManager: typeof ABTestingManager;
};
export default _default;
//# sourceMappingURL=abTesting.d.ts.map
