import * as admin from 'firebase-admin';
interface I18nKey {
    key: string;
    locale: string;
    value: string;
    description?: string;
    category?: string;
    variables?: string[];
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
    createdBy?: string;
    updatedBy?: string;
}
export declare class I18nManager {
    private static cache;
    private static cacheExpiry;
    private static CACHE_TTL;
    static getKey(key: string, locale: string): Promise<string>;
    static setKey(key: string, locale: string, value: string, description?: string, category?: string, variables?: string[], userId?: string): Promise<void>;
    static deleteKey(key: string, locale: string): Promise<void>;
    static getKeysByLocale(locale: string): Promise<I18nKey[]>;
    static searchKeys(keyPattern: string): Promise<I18nKey[]>;
    static getKeysByCategory(category: string, locale?: string): Promise<I18nKey[]>;
    static getTranslationStatus(): Promise<{
        [key: string]: {
            [locale: string]: boolean;
        };
    }>;
    static findMissingTranslations(): Promise<{
        key: string;
        missingLocales: string[];
    }[]>;
    static extractVariables(text: string): string[];
    static bulkImport(translations: Array<{
        key: string;
        locale: string;
        value: string;
        description?: string;
        category?: string;
    }>, userId?: string): Promise<{
        success: number;
        failed: number;
        errors: string[];
    }>;
    static exportTranslations(locale?: string): Promise<{
        [locale: string]: {
            [key: string]: string;
        };
    }>;
    static clearCache(): void;
    static getCacheStats(): {
        totalKeys: number;
        locales: string[];
        memoryUsage: number;
    };
    static getKeyUsageStats(): Promise<{
        [key: string]: {
            usageCount: number;
            lastUsed: admin.firestore.Timestamp | null;
        };
    }>;
    static recordKeyUsage(key: string, locale: string): Promise<void>;
}
declare const _default: {
    I18nManager: typeof I18nManager;
};
export default _default;
//# sourceMappingURL=i18nManager.d.ts.map
