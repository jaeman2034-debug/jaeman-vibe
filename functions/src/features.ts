// Feature Flags 관리 모듈
import * as admin from 'firebase-admin';

const db = admin.firestore();

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

export class FeatureManager {
  private static cache = new Map<string, FeatureFlag>();
  private static cacheExpiry = new Map<string, number>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5분

  // Feature Flag 조회
  static async getFeature(name: string, teamId?: string, locale?: string, environment?: string): Promise<boolean> {
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

    const feature = doc.data() as FeatureFlag;
    
    // 캐시에 저장
    this.cache.set(name, feature);
    this.cacheExpiry.set(name, Date.now() + this.CACHE_TTL);
    
    return this.evaluateFeature(feature, teamId, locale, environment);
  }

  // Feature Flag 설정
  static async setFeature(feature: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = admin.firestore.FieldValue.serverTimestamp();
    
    await db.collection('features').doc(feature.name).set({
      ...feature,
      createdAt: now,
      updatedAt: now
    }, { merge: true });

    // 캐시 업데이트
    this.cache.set(feature.name, {
      ...feature,
      createdAt: now as admin.firestore.Timestamp,
      updatedAt: now as admin.firestore.Timestamp
    });
    this.cacheExpiry.set(feature.name, Date.now() + this.CACHE_TTL);
  }

  // Feature Flag 삭제
  static async deleteFeature(name: string): Promise<void> {
    await db.collection('features').doc(name).delete();
    
    // 캐시에서 제거
    this.cache.delete(name);
    this.cacheExpiry.delete(name);
  }

  // 모든 Feature Flag 조회
  static async listFeatures(): Promise<FeatureFlag[]> {
    const snap = await db.collection('features').get();
    return snap.docs.map(doc => doc.data() as FeatureFlag);
  }

  // Feature Flag 평가
  private static evaluateFeature(feature: FeatureFlag, teamId?: string, locale?: string, environment?: string): boolean {
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
  static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

// 기본 Feature Flags 초기화
export async function initializeDefaultFeatures(): Promise<void> {
  const defaultFeatures: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>[] = [
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
export async function isFeatureEnabled(name: string, teamId?: string, locale?: string, environment?: string): Promise<boolean> {
  return await FeatureManager.getFeature(name, teamId, locale, environment);
}

export default {
  FeatureManager,
  initializeDefaultFeatures,
  isFeatureEnabled
};
