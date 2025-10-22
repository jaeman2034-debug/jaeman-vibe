import * as admin from 'firebase-admin';
interface FeatureFlag {
    name: string;
    enabled: boolean;
    description: string;
    defaultValue: boolean;
    conditions?: {
        teamId?: string[];
        locale?: string[];
        environment?: string[];
    };
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
}
export declare class FeatureManager {
    private static cache;
    private static cacheExpiry;
    private static CACHE_TTL;
    static getFeature(name: string, teamId?: string, locale?: string, environment?: string): Promise<boolean>;
    static setFeature(feature: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): Promise<void>;
    static deleteFeature(name: string): Promise<void>;
    static listFeatures(): Promise<FeatureFlag[]>;
    private static evaluateFeature;
    static clearCache(): void;
}
export declare function initializeDefaultFeatures(): Promise<void>;
export declare function isFeatureEnabled(name: string, teamId?: string, locale?: string, environment?: string): Promise<boolean>;
declare const _default: {
    FeatureManager: typeof FeatureManager;
    initializeDefaultFeatures: typeof initializeDefaultFeatures;
    isFeatureEnabled: typeof isFeatureEnabled;
};
export default _default;
//# sourceMappingURL=features.d.ts.map
