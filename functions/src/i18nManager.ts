// i18n 키/문구 관리 모듈
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface I18nKey {
  key: string;
  locale: string;
  value: string;
  description?: string;
  category?: string;
  variables?: string[]; // 사용되는 변수들
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  createdBy?: string;
  updatedBy?: string;
}

interface I18nCache {
  [locale: string]: {
    [key: string]: string;
  };
}

export class I18nManager {
  private static cache: I18nCache = {};
  private static cacheExpiry = new Map<string, number>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5분

  // 키 조회 (캐시 우선)
  static async getKey(key: string, locale: string): Promise<string> {
    // 캐시 확인
    if (this.cache[locale] && this.cache[locale][key]) {
      return this.cache[locale][key];
    }

    // Firestore에서 조회
    const doc = await db.collection('i18n').doc(`${locale}:${key}`).get();
    
    if (!doc.exists) {
      // 키가 없으면 기본값 반환
      return key;
    }

    const data = doc.data() as I18nKey;
    
    // 캐시에 저장
    if (!this.cache[locale]) {
      this.cache[locale] = {};
    }
    this.cache[locale][key] = data.value;

    return data.value;
  }

  // 키 설정
  static async setKey(
    key: string,
    locale: string,
    value: string,
    description?: string,
    category?: string,
    variables?: string[],
    userId?: string
  ): Promise<void> {
    const now = admin.firestore.FieldValue.serverTimestamp();
    
    await db.collection('i18n').doc(`${locale}:${key}`).set({
      key,
      locale,
      value,
      description: description || null,
      category: category || 'general',
      variables: variables || [],
      createdAt: now,
      updatedAt: now,
      createdBy: userId || null,
      updatedBy: userId || null
    }, { merge: true });

    // 캐시 업데이트
    if (!this.cache[locale]) {
      this.cache[locale] = {};
    }
    this.cache[locale][key] = value;
  }

  // 키 삭제
  static async deleteKey(key: string, locale: string): Promise<void> {
    await db.collection('i18n').doc(`${locale}:${key}`).delete();
    
    // 캐시에서 제거
    if (this.cache[locale]) {
      delete this.cache[locale][key];
    }
  }

  // 로케일별 모든 키 조회
  static async getKeysByLocale(locale: string): Promise<I18nKey[]> {
    const snap = await db.collection('i18n')
      .where('locale', '==', locale)
      .orderBy('key')
      .get();
    
    return snap.docs.map(doc => doc.data() as I18nKey);
  }

  // 키로 검색 (모든 로케일)
  static async searchKeys(keyPattern: string): Promise<I18nKey[]> {
    const snap = await db.collection('i18n')
      .where('key', '>=', keyPattern)
      .where('key', '<=', keyPattern + '\uf8ff')
      .get();
    
    return snap.docs.map(doc => doc.data() as I18nKey);
  }

  // 카테고리별 키 조회
  static async getKeysByCategory(category: string, locale?: string): Promise<I18nKey[]> {
    let query = db.collection('i18n').where('category', '==', category);
    
    if (locale) {
      query = query.where('locale', '==', locale);
    }
    
    const snap = await query.get();
    return snap.docs.map(doc => doc.data() as I18nKey);
  }

  // 번역 상태 확인
  static async getTranslationStatus(): Promise<{
    [key: string]: {
      [locale: string]: boolean;
    };
  }> {
    const snap = await db.collection('i18n').get();
    const status: { [key: string]: { [locale: string]: boolean } } = {};
    
    snap.docs.forEach(doc => {
      const data = doc.data() as I18nKey;
      const key = data.key;
      const locale = data.locale;
      
      if (!status[key]) {
        status[key] = {};
      }
      status[key][locale] = true;
    });
    
    return status;
  }

