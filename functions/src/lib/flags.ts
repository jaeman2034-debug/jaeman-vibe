import * as admin from 'firebase-admin';

let cache: { data: any | null; ts: number } = { data: null, ts: 0 };

/**
 * Runtime Feature Flags 조회 (60초 캐시)
 */
export async function getFlags() {
  const fresh = Date.now() - cache.ts < 60_000;
  if (fresh && cache.data) return cache.data;
  
  try {
    const snap = await admin.firestore().doc('config/runtime').get();
    cache = { data: snap.data() || {}, ts: Date.now() };
    return cache.data;
  } catch (error) {
    console.error('Failed to fetch flags:', error);
    return cache.data || {};
  }
}

/**
 * 특정 기능이 활성화되어 있는지 확인
 */
export async function isEnabled(key: string): Promise<boolean> {
  const flags = await getFlags();
  return !!flags[key];
}

/**
 * 기능이 비활성화되어 있으면 에러 발생
 */
export async function ensureEnabled(key: string) {
  const enabled = await isEnabled(key);
  if (!enabled) {
    throw new Error(`FEATURE_DISABLED:${key}`);
  }
}

/**
 * 개인별 실험 기능 확인
 */
export async function isUserEnabled(feature: string, uid: string): Promise<boolean> {
  try {
    const doc = await admin.firestore().doc(`experiments/${feature}/allowlist/${uid}`).get();
    return doc.exists;
  } catch (error) {
    console.error(`Failed to check user experiment ${feature} for ${uid}:`, error);
    return false;
  }
}

/**
 * 사용자별 기능 활성화 (관리자 전용)
 */
export async function grantUserFeature(feature: string, uid: string, grantedBy: string) {
  await admin.firestore().doc(`experiments/${feature}/allowlist/${uid}`).set({
    grantedAt: admin.firestore.FieldValue.serverTimestamp(),
    grantedBy
  });
}

/**
 * 사용자별 기능 비활성화 (관리자 전용)
 */
export async function revokeUserFeature(feature: string, uid: string) {
  await admin.firestore().doc(`experiments/${feature}/allowlist/${uid}`).delete();
}

/**
 * 플래그 업데이트 (관리자 전용)
 */
export async function updateFlag(key: string, value: any, updatedBy: string) {
  await admin.firestore().doc('config/runtime').set({
    [key]: value,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy
  }, { merge: true });
  
  // 캐시 무효화
  cache = { data: null, ts: 0 };
}
