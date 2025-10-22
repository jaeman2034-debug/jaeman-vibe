// 성능 튜닝 모듈
import { createRequire } from 'module';
import * as admin from 'firebase-admin';

// undici HTTP 클라이언트 (Node.js 18+ 내장)
import { fetch, Agent, setGlobalDispatcher } from 'undici';

// 전역 HTTP 에이전트 설정 (keep-alive)
const agent = new Agent({
  keepAliveTimeout: 30000, // 30초
  keepAliveMaxTimeout: 60000, // 60초
  keepAliveTimeoutThreshold: 1000, // 1초
  connections: 100, // 최대 연결 수
  pipelining: 10, // 파이프라인 요청 수
});

// 전역 디스패처 설정
setGlobalDispatcher(agent);

// 성능 메트릭 수집
interface PerformanceMetrics {
  functionName: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  customMetrics?: Record<string, any>;
}

class PerformanceTracker {
  private metrics: PerformanceMetrics[] = [];
  private startTime: number;
  private startCpuUsage: NodeJS.CpuUsage;

  constructor(private functionName: string) {
    this.startTime = Date.now();
    this.startCpuUsage = process.cpuUsage();
  }

  end(customMetrics?: Record<string, any>): PerformanceMetrics {
    const endTime = Date.now();
    const endCpuUsage = process.cpuUsage(this.startCpuUsage);
    const memoryUsage = process.memoryUsage();

    const metric: PerformanceMetrics = {
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

  getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }

  getAverageDuration(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length;
  }

  getMaxMemoryUsage(): number {
    if (this.metrics.length === 0) return 0;
    return Math.max(...this.metrics.map(m => m.memoryUsage.heapUsed));
  }
}

// 성능 추적 데코레이터
export function trackPerformance(functionName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function (...args: any[]) {
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
      } catch (error) {
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
export async function optimizedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
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
  } catch (error) {
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
export class OptimizedFirestoreQuery {
  private db: admin.firestore.Firestore;
  private batchSize: number;

  constructor(db: admin.firestore.Firestore, batchSize: number = 500) {
    this.db = db;
    this.batchSize = batchSize;
  }

  // 배치 읽기 최적화
  async batchGet(docRefs: admin.firestore.DocumentReference[]): Promise<admin.firestore.DocumentSnapshot[]> {
    const results: admin.firestore.DocumentSnapshot[] = [];
    
    for (let i = 0; i < docRefs.length; i += this.batchSize) {
      const batch = docRefs.slice(i, i + this.batchSize);
      const snapshots = await this.db.getAll(...batch);
      results.push(...snapshots);
    }
    
    return results;
  }

  // 배치 쓰기 최적화
  async batchWrite(operations: Array<{
    type: 'set' | 'update' | 'delete';
    ref: admin.firestore.DocumentReference;
    data?: any;
  }>): Promise<void> {
    const batches: admin.firestore.WriteBatch[] = [];
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
          currentBatch.set(operation.ref, operation.data!);
          break;
        case 'update':
          currentBatch.update(operation.ref, operation.data!);
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
  async optimizedQuery(
    collection: string,
    filters: Array<{ field: string; operator: admin.firestore.WhereFilterOp; value: any }>,
    orderBy?: { field: string; direction: 'asc' | 'desc' },
    limit?: number
  ): Promise<admin.firestore.QuerySnapshot> {
    let query: admin.firestore.Query = this.db.collection(collection);

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

// 메모리 사용량 모니터링
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private intervalId: NodeJS.Timeout | null = null;
  private threshold: number;

  constructor(threshold: number = 100 * 1024 * 1024) { // 100MB 기본 임계값
    this.threshold = threshold;
  }

  static getInstance(threshold?: number): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor(threshold);
    }
    return MemoryMonitor.instance;
  }

  start(intervalMs: number = 30000): void {
    if (this.intervalId) return;

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

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getCurrentUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }
}

// 캐시 관리
export class SimpleCache<T> {
  private cache: Map<string, { value: T; expiry: number }> = new Map();
  private defaultTtl: number;

  constructor(defaultTtl: number = 300000) { // 5분 기본 TTL
    this.defaultTtl = defaultTtl;
  }

  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTtl);
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// 성능 최적화 설정
export const performanceConfig = {
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
export function initializePerformanceOptimizations(): void {
  // 메모리 모니터 시작
  const memoryMonitor = MemoryMonitor.getInstance(performanceConfig.memory.threshold);
  memoryMonitor.start(performanceConfig.memory.checkInterval);

  // 가비지 컬렉션 활성화 (Node.js --expose-gc 플래그 필요)
  if (global.gc) {
    setInterval(() => {
      global.gc();
    }, 60000); // 1분마다 GC 실행
  }

  console.log('Performance optimizations initialized');
}

export default {
  trackPerformance,
  optimizedFetch,
  OptimizedFirestoreQuery,
  MemoryMonitor,
  SimpleCache,
  performanceConfig,
  initializePerformanceOptimizations
};
