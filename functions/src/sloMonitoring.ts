// SLO 모니터링 모듈
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface SLOMetric {
  service: string;
  timestamp: admin.firestore.Timestamp;
  latency: number; // milliseconds
  success: boolean;
  errorCode?: string;
  endpoint?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface SLOTarget {
  service: string;
  latencyP99: number; // milliseconds
  errorRate: number; // 0-1
  availability: number; // 0-1
  window: number; // hours
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

export class SLOMonitoring {
  // SLO 메트릭 기록
  static async recordMetric(metric: Omit<SLOMetric, 'timestamp'>): Promise<void> {
    await db.collection('slo_metrics').add({
      ...metric,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // SLO 타겟 설정
  static async setSLOTarget(target: Omit<SLOTarget, 'service'> & { service: string }): Promise<void> {
    await db.collection('slo_targets').doc(target.service).set({
      ...target,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  // SLO 타겟 조회
  static async getSLOTarget(service: string): Promise<SLOTarget | null> {
    const doc = await db.collection('slo_targets').doc(service).get();
    
    if (!doc.exists) return null;
    
    return doc.data() as SLOTarget;
  }

  // SLO 상태 계산
  static async calculateSLOStatus(service: string, windowHours: number = 24): Promise<SLOStatus | null> {
    const target = await this.getSLOTarget(service);
    if (!target || !target.enabled) return null;

    const windowStart = admin.firestore.Timestamp.fromMillis(
      Date.now() - (windowHours * 60 * 60 * 1000)
    );

    const metricsSnap = await db.collection('slo_metrics')
      .where('service', '==', service)
      .where('timestamp', '>=', windowStart)
      .orderBy('timestamp', 'desc')
      .get();

    if (metricsSnap.empty) {
      return {
        service,
        window: windowHours,
        currentLatencyP99: 0,
        currentErrorRate: 0,
        currentAvailability: 0,
        targetLatencyP99: target.latencyP99,
        targetErrorRate: target.errorRate,
        targetAvailability: target.availability,
        latencySLO: false,
        errorRateSLO: false,
        availabilitySLO: false,
        overallSLO: false,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp
      };
    }

    const metrics = metricsSnap.docs.map(doc => doc.data() as SLOMetric);
    
    // P99 지연시간 계산
    const latencies = metrics.map(m => m.latency).sort((a, b) => a - b);
    const p99Index = Math.floor(latencies.length * 0.99);
    const currentLatencyP99 = latencies[p99Index] || 0;

    // 에러율 계산
    const totalRequests = metrics.length;
    const failedRequests = metrics.filter(m => !m.success).length;
    const currentErrorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;

    // 가용성 계산 (성공한 요청 비율)
    const currentAvailability = totalRequests > 0 ? (totalRequests - failedRequests) / totalRequests : 0;

    // SLO 달성 여부
    const latencySLO = currentLatencyP99 <= target.latencyP99;
    const errorRateSLO = currentErrorRate <= target.errorRate;
    const availabilitySLO = currentAvailability >= target.availability;
    const overallSLO = latencySLO && errorRateSLO && availabilitySLO;

    return {
      service,
      window: windowHours,
      currentLatencyP99,
      currentErrorRate,
      currentAvailability,
      targetLatencyP99: target.latencyP99,
      targetErrorRate: target.errorRate,
      targetAvailability: target.availability,
      latencySLO,
      errorRateSLO,
      availabilitySLO,
      overallSLO,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp
    };
  }

  // SLO 상태 저장
  static async saveSLOStatus(status: SLOStatus): Promise<void> {
    await db.collection('slo_status').doc(`${status.service}_${status.window}h`).set(status);
  }

  // 모든 서비스의 SLO 상태 조회
  static async getAllSLOStatus(windowHours: number = 24): Promise<SLOStatus[]> {
    const targetsSnap = await db.collection('slo_targets')
      .where('enabled', '==', true)
      .get();

    const statuses: SLOStatus[] = [];

    for (const targetDoc of targetsSnap.docs) {
      const target = targetDoc.data() as SLOTarget;
      const status = await this.calculateSLOStatus(target.service, windowHours);
      
      if (status) {
        await this.saveSLOStatus(status);
        statuses.push(status);
      }
    }

    return statuses;
  }

  // SLO 위반 알림
  static async checkSLOViolations(): Promise<{
    violations: SLOStatus[];
    alerts: string[];
  }> {
    const statuses = await this.getAllSLOStatus();
    const violations = statuses.filter(status => !status.overallSLO);
    const alerts: string[] = [];

    for (const violation of violations) {
      const alert = this.generateSLOAlert(violation);
      alerts.push(alert);
    }

    return { violations, alerts };
  }

  // SLO 알림 생성
  private static generateSLOAlert(status: SLOStatus): string {
    const issues: string[] = [];
    
    if (!status.latencySLO) {
      issues.push(`지연시간 P99: ${status.currentLatencyP99}ms (목표: ${status.targetLatencyP99}ms)`);
    }
    
    if (!status.errorRateSLO) {
      issues.push(`에러율: ${(status.currentErrorRate * 100).toFixed(2)}% (목표: ${(status.targetErrorRate * 100).toFixed(2)}%)`);
    }
    
    if (!status.availabilitySLO) {
      issues.push(`가용성: ${(status.currentAvailability * 100).toFixed(2)}% (목표: ${(status.targetAvailability * 100).toFixed(2)}%)`);
    }

    return `🚨 SLO 위반: ${status.service}\n${issues.join('\n')}`;
  }

  // SLO 대시보드 데이터
  static async getSLODashboard(): Promise<{
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
  }> {
    const statuses = await this.getAllSLOStatus();
    const overallHealth = statuses.length > 0 
      ? statuses.filter(s => s.overallSLO).length / statuses.length 
      : 1;
    
    const criticalIssues = statuses.filter(s => !s.overallSLO).length;

    // 트렌드 데이터 (최근 7일)
    const trends: { [service: string]: any } = {};
    
    for (const status of statuses) {
      const trendData = await this.getSLOTrends(status.service, 7);
      trends[status.service] = trendData;
    }

    return {
      services: statuses,
      overallHealth,
      criticalIssues,
      trends
    };
  }

  // SLO 트렌드 데이터
  static async getSLOTrends(service: string, days: number): Promise<{
    latency: number[];
    errorRate: number[];
    availability: number[];
    timestamps: string[];
  }> {
    const windowStart = admin.firestore.Timestamp.fromMillis(
      Date.now() - (days * 24 * 60 * 60 * 1000)
    );

    const metricsSnap = await db.collection('slo_metrics')
      .where('service', '==', service)
      .where('timestamp', '>=', windowStart)
      .orderBy('timestamp', 'asc')
      .get();

    const metrics = metricsSnap.docs.map(doc => doc.data() as SLOMetric);
    
    // 시간별 집계 (1시간 단위)
    const hourlyData = new Map<string, {
      latencies: number[];
      errors: number;
      total: number;
    }>();

    metrics.forEach(metric => {
      const hour = metric.timestamp.toDate().toISOString().substring(0, 13);
      
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, { latencies: [], errors: 0, total: 0 });
      }
      
      const data = hourlyData.get(hour)!;
      data.latencies.push(metric.latency);
      data.total++;
      if (!metric.success) data.errors++;
    });

    const timestamps: string[] = [];
    const latency: number[] = [];
    const errorRate: number[] = [];
    const availability: number[] = [];

    for (const [hour, data] of hourlyData) {
      timestamps.push(hour);
      
      // P95 지연시간
      const sortedLatencies = data.latencies.sort((a, b) => a - b);
      const p95Index = Math.floor(sortedLatencies.length * 0.95);
      latency.push(sortedLatencies[p95Index] || 0);
      
      // 에러율
      errorRate.push(data.total > 0 ? data.errors / data.total : 0);
      
      // 가용성
      availability.push(data.total > 0 ? (data.total - data.errors) / data.total : 0);
    }

    return { latency, errorRate, availability, timestamps };
  }

  // SLO 메트릭 정리 (오래된 데이터 삭제)
  static async cleanupOldMetrics(daysToKeep: number = 30): Promise<number> {
    const cutoffTime = admin.firestore.Timestamp.fromMillis(
      Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)
    );

    const oldMetricsSnap = await db.collection('slo_metrics')
      .where('timestamp', '<', cutoffTime)
      .limit(1000) // 배치 크기 제한
      .get();

    if (oldMetricsSnap.empty) return 0;

    const batch = db.batch();
    let deleted = 0;

    oldMetricsSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
      deleted++;
    });

    await batch.commit();
    return deleted;
  }

  // SLO 리포트 생성
  static async generateSLOReport(service: string, days: number = 7): Promise<{
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
  }> {
    const status = await this.calculateSLOStatus(service, 24);
    const trends = await this.getSLOTrends(service, days);
    
    if (!status) {
      throw new Error(`No SLO data found for service: ${service}`);
    }

    const avgLatency = trends.latency.reduce((sum, val) => sum + val, 0) / trends.latency.length;
    const p99Latency = Math.max(...trends.latency);
    const avgErrorRate = trends.errorRate.reduce((sum, val) => sum + val, 0) / trends.errorRate.length;
    const avgAvailability = trends.availability.reduce((sum, val) => sum + val, 0) / trends.availability.length;

    const dailyBreakdown = trends.timestamps.map((timestamp, index) => ({
      date: timestamp,
      latency: trends.latency[index],
      errorRate: trends.errorRate[index],
      availability: trends.availability[index]
    }));

    const recommendations: string[] = [];
    
    if (!status.latencySLO) {
      recommendations.push('지연시간 최적화가 필요합니다. 데이터베이스 쿼리나 외부 API 호출을 검토하세요.');
    }
    
    if (!status.errorRateSLO) {
      recommendations.push('에러율이 높습니다. 에러 로그를 분석하고 예외 처리를 강화하세요.');
    }
    
    if (!status.availabilitySLO) {
      recommendations.push('가용성이 목표치에 미달합니다. 서비스 안정성을 개선하세요.');
    }

    return {
      service,
      period: `${days} days`,
      summary: {
        avgLatency,
        p99Latency,
        errorRate: avgErrorRate,
        availability: avgAvailability
      },
      dailyBreakdown,
      recommendations
    };
  }
}

export default {
  SLOMonitoring
};
