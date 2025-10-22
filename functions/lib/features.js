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
exports.FeatureManager = void 0;
exports.initializeDefaultFeatures = initializeDefaultFeatures;
exports.isFeatureEnabled = isFeatureEnabled;
// Feature Flags 관리 모듈
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
class FeatureManager {
    // Feature Flag 조회
    static async getFeature(name, teamId, locale, environment) {
        // 캐시 확인
        const cached = this.cache.get(name);
        const expiry = this.cacheExpiry.get(name);
        if (cached && expiry && Date.now() < expiry) {
            return this.evaluateFeature(cached, teamId, locale, environment);
        }
        // Firestore에서 조회
        const doc = await db.collection('features').doc(name).get();
        if (!doc.exists) {
            return false; // 기본값
        }
        const feature = doc.data();
        // 캐시에 저장
        this.cache.set(name, feature);
        this.cacheExpiry.set(name, Date.now() + this.CACHE_TTL);
        return this.evaluateFeature(feature, teamId, locale, environment);
    }
    // Feature Flag 설정
    static async setFeature(feature) {
        const now = admin.firestore.FieldValue.serverTimestamp();
        await db.collection('features').doc(feature.name).set({
            ...feature,
            createdAt: now,
            updatedAt: now
        }, { merge: true });
        // 캐시 업데이트
        this.cache.set(feature.name, {
            ...feature,
            createdAt: now,
            updatedAt: now
        });
        this.cacheExpiry.set(feature.name, Date.now() + this.CACHE_TTL);
    }
    // Feature Flag 삭제
    static async deleteFeature(name) {
        await db.collection('features').doc(name).delete();
        // 캐시에서 제거
        this.cache.delete(name);
        this.cacheExpiry.delete(name);
    }
    // 모든 Feature Flag 조회
    static async listFeatures() {
        const snap = await db.collection('features').get();
        return snap.docs.map(doc => doc.data());
    }
    // Feature Flag 평가
    static evaluateFeature(feature, teamId, locale, environment) {
        if (!feature.enabled) {
            return false;
        }
        // 조건 확인
        if (feature.conditions) {
            const { teamId: allowedTeams, locale: allowedLocales, environment: allowedEnvironments } = feature.conditions;
            if (allowedTeams && teamId && !allowedTeams.includes(teamId)) {
                return false;
            }
            if (allowedLocales && locale && !allowedLocales.includes(locale)) {
                return false;
            }
            if (allowedEnvironments && environment && !allowedEnvironments.includes(environment)) {
                return false;
            }
        }
        return true;
    }
    // 캐시 클리어
    static clearCache() {
        this.cache.clear();
        this.cacheExpiry.clear();
    }
}
exports.FeatureManager = FeatureManager;
FeatureManager.cache = new Map();
FeatureManager.cacheExpiry = new Map();
FeatureManager.CACHE_TTL = 5 * 60 * 1000; // 5분
// 기본 Feature Flags 초기화
async function initializeDefaultFeatures() {
    const defaultFeatures = [
        {
            name: 'dm_notifications',
            enabled: true,
            description: 'DM 알림 기능',
            defaultValue: true
        },
        {
            name: 'experiments',
            enabled: false,
            description: 'A/B 테스트 실험 기능',
            defaultValue: false
        },
        {
            name: 'analytics',
            enabled: true,
            description: '분석 및 CTR 측정 기능',
            defaultValue: true
        },
        {
            name: 'multi_workspace',
            enabled: true,
            description: '멀티워크스페이스 지원',
            defaultValue: true
        },
        {
            name: 'i18n',
            enabled: true,
            description: '다국어 지원',
            defaultValue: true
        },
        {
            name: 'auto_resubmit',
            enabled: true,
            description: '자동 재상신 기능',
            defaultValue: true
        },
        {
            name: 'expiry_warnings',
            enabled: true,
            description: '만료 경고 기능',
            defaultValue: true
        },
        {
            name: 'ops_alerts',
            enabled: true,
            description: '운영 경보 기능',
            defaultValue: true
        }
    ];
    for (const feature of defaultFeatures) {
        const existing = await db.collection('features').doc(feature.name).get();
        if (!existing.exists) {
            await FeatureManager.setFeature(feature);
        }
    }
}
// Feature Flag 체크 헬퍼
async function isFeatureEnabled(name, teamId, locale, environment) {
    return await FeatureManager.getFeature(name, teamId, locale, environment);
}
exports.default = {
    FeatureManager,
    initializeDefaultFeatures,
    isFeatureEnabled
};
