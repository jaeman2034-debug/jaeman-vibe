import * as admin from 'firebase-admin';
export declare function trackPerformance(functionName: string): (target: any, propertyName: string, descriptor: PropertyDescriptor) => void;
export declare function optimizedFetch(url: string, options?: RequestInit): Promise<Response>;
export declare class OptimizedFirestoreQuery {
    private db;
    private batchSize;
    constructor(db: admin.firestore.Firestore, batchSize?: number);
    batchGet(docRefs: admin.firestore.DocumentReference[]): Promise<admin.firestore.DocumentSnapshot[]>;
    batchWrite(operations: Array<{
        type: 'set' | 'update' | 'delete';
        ref: admin.firestore.DocumentReference;
        data?: any;
    }>): Promise<void>;
    optimizedQuery(collection: string, filters: Array<{
        field: string;
        operator: admin.firestore.WhereFilterOp;
        value: any;
    }>, orderBy?: {
        field: string;
        direction: 'asc' | 'desc';
    }, limit?: number): Promise<admin.firestore.QuerySnapshot>;
}
export declare class MemoryMonitor {
    private static instance;
    private intervalId;
    private threshold;
    constructor(threshold?: number);
    static getInstance(threshold?: number): MemoryMonitor;
    start(intervalMs?: number): void;
    stop(): void;
    getCurrentUsage(): NodeJS.MemoryUsage;
}
export declare class SimpleCache<T> {
    private cache;
    private defaultTtl;
    constructor(defaultTtl?: number);
    set(key: string, value: T, ttl?: number): void;
    get(key: string): T | null;
    delete(key: string): boolean;
    clear(): void;
    size(): number;
}
export declare const performanceConfig: {
    http: {
        keepAlive: boolean;
        timeout: number;
        maxConnections: number;
        pipelining: number;
    };
    firestore: {
        batchSize: number;
        maxRetries: number;
        retryDelay: number;
    };
    memory: {
        threshold: number;
        checkInterval: number;
    };
    cache: {
        defaultTtl: number;
        maxSize: number;
    };
};
export declare function initializePerformanceOptimizations(): void;
declare const _default: {
    trackPerformance: typeof trackPerformance;
    optimizedFetch: typeof optimizedFetch;
    OptimizedFirestoreQuery: typeof OptimizedFirestoreQuery;
    MemoryMonitor: typeof MemoryMonitor;
    SimpleCache: typeof SimpleCache;
    performanceConfig: {
        http: {
            keepAlive: boolean;
            timeout: number;
            maxConnections: number;
            pipelining: number;
        };
        firestore: {
            batchSize: number;
            maxRetries: number;
            retryDelay: number;
        };
        memory: {
            threshold: number;
            checkInterval: number;
        };
        cache: {
            defaultTtl: number;
            maxSize: number;
        };
    };
    initializePerformanceOptimizations: typeof initializePerformanceOptimizations;
};
export default _default;
//# sourceMappingURL=performance.d.ts.map
