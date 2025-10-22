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
exports.AutoThrottleTuner = void 0;
// 자동 스로틀 튜너 모듈
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
class AutoThrottleTuner {
    // 스로틀 메트릭 기록
    static async recordMetrics(metrics) {
        await db.collection('throttle_metrics').add({
            ...metrics,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    // 채널별 스로틀 설정 조회
    static async getThrottleConfig(channel) {
        const doc = await db.collection('throttle_config').doc(channel).get();
        if (!doc.exists)
            return null;
        return doc.data();
    }
    // 채널별 스로틀 설정 저장
    static async setThrottleConfig(config) {
        await db.collection('throttle_config').doc(config.channel).set({
            ...config,
            lastTuned: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
    // 자동 튜닝 실행
    static async tuneAllChannels() {
        const channelsSnap = await db.collection('throttle_config').get();
        let tuned = 0;
        let skipped = 0;
        const errors = [];
        for (const channelDoc of channelsSnap.docs) {
            try {
                const config = channelDoc.data();
                const shouldTune = await this.shouldTuneChannel(config.channel);
                if (shouldTune) {
                    await this.tuneChannel(config.channel);
                    tuned++;
                }
                else {
                    skipped++;
                }
            }
            catch (error) {
                errors.push(`Channel ${channelDoc.id}: ${error}`);
            }
        }
        return { tuned, skipped, errors };
    }
    // 채널 튜닝 필요성 확인
    static async shouldTuneChannel(channel) {
        const config = await this.getThrottleConfig(channel);
        if (!config)
            return false;
        // 마지막 튜닝으로부터 1시간 이상 경과했는지 확인
        const lastTuned = config.lastTuned.toMillis();
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (lastTuned > oneHourAgo)
            return false;
        // 최근 메트릭 분석
        const recentMetrics = await this.getRecentMetrics(channel, 1); // 1시간
        if (recentMetrics.length === 0)
            return false;
        const avgMetrics = this.calculateAverageMetrics(recentMetrics);
        // 튜닝이 필요한 조건들
        const needsTuning = avgMetrics.rateLimitHits > 5 || // 5회 이상 429 에러
            avgMetrics.avgLatency > 2000 || // 평균 지연시간 2초 이상
            avgMetrics.queueLength > 10 || // 큐 길이 10개 이상
            avgMetrics.successRate < 0.95; // 성공률 95% 미만
        return needsTuning;
    }
    // 채널 튜닝 실행
    static async tuneChannel(channel) {
        const config = await this.getThrottleConfig(channel);
        if (!config) {
            throw new Error(`No throttle config found for channel: ${channel}`);
        }
        const recentMetrics = await this.getRecentMetrics(channel, 1);
        const avgMetrics = this.calculateAverageMetrics(recentMetrics);
        const tuning = this.calculateOptimalThrottle(config, avgMetrics);
        // 새로운 설정 저장
        const newConfig = {
            ...config,
            capacity: tuning.capacity,
            refillPerSec: tuning.refillPerSec,
            lastTuned: admin.firestore.FieldValue.serverTimestamp(),
            tuningHistory: [
                ...(config.tuningHistory || []).slice(-9), // 최근 10개만 유지
                {
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    capacity: tuning.capacity,
                    refillPerSec: tuning.refillPerSec,
                    reason: tuning.reason,
                    metrics: avgMetrics
                }
            ]
        };
        await this.setThrottleConfig(newConfig);
        return {
            oldCapacity: config.capacity,
            newCapacity: tuning.capacity,
            oldRefillPerSec: config.refillPerSec,
            newRefillPerSec: tuning.refillPerSec,
            reason: tuning.reason
        };
    }
    // 최적 스로틀 설정 계산
    static calculateOptimalThrottle(currentConfig, metrics) {
        let capacity = currentConfig.capacity;
        let refillPerSec = currentConfig.refillPerSec;
        let reason = '';
        // 429 에러가 많으면 capacity 증가
        if (metrics.rateLimitHits > 10) {
            capacity = Math.min(50, capacity * 1.5);
            reason += 'High rate limit hits, increased capacity. ';
        }
        else if (metrics.rateLimitHits < 2 && capacity > 5) {
            capacity = Math.max(5, capacity * 0.8);
            reason += 'Low rate limit hits, decreased capacity. ';
        }
        // 큐 길이가 길면 refill rate 증가
        if (metrics.queueLength > 20) {
            refillPerSec = Math.min(10, refillPerSec * 1.5);
            reason += 'Long queue, increased refill rate. ';
        }
        else if (metrics.queueLength < 2 && refillPerSec > 0.5) {
            refillPerSec = Math.max(0.5, refillPerSec * 0.8);
            reason += 'Short queue, decreased refill rate. ';
        }
        // 지연시간이 높으면 refill rate 증가
        if (metrics.avgLatency > 3000) {
            refillPerSec = Math.min(10, refillPerSec * 1.2);
            reason += 'High latency, increased refill rate. ';
        }
        // 성공률이 낮으면 capacity 감소
        if (metrics.successRate < 0.9) {
            capacity = Math.max(3, capacity * 0.7);
            reason += 'Low success rate, decreased capacity. ';
        }
        // 처리량이 높으면 capacity 증가
        if (metrics.throughput > 100) {
            capacity = Math.min(50, capacity * 1.2);
            reason += 'High throughput, increased capacity. ';
        }
        // 기본값으로 초기화
        if (!reason) {
            reason = 'No significant issues detected, minor adjustments.';
        }
        return {
            capacity: Math.round(capacity * 10) / 10, // 소수점 1자리
            refillPerSec: Math.round(refillPerSec * 10) / 10,
            reason: reason.trim()
        };
    }
    // 최근 메트릭 조회
    static async getRecentMetrics(channel, hours) {
        const windowStart = admin.firestore.Timestamp.fromMillis(Date.now() - (hours * 60 * 60 * 1000));
        const snap = await db.collection('throttle_metrics')
            .where('channel', '==', channel)
            .where('timestamp', '>=', windowStart)
            .orderBy('timestamp', 'desc')
            .get();
        return snap.docs.map(doc => doc.data());
    }
    // 평균 메트릭 계산
    static calculateAverageMetrics(metrics) {
        if (metrics.length === 0) {
            return {
                rateLimitHits: 0,
                avgLatency: 0,
                queueLength: 0,
                successRate: 1,
                throughput: 0
            };
        }
        const total = metrics.reduce((sum, m) => ({
            rateLimitHits: sum.rateLimitHits + m.rateLimitHits,
            avgLatency: sum.avgLatency + m.avgLatency,
            queueLength: sum.queueLength + m.queueLength,
            successRate: sum.successRate + m.successRate,
            throughput: sum.throughput + m.throughput
        }), { rateLimitHits: 0, avgLatency: 0, queueLength: 0, successRate: 0, throughput: 0 });
        const count = metrics.length;
        return {
            rateLimitHits: total.rateLimitHits / count,
            avgLatency: total.avgLatency / count,
            queueLength: total.queueLength / count,
            successRate: total.successRate / count,
            throughput: total.throughput / count
        };
    }
    // 스로틀 튜닝 히스토리 조회
    static async getTuningHistory(channel) {
        const config = await this.getThrottleConfig(channel);
        return config?.tuningHistory || [];
    }
    // 스로틀 성능 리포트
    static async getThrottleReport(channel, days = 7) {
        const config = await this.getThrottleConfig(channel);
        if (!config) {
            throw new Error(`No throttle config found for channel: ${channel}`);
        }
        const metrics = await this.getRecentMetrics(channel, days * 24);
        const avgPerformance = this.calculateAverageMetrics(metrics);
        const tuningHistory = (config.tuningHistory || []).map(tuning => ({
            date: tuning.timestamp.toDate().toISOString().split('T')[0],
            capacity: tuning.capacity,
            refillPerSec: tuning.refillPerSec,
            reason: tuning.reason
        }));
        const recommendations = [];
        if (avgPerformance.rateLimitHits > 5) {
            recommendations.push('Rate limit hits가 높습니다. capacity를 더 증가시키거나 refill rate를 조정하세요.');
        }
        if (avgPerformance.avgLatency > 2000) {
            recommendations.push('평균 지연시간이 높습니다. refill rate를 증가시키거나 capacity를 조정하세요.');
        }
        if (avgPerformance.queueLength > 10) {
            recommendations.push('큐 길이가 길어집니다. refill rate를 증가시키세요.');
        }
        if (avgPerformance.successRate < 0.95) {
            recommendations.push('성공률이 낮습니다. capacity를 감소시키거나 에러 처리를 개선하세요.');
        }
        return {
            channel,
            period: `${days} days`,
            currentConfig: {
                capacity: config.capacity,
                refillPerSec: config.refillPerSec
            },
            performance: avgPerformance,
            tuningHistory,
            recommendations
        };
    }
    // 긴급 스로틀 조정 (수동)
    static async emergencyThrottleAdjustment(channel, capacity, refillPerSec, reason) {
        const config = await this.getThrottleConfig(channel);
        if (!config) {
            throw new Error(`No throttle config found for channel: ${channel}`);
        }
        const newConfig = {
            ...config,
            capacity,
            refillPerSec,
            lastTuned: admin.firestore.FieldValue.serverTimestamp(),
            tuningHistory: [
                ...(config.tuningHistory || []).slice(-9),
                {
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    capacity,
                    refillPerSec,
                    reason: `EMERGENCY: ${reason}`,
                    metrics: {
                        rateLimitHits: 0,
                        avgLatency: 0,
                        queueLength: 0
                    }
                }
            ]
        };
        await this.setThrottleConfig(newConfig);
    }
    // 오래된 메트릭 정리
    static async cleanupOldMetrics(daysToKeep = 30) {
        const cutoffTime = admin.firestore.Timestamp.fromMillis(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
        const oldMetricsSnap = await db.collection('throttle_metrics')
            .where('timestamp', '<', cutoffTime)
            .limit(1000)
            .get();
        if (oldMetricsSnap.empty)
            return 0;
        const batch = db.batch();
        let deleted = 0;
        oldMetricsSnap.docs.forEach(doc => {
            batch.delete(doc.ref);
            deleted++;
        });
        await batch.commit();
        return deleted;
    }
}
exports.AutoThrottleTuner = AutoThrottleTuner;
exports.default = {
    AutoThrottleTuner
};