  // 누락된 번역 찾기
  static async findMissingTranslations(): Promise<{
    key: string;
    missingLocales: string[];
  }[]> {
    const status = await this.getTranslationStatus();
    const allLocales = new Set<string>();
    
    // 모든 로케일 수집
    Object.values(status).forEach(locales => {
      Object.keys(locales).forEach(locale => allLocales.add(locale));
    });
    
    const missing: { key: string; missingLocales: string[] }[] = [];
    
    Object.keys(status).forEach(key => {
      const missingLocales = Array.from(allLocales).filter(
        locale => !status[key][locale]
      );
      
      if (missingLocales.length > 0) {
        missing.push({ key, missingLocales });
      }
    });
    
    return missing;
  }

  // 변수 추출 (문자열에서 {variable} 패턴 찾기)
  static extractVariables(text: string): string[] {
    const matches = text.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    
    return matches.map(match => match.slice(1, -1)); // {variable} -> variable
  }

  // 번역 일괄 가져오기
  static async bulkImport(
    translations: Array<{
      key: string;
      locale: string;
      value: string;
      description?: string;
      category?: string;
    }>,
    userId?: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (const translation of translations) {
      try {
        const variables = this.extractVariables(translation.value);
        
        await this.setKey(
          translation.key,
          translation.locale,
          translation.value,
          translation.description,
          translation.category,
          variables,
          userId
        );
        
        success++;
      } catch (error) {
        failed++;
        errors.push(`${translation.key}:${translation.locale} - ${error}`);
      }
    }
    
    return { success, failed, errors };
  }

  // 번역 내보내기
  static async exportTranslations(locale?: string): Promise<{
    [locale: string]: {
      [key: string]: string;
    };
  }> {
    let query = db.collection('i18n');
    
    if (locale) {
      query = query.where('locale', '==', locale);
    }
    
    const snap = await query.get();
    const result: { [locale: string]: { [key: string]: string } } = {};
    
    snap.docs.forEach(doc => {
      const data = doc.data() as I18nKey;
      const loc = data.locale;
      const key = data.key;
      const value = data.value;
      
      if (!result[loc]) {
        result[loc] = {};
      }
      result[loc][key] = value;
    });
    
    return result;
  }

  // 캐시 클리어
  static clearCache(): void {
    this.cache = {};
    this.cacheExpiry.clear();
  }

  // 캐시 통계
  static getCacheStats(): {
    totalKeys: number;
    locales: string[];
    memoryUsage: number;
  } {
    const totalKeys = Object.values(this.cache).reduce(
      (sum, locale) => sum + Object.keys(locale).length,
      0
    );
    
    const locales = Object.keys(this.cache);
    
    // 대략적인 메모리 사용량 계산
    const memoryUsage = JSON.stringify(this.cache).length;
    
    return { totalKeys, locales, memoryUsage };
  }

  // 키 사용 통계
  static async getKeyUsageStats(): Promise<{
    [key: string]: {
      usageCount: number;
      lastUsed: admin.firestore.Timestamp | null;
    };
  }> {
    const snap = await db.collection('i18n_usage').get();
    const stats: { [key: string]: { usageCount: number; lastUsed: admin.firestore.Timestamp | null } } = {};
    
    snap.docs.forEach(doc => {
      const data = doc.data();
      const key = data.key;
      
      if (!stats[key]) {
        stats[key] = { usageCount: 0, lastUsed: null };
      }
      
      stats[key].usageCount += data.count || 1;
      if (data.lastUsed && (!stats[key].lastUsed || data.lastUsed > stats[key].lastUsed)) {
        stats[key].lastUsed = data.lastUsed;
      }
    });
    
    return stats;
  }

  // 키 사용 기록
  static async recordKeyUsage(key: string, locale: string): Promise<void> {
    const docId = `${key}:${locale}`;
    const now = admin.firestore.FieldValue.serverTimestamp();
    
    await db.collection('i18n_usage').doc(docId).set({
      key,
      locale,
      count: admin.firestore.FieldValue.increment(1),
      lastUsed: now
    }, { merge: true });
  }
}

export default {
  I18nManager
};
