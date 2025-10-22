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
exports.ABTestingManager = void 0;
// A/B/C 자동 최적화 (ε-greedy) 모듈
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
class ABTestingManager {
    // 실험 생성
    static async createExperiment(name, variants, epsilon = 0.1) {
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
    static async recordEvent(experimentId, variant, userId, event, metadata) {
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
    static async selectVariant(experimentId, userId) {
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
        }
        else {
            // 활용: 가장 좋은 성능의 변형 선택
            const bestVariant = this.getBestVariant(stats);
            return bestVariant || experiment.variants[0];
        }
    }
    // 변형 통계 조회
    static async getVariantStats(experimentId) {
        const eventsSnap = await db.collection('experiment_events')
            .where('experimentId', '==', experimentId)
            .get();
        const variantStats = new Map();
        eventsSnap.docs.forEach(doc => {
            const data = doc.data();
            const variant = data.variant;
            if (!variantStats.has(variant)) {
                variantStats.set(variant, { exposures: 0, conversions: 0, clicks: 0 });
            }
            const stats = variantStats.get(variant);
            if (data.event === 'exposure')
                stats.exposures++;
            else if (data.event === 'conversion')
                stats.conversions++;
            else if (data.event === 'click')
                stats.clicks++;
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
    static calculateConfidence(exposures, conversions) {
        if (exposures === 0)
            return 0;
        const p = conversions / exposures;
        const n = exposures;
        const z = 1.96; // 95% 신뢰구간
        const lower = (p + z * z / (2 * n) - z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)) / (1 + z * z / n);
        const upper = (p + z * z / (2 * n) + z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)) / (1 + z * z / n);
        return Math.max(0, upper - lower);
    }
    // 최고 성능 변형 선택
    static getBestVariant(stats) {
        if (stats.length === 0)
            return null;
        // 신뢰도가 높은 변형들 중에서 전환율이 가장 높은 것 선택
        const highConfidenceStats = stats.filter(s => s.confidence > 0.1);
        if (highConfidenceStats.length > 0) {
            return highConfidenceStats.reduce((best, current) => current.conversionRate > best.conversionRate ? current : best).variant;
        }
        // 신뢰도가 낮으면 노출 수가 많은 변형 선택
        return stats.reduce((best, current) => current.exposures > best.exposures ? current : best).variant;
    }
    // 실험 조회
    static async getExperiment(experimentId) {
        const doc = await db.collection('experiments').doc(experimentId).get();
        if (!doc.exists)
            return null;
        return doc.data();
    }
    // 실험 목록 조회
    static async listExperiments() {
        const snap = await db.collection('experiments').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    // 실험 상태 업데이트
    static async updateExperimentStatus(experimentId, status) {
        await db.collection('experiments').doc(experimentId).update({
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    // 실험 결과 분석
    static async analyzeExperiment(experimentId) {
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
        }
        else if (winner) {
            recommendation = `변형 '${winner}'이 더 좋은 성능을 보이지만 통계적 유의성은 부족합니다. 더 많은 데이터가 필요합니다.`;
        }
        else {
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
    static isSignificant(stats) {
        if (stats.length < 2)
            return false;
        // 간단한 검정: 최고 성능 변형의 신뢰도가 0.8 이상이고
        // 다른 변형들과의 차이가 명확한 경우
        const sortedStats = stats.sort((a, b) => b.conversionRate - a.conversionRate);
        const best = sortedStats[0];
        const second = sortedStats[1];
        return best.confidence > 0.8 &&
            best.conversionRate > second.conversionRate * 1.1; // 10% 이상 차이
    }
    // 자동 최적화 워커 (주기적으로 ε 값 조정)
    static async optimizeExperiments() {
        const experiments = await this.listExperiments();
        for (const experiment of experiments) {
            if (experiment.status !== 'active')
                continue;
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
    static calculateOptimalEpsilon(stats) {
        if (stats.length < 2)
            return 0.1;
        const totalExposures = stats.reduce((sum, s) => sum + s.exposures, 0);
        const avgConfidence = stats.reduce((sum, s) => sum + s.confidence, 0) / stats.length;
        // 데이터가 충분하면 탐험 비율을 줄이고, 부족하면 늘림
        if (totalExposures > 1000 && avgConfidence > 0.7) {
            return Math.max(0.05, 0.1 * (1 - avgConfidence)); // 최소 5%
        }
        else if (totalExposures < 100) {
            return Math.min(0.3, 0.1 + (100 - totalExposures) / 1000); // 최대 30%
        }
        return 0.1; // 기본값
    }
}
exports.ABTestingManager = ABTestingManager;
exports.default = {
    ABTestingManager
};
