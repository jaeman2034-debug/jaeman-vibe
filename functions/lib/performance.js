"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceConfig = exports.SimpleCache = exports.MemoryMonitor = exports.OptimizedFirestoreQuery = void 0;
exports.trackPerformance = trackPerformance;
exports.optimizedFetch = optimizedFetch;
exports.initializePerformanceOptimizations = initializePerformanceOptimizations;
const admin = __importStar(require("firebase-admin"));
// undici HTTP 클라이언트 (Node.js 18+ 내장)
const undici_1 = require("undici");
// 전역 HTTP 에이전트 설정 (keep-alive)
const agent = new undici_1.Agent({
    keepAliveTimeout: 30000, // 30초
    keepAliveMaxTimeout: 60000, // 60초
    keepAliveTimeoutThreshold: 1000, // 1초
    connections: 100, // 최대 연결 수
    pipelining: 10, // 파이프라인 요청 수
});
// 전역 디스패처 설정
(0, undici_1.setGlobalDispatcher)(agent);
class PerformanceTracker {
    constructor(functionName) {
        this.functionName = functionName;
        this.metrics = [];
        this.startTime = Date.now();
        this.startCpuUsage = process.cpuUsage();
    }
    end(customMetrics) {
        const endTime = Date.now();
        const endCpuUsage = process.cpuUsage(this.startCpuUsage);
        const memoryUsage = process.memoryUsage();
        const metric = {
            functionName: this.functionName,
            startTime: this.startTime,
            endTime,
            duration: endTime - this.startTime,
            memoryUsage,
            cpuUsage: endCpuUsage,
            customMetrics
        };
        this.metrics.push(metric);
        return metric;
    }
    getMetrics() {
        return this.metrics;
    }
    getAverageDuration() {
        if (this.metrics.length === 0)
            return 0;
        return this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length;
    }
    getMaxMemoryUsage() {
        if (this.metrics.length === 0)
            return 0;
        return Math.max(...this.metrics.map(m => m.memoryUsage.heapUsed));
    }
}
// 성능 추적 데코레이터
function trackPerformance(functionName) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = async function (...args) {
            const tracker = new PerformanceTracker(`${functionName}.${propertyName}`);
            try {
                const result = await method.apply(this, args);
                const metric = tracker.end();
                // 성능 메트릭을 Firestore에 저장
                await admin.firestore().collection('performance_metrics').add({
                    ...metric,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    environment: process.env.NODE_ENV || 'production'
                });
                return result;
            }
            catch (error) {
                const metric = tracker.end({ error: String(error) });
                // 에러와 함께 성능 메트릭 저장
                await admin.firestore().collection('performance_metrics').add({
                    ...metric,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    environment: process.env.NODE_ENV || 'production'
                });
                throw error;
            }
        };
    };
}
// 최적화된 fetch 함수
async function optimizedFetch(url, options = {}) {
    const startTime = Date.now();
    try {
        const response = await (0, undici_1.fetch)(url, {
            ...options,
            // undici 최적화 옵션
            keepalive: true,
            timeout: 30000, // 30초 타임아웃
        });
        const duration = Date.now() - startTime;
        // 성능 메트릭 로깅
        console.log(JSON.stringify({
            level: 'info',
            message: 'HTTP request completed',
            url,
            status: response.status,
            duration,
            timestamp: new Date().toISOString()
        }));
        return response;
    }
    catch (error) {
        const duration = Date.now() - startTime;
        console.error(JSON.stringify({
            level: 'error',
            message: 'HTTP request failed',
            url,
            error: String(error),
            duration,
            timestamp: new Date().toISOString()
        }));
        throw error;
    }
}
// Firestore 쿼리 최적화
class OptimizedFirestoreQuery {
    constructor(db, batchSize = 500) {
        this.db = db;
        this.batchSize = batchSize;
    }
    // 배치 읽기 최적화
    async batchGet(docRefs) {
        const results = [];
        for (let i = 0; i < docRefs.length; i += this.batchSize) {
            const batch = docRefs.slice(i, i + this.batchSize);
            const snapshots = await this.db.getAll(...batch);
            results.push(...snapshots);
        }
        return results;
    }
    // 배치 쓰기 최적화
    async batchWrite(operations) {
        const batches = [];
        let currentBatch = this.db.batch();
        let operationCount = 0;
        for (const operation of operations) {
            if (operationCount >= this.batchSize) {
                batches.push(currentBatch);
                currentBatch = this.db.batch();
                operationCount = 0;
            }
            switch (operation.type) {
                case 'set':
                    currentBatch.set(operation.ref, operation.data);
                    break;
                case 'update':
                    currentBatch.update(operation.ref, operation.data);
                    break;
                case 'delete':
                    currentBatch.delete(operation.ref);
                    break;
            }
            operationCount++;
        }
        if (operationCount > 0) {
            batches.push(currentBatch);
        }
        // 모든 배치를 병렬로 실행
        await Promise.all(batches.map(batch => batch.commit()));
    }
    // 인덱스 최적화된 쿼리
    async optimizedQuery(collection, filters, orderBy, limit) {
        let query = this.db.collection(collection);
        // 필터 적용
        for (const filter of filters) {
            query = query.where(filter.field, filter.operator, filter.value);
        }
        // 정렬 적용
        if (orderBy) {
            query = query.orderBy(orderBy.field, orderBy.direction);
        }
        // 제한 적용
        if (limit) {
            query = query.limit(limit);
        }
        return await query.get();
    }
}
exports.OptimizedFirestoreQuery = OptimizedFirestoreQuery;
// 메모리 사용량 모니터링
class MemoryMonitor {
    constructor(threshold = 100 * 1024 * 1024) {
        this.intervalId = null;
        this.threshold = threshold;
    }
    static getInstance(threshold) {
        if (!MemoryMonitor.instance) {
            MemoryMonitor.instance = new MemoryMonitor(threshold);
        }
        return MemoryMonitor.instance;
    }
    start(intervalMs = 30000) {
        if (this.intervalId)
            return;
        this.intervalId = setInterval(() => {
            const usage = process.memoryUsage();
            if (usage.heapUsed > this.threshold) {
                console.warn(JSON.stringify({
                    level: 'warn',
                    message: 'High memory usage detected',
                    memoryUsage: usage,
                    threshold: this.threshold,
                    timestamp: new Date().toISOString()
                }));
                // 가비지 컬렉션 강제 실행
                if (global.gc) {
                    global.gc();
                }
            }
        }, intervalMs);
    }
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    getCurrentUsage() {
        return process.memoryUsage();
    }
}
exports.MemoryMonitor = MemoryMonitor;
// 캐시 관리
class SimpleCache {
    constructor(defaultTtl = 300000) {
        this.cache = new Map();
        this.defaultTtl = defaultTtl;
    }
    set(key, value, ttl) {
        const expiry = Date.now() + (ttl || this.defaultTtl);
        this.cache.set(key, { value, expiry });
    }
    get(key) {
        const item = this.cache.get(key);
        if (!item)
            return null;
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }
    delete(key) {
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
}
exports.SimpleCache = SimpleCache;
// 성능 최적화 설정
exports.performanceConfig = {
    // HTTP 클라이언트 설정
    http: {
        keepAlive: true,
        timeout: 30000,
        maxConnections: 100,
        pipelining: 10
    },
    // Firestore 설정
    firestore: {
        batchSize: 500,
        maxRetries: 3,
        retryDelay: 1000
    },
    // 메모리 모니터링
    memory: {
        threshold: 100 * 1024 * 1024, // 100MB
        checkInterval: 30000 // 30초
    },
    // 캐시 설정
    cache: {
        defaultTtl: 300000, // 5분
        maxSize: 1000
    }
};
// 성능 최적화 초기화
function initializePerformanceOptimizations() {
    // 메모리 모니터 시작
    const memoryMonitor = MemoryMonitor.getInstance(exports.performanceConfig.memory.threshold);
    memoryMonitor.start(exports.performanceConfig.memory.checkInterval);
    // 가비지 컬렉션 활성화 (Node.js --expose-gc 플래그 필요)
    if (global.gc) {
        setInterval(() => {
            global.gc();
        }, 60000); // 1분마다 GC 실행
    }
    console.log('Performance optimizations initialized');
}
exports.default = {
    trackPerformance,
    optimizedFetch,
    OptimizedFirestoreQuery,
    MemoryMonitor,
    SimpleCache,
    performanceConfig: exports.performanceConfig,
    initializePerformanceOptimizations
};
