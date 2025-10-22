import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { tryHit } from '../lib/ratelimit';
import { logAuditEvent, logSecurityEvent } from '../lib/audit';

export type ReportType = 'spam' | 'inappropriate' | 'fraud' | 'harassment' | 'other';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

/**
 * 신고 생성
 */
export const createReport = onCall({
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new Error('UNAUTHENTICATED');
  }

  const { 
    targetType, 
    targetId, 
    reason, 
    description,
    evidence 
  } = req.data as {
    targetType: 'market' | 'user' | 'post' | 'comment';
    targetId: string;
    reason: ReportType;
    description?: string;
    evidence?: string[];
  };

  // 레이트 리미트 체크
  const rateLimitKey = `report:${uid}:${targetType}:${targetId}`;
  if (!tryHit(rateLimitKey, 1, 10_000)) { // 10초 내 1회만
    throw new Error('RATE_LIMIT_EXCEEDED');
  }

  try {
    const db = admin.firestore();
    
    // 중복 신고 체크
    const existingReport = await db.collection('reports')
      .where('reporterId', '==', uid)
      .where('targetType', '==', targetType)
      .where('targetId', '==', targetId)
      .where('status', 'in', ['pending', 'reviewing'])
      .get();
    
    if (!existingReport.empty) {
      throw new Error('DUPLICATE_REPORT');
    }
    
    const reportData = {
      reporterId: uid,
      targetType,
      targetId,
      reason,
      description: description || '',
      evidence: evidence || [],
      status: 'pending' as ReportStatus,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const reportRef = await db.collection('reports').add(reportData);
    
    // 모더레이션 큐에 추가
    await db.collection('moderation').add({
      reportId: reportRef.id,
      targetType,
      targetId,
      priority: getReportPriority(reason),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    });
    
    await logSecurityEvent('report_created', uid, {
      targetType,
      targetId,
      reason,
      reportId: reportRef.id
    });
    
    return { success: true, reportId: reportRef.id };
  } catch (error) {
    await logAuditEvent('report_creation_failed', uid, {
      targetType,
      targetId,
      reason,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 신고 처리 (관리자/모더레이터만)
 */
export const processReport = onCall({
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new Error('UNAUTHENTICATED');
  }

  const { 
    reportId, 
    action, 
    reason,
    targetAction 
  } = req.data as {
    reportId: string;
    action: 'approve' | 'dismiss';
    reason?: string;
    targetAction?: 'warn' | 'suspend' | 'delete' | 'none';
  };

  // 관리자/모더레이터 권한 확인
  const userRole = req.auth?.token?.role;
  if (userRole !== 'admin' && userRole !== 'moderator') {
    throw new Error('PERMISSION_DENIED');
  }

  try {
    const db = admin.firestore();
    
    await db.runTransaction(async (transaction) => {
      const reportRef = db.doc(`reports/${reportId}`);
      const reportDoc = await transaction.get(reportRef);
      
      if (!reportDoc.exists) {
        throw new Error('REPORT_NOT_FOUND');
      }
      
      const reportData = reportDoc.data()!;
      if (reportData.status !== 'pending' && reportData.status !== 'reviewing') {
        throw new Error('REPORT_ALREADY_PROCESSED');
      }
      
      // 신고 상태 업데이트
      const newStatus = action === 'approve' ? 'resolved' : 'dismissed';
      transaction.update(reportRef, {
        status: newStatus,
        processedBy: uid,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        action,
        reason: reason || '',
        targetAction: targetAction || 'none'
      });
      
      // 대상에 대한 조치 실행
      if (action === 'approve' && targetAction && targetAction !== 'none') {
        await executeTargetAction(
          transaction,
          reportData.targetType,
          reportData.targetId,
          targetAction,
          reason || ''
        );
      }
    });
    
    await logSecurityEvent('report_processed', uid, {
      reportId,
      action,
      targetAction
    });
    
    return { success: true };
  } catch (error) {
    await logAuditEvent('report_processing_failed', uid, {
      reportId,
      action,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 신고 목록 조회 (관리자/모더레이터만)
 */
export const getReports = onCall({
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new Error('UNAUTHENTICATED');
  }

  const userRole = req.auth?.token?.role;
  if (userRole !== 'admin' && userRole !== 'moderator') {
    throw new Error('PERMISSION_DENIED');
  }

  const { 
    status = 'pending',
    limit = 20,
    startAfter
  } = req.data as {
    status?: ReportStatus;
    limit?: number;
    startAfter?: string;
  };

  try {
    const db = admin.firestore();
    let queryRef = db.collection('reports')
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .limit(limit);
    
    if (startAfter) {
      const startDoc = await db.doc(`reports/${startAfter}`).get();
      queryRef = queryRef.startAfter(startDoc);
    }
    
    const snapshot = await queryRef.get();
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      reports,
      hasMore: snapshot.docs.length === limit
    };
  } catch (error) {
    await logAuditEvent('reports_fetch_failed', uid, {
      status,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 사용자 신고 내역 조회
 */
export const getUserReports = onCall({
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new Error('UNAUTHENTICATED');
  }

  const { limit = 20, startAfter } = req.data as {
    limit?: number;
    startAfter?: string;
  };

  try {
    const db = admin.firestore();
    let queryRef = db.collection('reports')
      .where('reporterId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limit);
    
    if (startAfter) {
      const startDoc = await db.doc(`reports/${startAfter}`).get();
      queryRef = queryRef.startAfter(startDoc);
    }
    
    const snapshot = await queryRef.get();
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      reports,
      hasMore: snapshot.docs.length === limit
    };
  } catch (error) {
    await logAuditEvent('user_reports_fetch_failed', uid, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 신고 우선순위 결정
 */
function getReportPriority(reason: ReportType): 'high' | 'medium' | 'low' {
  const highPriorityReasons: ReportType[] = ['fraud', 'harassment'];
  const mediumPriorityReasons: ReportType[] = ['inappropriate'];
  
  if (highPriorityReasons.includes(reason)) return 'high';
  if (mediumPriorityReasons.includes(reason)) return 'medium';
  return 'low';
}

/**
 * 대상에 대한 조치 실행
 */
async function executeTargetAction(
  transaction: FirebaseFirestore.Transaction,
  targetType: string,
  targetId: string,
  action: string,
  reason: string
): Promise<void> {
  const db = admin.firestore();
  
  switch (targetType) {
    case 'market':
      const marketRef = db.doc(`market/${targetId}`);
      if (action === 'delete') {
        transaction.update(marketRef, {
          state: 'closed',
          reason: `Reported and ${action}: ${reason}`,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else if (action === 'warn') {
        transaction.update(marketRef, {
          warning: reason,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      break;
      
    case 'user':
      const userRef = db.doc(`users/${targetId}`);
      if (action === 'suspend') {
        transaction.update(userRef, {
          status: 'suspended',
          suspensionReason: reason,
          suspendedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else if (action === 'warn') {
        transaction.update(userRef, {
          warning: reason,
          warnedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      break;
      
    case 'post':
    case 'comment':
      const postRef = db.doc(`${targetType}s/${targetId}`);
      if (action === 'delete') {
        transaction.update(postRef, {
          status: 'deleted',
          deleteReason: reason,
          deletedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else if (action === 'warn') {
        transaction.update(postRef, {
          warning: reason,
          warnedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      break;
  }
}
