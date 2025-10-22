import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { setUserRole, isAdmin, requestAccountDeletion, getPendingDeletions, deleteUserAccount } from '../lib/auth';
import { logAuditEvent, logSecurityEvent } from '../lib/audit';

/**
 * 로그인 시간 업데이트 (재인증 후 호출)
 */
export const touchLogin = onCall({ 
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new Error('UNAUTHENTICATED');
  }

  try {
    const db = admin.firestore();
    await db.doc(`users/${uid}`).set(
      { lastLoginAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    
    await logAuditEvent('user_login_touched', uid);
    return { success: true };
  } catch (error) {
    await logAuditEvent('user_login_touch_failed', uid, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 사용자 역할 설정 (관리자만)
 */
export const setRole = onCall({ 
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const { uid, role } = req.data as { uid: string; role: string };
  const callerUid = req.auth?.uid;
  
  if (!callerUid) {
    throw new Error('UNAUTHENTICATED');
  }

  // 관리자 권한 확인
  const isCallerAdmin = await isAdmin(callerUid);
  if (!isCallerAdmin) {
    await logSecurityEvent('unauthorized_role_set_attempt', callerUid, { targetUid: uid, requestedRole: role });
    throw new Error('PERMISSION_DENIED');
  }

  // 유효한 역할인지 확인
  const validRoles = ['admin', 'moderator', 'user'];
  if (!validRoles.includes(role)) {
    throw new Error('INVALID_ROLE');
  }

  try {
    await setUserRole(uid, role);
    await logAuditEvent('user_role_set', callerUid, {
      targetUid: uid,
      newRole: role
    });
    
    return { success: true };
  } catch (error) {
    await logAuditEvent('user_role_set_failed', callerUid, {
      targetUid: uid,
      requestedRole: role,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 계정 삭제 요청
 */
export const requestDeletion = onCall({
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new Error('UNAUTHENTICATED');
  }

  try {
    await requestAccountDeletion(uid);
    await logAuditEvent('account_deletion_requested', uid);
    
    return { success: true, message: 'Account deletion requested. Your account will be deleted in 7 days.' };
  } catch (error) {
    await logAuditEvent('account_deletion_request_failed', uid, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 계정 삭제 요청 취소
 */
export const cancelDeletion = onCall({
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new Error('UNAUTHENTICATED');
  }

  try {
    const db = admin.firestore();
    await db.doc(`users/${uid}`).update({
      deleteRequestedAt: admin.firestore.FieldValue.delete(),
      status: 'active'
    });
    
    await logAuditEvent('account_deletion_cancelled', uid);
    return { success: true, message: 'Account deletion cancelled.' };
  } catch (error) {
    await logAuditEvent('account_deletion_cancel_failed', uid, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 사용자 프로필 업데이트
 */
export const updateProfile = onCall({
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new Error('UNAUTHENTICATED');
  }

  const { displayName, photoURL, bio } = req.data as {
    displayName?: string;
    photoURL?: string;
    bio?: string;
  };

  try {
    const db = admin.firestore();
    const userRef = db.doc(`users/${uid}`);
    
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (displayName !== undefined) updateData.displayName = displayName;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    if (bio !== undefined) updateData.bio = bio;
    
    await userRef.set(updateData, { merge: true });
    
    await logAuditEvent('user_profile_updated', uid, {
      fields: Object.keys(updateData)
    });
    
    return { success: true };
  } catch (error) {
    await logAuditEvent('user_profile_update_failed', uid, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 사용자 통계 조회
 */
export const getUserStats = onCall({
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new Error('UNAUTHENTICATED');
  }

  try {
    const db = admin.firestore();
    
    // 병렬로 통계 조회
    const [marketStats, offerStats, orderStats] = await Promise.all([
      // 판매한 상품 수
      db.collection('market').where('ownerId', '==', uid).get(),
      // 입찰한 상품 수
      db.collection('offers').where('bidderId', '==', uid).get(),
      // 주문한 상품 수
      db.collection('orders').where('uid', '==', uid).get()
    ]);

    return {
      success: true,
      stats: {
        itemsSold: marketStats.size,
        itemsBid: offerStats.size,
        itemsOrdered: orderStats.size
      }
    };
  } catch (error) {
    await logAuditEvent('user_stats_fetch_failed', uid, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 삭제 대기 중인 계정 정리 (매일 실행)
 */
export const purgeDeletedUsers = onSchedule({
  schedule: 'every 24 hours',
  region: 'asia-northeast3'
}, async () => {
  try {
    const pendingDeletions = await getPendingDeletions(7); // 7일 이상 된 계정들
    
    if (pendingDeletions.length === 0) {
      console.log('No accounts to purge');
      return;
    }

    console.log(`Purging ${pendingDeletions.length} accounts`);
    
    for (const uid of pendingDeletions) {
      try {
        await deleteUserAccount(uid);
        await logAuditEvent('account_purged', uid);
      } catch (error) {
        console.error(`Failed to purge account ${uid}:`, error);
        await logAuditEvent('account_purge_failed', uid, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log(`Successfully purged ${pendingDeletions.length} accounts`);
  } catch (error) {
    console.error('Error in purgeDeletedUsers:', error);
    await logAuditEvent('account_purge_batch_failed', undefined, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
