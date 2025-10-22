import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { logAuditEvent } from '../lib/audit';

/**
 * 사용자에게 실험 기능 부여 (관리자 전용)
 */
export const grantFeature = onCall({ enforceAppCheck: true }, async (req) => {
  const role = req.auth?.token?.role;
  if (role !== 'admin') {
    throw new Error('PERMISSION_DENIED');
  }

  const { feature, uid } = req.data as { feature: string; uid: string };
  
  if (!feature || !uid) {
    throw new Error('MISSING_PARAMETERS');
  }

  try {
    await admin.firestore().doc(`experiments/${feature}/allowlist/${uid}`).set({
      grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      grantedBy: req.auth?.uid
    });

    await logAuditEvent('experiment_granted', req.auth?.uid, {
      feature,
      targetUid: uid
    });

    return { ok: true, feature, uid };
  } catch (error) {
    await logAuditEvent('experiment_grant_failed', req.auth?.uid, {
      feature,
      targetUid: uid,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 사용자 실험 기능 제거 (관리자 전용)
 */
export const revokeFeature = onCall({ enforceAppCheck: true }, async (req) => {
  const role = req.auth?.token?.role;
  if (role !== 'admin') {
    throw new Error('PERMISSION_DENIED');
  }

  const { feature, uid } = req.data as { feature: string; uid: string };
  
  if (!feature || !uid) {
    throw new Error('MISSING_PARAMETERS');
  }

  try {
    await admin.firestore().doc(`experiments/${feature}/allowlist/${uid}`).delete();

    await logAuditEvent('experiment_revoked', req.auth?.uid, {
      feature,
      targetUid: uid
    });

    return { ok: true, feature, uid };
  } catch (error) {
    await logAuditEvent('experiment_revoke_failed', req.auth?.uid, {
      feature,
      targetUid: uid,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 플래그 업데이트 (관리자 전용)
 */
export const updateFlag = onCall({ enforceAppCheck: true }, async (req) => {
  const role = req.auth?.token?.role;
  if (role !== 'admin') {
    throw new Error('PERMISSION_DENIED');
  }

  const { key, value } = req.data as { key: string; value: any };
  
  if (!key) {
    throw new Error('MISSING_KEY');
  }

  try {
    await admin.firestore().doc('config/runtime').set({
      [key]: value,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.auth?.uid
    }, { merge: true });

    await logAuditEvent('flag_updated', req.auth?.uid, {
      key,
      value
    });

    return { ok: true, key, value };
  } catch (error) {
    await logAuditEvent('flag_update_failed', req.auth?.uid, {
      key,
      value,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 모든 플래그 조회 (관리자 전용)
 */
export const getFlags = onCall({ enforceAppCheck: true }, async (req) => {
  const role = req.auth?.token?.role;
  if (role !== 'admin') {
    throw new Error('PERMISSION_DENIED');
  }

  try {
    const doc = await admin.firestore().doc('config/runtime').get();
    const flags = doc.exists ? doc.data() : {};

    return { ok: true, flags };
  } catch (error) {
    await logAuditEvent('flags_fetch_failed', req.auth?.uid, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 실험 참가자 목록 조회 (관리자 전용)
 */
export const getExperimentUsers = onCall({ enforceAppCheck: true }, async (req) => {
  const role = req.auth?.token?.role;
  if (role !== 'admin') {
    throw new Error('PERMISSION_DENIED');
  }

  const { feature } = req.data as { feature: string };
  
  if (!feature) {
    throw new Error('MISSING_FEATURE');
  }

  try {
    const snapshot = await admin.firestore()
      .collection(`experiments/${feature}/allowlist`)
      .get();
    
    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    return { ok: true, feature, users };
  } catch (error) {
    await logAuditEvent('experiment_users_fetch_failed', req.auth?.uid, {
      feature,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});
