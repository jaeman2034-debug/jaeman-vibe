// A/B/C 자동 최적화 (ε-greedy) 모듈
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface Experiment {
  id: string;
  name: string;
  variants: string[];
  epsilon: number; // 탐험 비율 (0.1 = 10%)
  status: 'active' | 'paused' | 'completed';
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

interface ExperimentEvent {
  experimentId: string;
  variant: string;
  userId: string;
  event: 'exposure' | 'conversion' | 'click';
  timestamp: admin.firestore.Timestamp;
  metadata?: Record<string, any>;
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

export class ABTestingManager {
  // 실험 생성
  static async createExperiment(
    name: string,
    variants: string[],
    epsilon: number = 0.1
  ): Promise<string> {
    const docRef = await db.collection('experiments').add({
      name,
      variants,
      epsilon: Math.max(0, Math.min(1, epsilon)), // 0-1 범위로 제한
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return docRef.id;
  }

  // 실험 이벤트 기록
  static async recordEvent(
    experimentId: string,
    variant: string,
    userId: string,
    event: 'exposure' | 'conversion' | 'click',
    metadata?: Record<string, any>
  ): Promise<void> {
    await db.collection('experiment_events').add({
      experimentId,
      variant,
      userId,
      event,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: metadata || null
    });
  }

  // ε-greedy 알고리즘으로 변형 선택
  static async selectVariant(
    experimentId: string,
    userId: string
  ): Promise<string> {
    const experiment = await this.getExperiment(experimentId);
    if (!experiment || experiment.status !== 'active') {
      // 실험이 없거나 비활성화된 경우 첫 번째 변형 반환
      return experiment?.variants[0] || 'control';
    }

    const stats = await this.getVariantStats(experimentId);
    if (stats.length === 0) {
      // 통계가 없으면 첫 번째 변형 반환
      return experiment.variants[0];
    }

    // ε-greedy 알고리즘
    const random = Math.random();
    
    if (random < experiment.epsilon) {
      // 탐험: 랜덤하게 변형 선택
      const randomIndex = Math.floor(Math.random() * experiment.variants.length);
      return experiment.variants[randomIndex];
    } else {
      // 활용: 가장 좋은 성능의 변형 선택
      const bestVariant = this.getBestVariant(stats);
      return bestVariant || experiment.variants[0];
    }
  }

  // 변형 통계 조회
  static async getVariantStats(experimentId: string): Promise<VariantStats[]> {
    const eventsSnap = await db.collection('experiment_events')
      .where('experimentId', '==', experimentId)
      .get();

    const variantStats = new Map<string, {
      exposures: number;
      conversions: number;
      clicks: number;
    }>();

    eventsSnap.docs.forEach(doc => {
      const data = doc.data() as ExperimentEvent;
      const variant = data.variant;
      
      if (!variantStats.has(variant)) {
        variantStats.set(variant, { exposures: 0, conversions: 0, clicks: 0 });
      }
      
      const stats = variantStats.get(variant)!;
      
      if (data.event === 'exposure') stats.exposures++;
      else if (data.event === 'conversion') stats.conversions++;
      else if (data.event === 'click') stats.clicks++;
    });

    return Array.from(variantStats.entries()).map(([variant, stats]) => ({
      variant,
      exposures: stats.exposures,
      conversions: stats.conversions,
      clicks: stats.clicks,
      conversionRate: stats.exposures > 0 ? stats.conversions / stats.exposures : 0,
      clickRate: stats.exposures > 0 ? stats.clicks / stats.exposures : 0,
      confidence: this.calculateConfidence(stats.exposures, stats.conversions)
    }));
  }

  // 신뢰도 계산 (Wilson Score Interval)
  private static calculateConfidence(exposures: number, conversions: number): number {
    if (exposures === 0) return 0;
    
    const p = conversions / exposures;
    const n = exposures;
    const z = 1.96; // 95% 신뢰구간
    
    const lower = (p + z * z / (2 * n) - z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)) / (1 + z * z / n);
    const upper = (p + z * z / (2 * n) + z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)) / (1 + z * z / n);
    
    return Math.max(0, upper - lower);
  }

  // 최고 성능 변형 선택
  private static getBestVariant(stats: VariantStats[]): string | null {
    if (stats.length === 0) return null;
    
    // 신뢰도가 높은 변형들 중에서 전환율이 가장 높은 것 선택
    const highConfidenceStats = stats.filter(s => s.confidence > 0.1);
    
    if (highConfidenceStats.length > 0) {
      return highConfidenceStats.reduce((best, current) => 
        current.conversionRate > best.conversionRate ? current : best
      ).variant;
    }
    
    // 신뢰도가 낮으면 노출 수가 많은 변형 선택
    return stats.reduce((best, current) => 
      current.exposures > best.exposures ? current : best
    ).variant;
  }

  // 실험 조회
  static async getExperiment(experimentId: string): Promise<Experiment | null> {
    const doc = await db.collection('experiments').doc(experimentId).get();
    
    if (!doc.exists) return null;
    
    return doc.data() as Experiment;
  }

  // 실험 목록 조회
  static async listExperiments(): Promise<Experiment[]> {
    const snap = await db.collection('experiments').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Experiment));
  }

  // 실험 상태 업데이트
  static async updateExperimentStatus(
    experimentId: string,
    status: 'active' | 'paused' | 'completed'
  ): Promise<void> {
    await db.collection('experiments').doc(experimentId).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // 실험 결과 분석
  static async analyzeExperiment(experimentId: string): Promise<{
    experiment: Experiment;
    stats: VariantStats[];
    winner: string | null;
    significance: boolean;
    recommendation: string;
  }> {
    const experiment = await this.getExperiment(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    const stats = await this.getVariantStats(experimentId);
    const winner = this.getBestVariant(stats);
    
    // 통계적 유의성 검정 (간단한 버전)
    const significance = this.isSignificant(stats);
    
    let recommendation = '';
    if (winner && significance) {
      recommendation = `변형 '${winner}'이 통계적으로 유의하게 더 좋은 성능을 보입니다.`;
    } else if (winner) {
      recommendation = `변형 '${winner}'이 더 좋은 성능을 보이지만 통계적 유의성은 부족합니다. 더 많은 데이터가 필요합니다.`;
    } else {
      recommendation = '충분한 데이터가 없어 명확한 결론을 내릴 수 없습니다.';
    }

    return {
      experiment,
      stats,
      winner,
      significance,
      recommendation
    };
  }

  // 통계적 유의성 검정
  private static isSignificant(stats: VariantStats[]): boolean {
    if (stats.length < 2) return false;
    
    // 간단한 검정: 최고 성능 변형의 신뢰도가 0.8 이상이고
    // 다른 변형들과의 차이가 명확한 경우
    const sortedStats = stats.sort((a, b) => b.conversionRate - a.conversionRate);
    const best = sortedStats[0];
    const second = sortedStats[1];
    
    return best.confidence > 0.8 && 
           best.conversionRate > second.conversionRate * 1.1; // 10% 이상 차이
  }

  // 자동 최적화 워커 (주기적으로 ε 값 조정)
  static async optimizeExperiments(): Promise<void> {
    const experiments = await this.listExperiments();
    
    for (const experiment of experiments) {
      if (experiment.status !== 'active') continue;
      
      const stats = await this.getVariantStats(experiment.id);
      const newEpsilon = this.calculateOptimalEpsilon(stats);
      
      if (Math.abs(newEpsilon - experiment.epsilon) > 0.05) {
        await db.collection('experiments').doc(experiment.id).update({
          epsilon: newEpsilon,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  }

  // 최적 ε 값 계산
  private static calculateOptimalEpsilon(stats: VariantStats[]): number {
    if (stats.length < 2) return 0.1;
    
    const totalExposures = stats.reduce((sum, s) => sum + s.exposures, 0);
    const avgConfidence = stats.reduce((sum, s) => sum + s.confidence, 0) / stats.length;
    
    // 데이터가 충분하면 탐험 비율을 줄이고, 부족하면 늘림
    if (totalExposures > 1000 && avgConfidence > 0.7) {
      return Math.max(0.05, 0.1 * (1 - avgConfidence)); // 최소 5%
    } else if (totalExposures < 100) {
      return Math.min(0.3, 0.1 + (100 - totalExposures) / 1000); // 최대 30%
    }
    
    return 0.1; // 기본값
  }
}

export default {
  ABTestingManager
};
