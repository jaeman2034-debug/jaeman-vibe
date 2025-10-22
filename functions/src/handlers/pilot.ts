import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { logAuditEvent } from '../lib/audit';

/**
 * 파일럿 참가자 초대 (관리자 전용)
 */
export const pilotInvite = onCall({ enforceAppCheck: true }, async (req) => {
  const role = req.auth?.token?.role;
  if (role !== 'admin') {
    throw new Error('PERMISSION_DENIED');
  }

  const { uid, email, name } = req.data as { uid: string; email?: string; name?: string };
  
  if (!uid) {
    throw new Error('MISSING_UID');
  }

  try {
    // 파일럿 Allowlist에 추가
    await admin.firestore().doc(`pilot_allowlist/${uid}`).set({
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
      addedBy: req.auth?.uid,
      email: email || null,
      name: name || null
    });

    // 감사 로그
    await logAuditEvent('pilot_user_invited', req.auth?.uid, {
      targetUid: uid,
      email,
      name
    });

    return { ok: true, uid };
  } catch (error) {
    await logAuditEvent('pilot_invite_failed', req.auth?.uid, {
      targetUid: uid,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 파일럿 참가자 제거 (관리자 전용)
 */
export const pilotRemove = onCall({ enforceAppCheck: true }, async (req) => {
  const role = req.auth?.token?.role;
  if (role !== 'admin') {
    throw new Error('PERMISSION_DENIED');
  }

  const { uid } = req.data as { uid: string };
  
  if (!uid) {
    throw new Error('MISSING_UID');
  }

  try {
    // 파일럿 Allowlist에서 제거
    await admin.firestore().doc(`pilot_allowlist/${uid}`).delete();

    // 감사 로그
    await logAuditEvent('pilot_user_removed', req.auth?.uid, {
      targetUid: uid
    });

    return { ok: true, uid };
  } catch (error) {
    await logAuditEvent('pilot_remove_failed', req.auth?.uid, {
      targetUid: uid,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 파일럿 참가자 목록 조회 (관리자 전용)
 */
export const pilotList = onCall({ enforceAppCheck: true }, async (req) => {
  const role = req.auth?.token?.role;
  if (role !== 'admin') {
    throw new Error('PERMISSION_DENIED');
  }

  try {
    const snapshot = await admin.firestore().collection('pilot_allowlist').get();
    const participants = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    return { ok: true, participants };
  } catch (error) {
    await logAuditEvent('pilot_list_failed', req.auth?.uid, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 파일럿 상태 확인 (사용자 본인)
 */
export const pilotStatus = onCall({ enforceAppCheck: true }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new Error('UNAUTHENTICATED');
  }

  try {
    const doc = await admin.firestore().doc(`pilot_allowlist/${uid}`).get();
    const isParticipant = doc.exists;
    
    return { 
      ok: true, 
      isParticipant,
      participantData: isParticipant ? doc.data() : null
    };
  } catch (error) {
    await logAuditEvent('pilot_status_failed', uid, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});
