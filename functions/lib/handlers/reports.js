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
exports.getUserReports = exports.getReports = exports.processReport = exports.createReport = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const ratelimit_1 = require("../lib/ratelimit");
const audit_1 = require("../lib/audit");
/**
 * 신고 생성
 */
exports.createReport = (0, https_1.onCall)({
    enforceAppCheck: true,
    region: 'asia-northeast3'
}, async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
        throw new Error('UNAUTHENTICATED');
    }
    const { targetType, targetId, reason, description, evidence } = req.data;
    // 레이트 리미트 체크
    const rateLimitKey = `report:${uid}:${targetType}:${targetId}`;
    if (!(0, ratelimit_1.tryHit)(rateLimitKey, 1, 10000)) { // 10초 내 1회만
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
            status: 'pending',
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
        await (0, audit_1.logSecurityEvent)('report_created', uid, {
            targetType,
            targetId,
            reason,
            reportId: reportRef.id
        });
        return { success: true, reportId: reportRef.id };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('report_creation_failed', uid, {
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
exports.processReport = (0, https_1.onCall)({
    enforceAppCheck: true,
    region: 'asia-northeast3'
}, async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
        throw new Error('UNAUTHENTICATED');
    }
    const { reportId, action, reason, targetAction } = req.data;
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
            const reportData = reportDoc.data();
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
                await executeTargetAction(transaction, reportData.targetType, reportData.targetId, targetAction, reason || '');
            }
        });
        await (0, audit_1.logSecurityEvent)('report_processed', uid, {
            reportId,
            action,
            targetAction
        });
        return { success: true };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('report_processing_failed', uid, {
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
exports.getReports = (0, https_1.onCall)({
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
    const { status = 'pending', limit = 20, startAfter } = req.data;
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
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('reports_fetch_failed', uid, {
            status,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
/**
 * 사용자 신고 내역 조회
 */
exports.getUserReports = (0, https_1.onCall)({
    enforceAppCheck: true,
    region: 'asia-northeast3'
}, async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
        throw new Error('UNAUTHENTICATED');
    }
    const { limit = 20, startAfter } = req.data;
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
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('user_reports_fetch_failed', uid, {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
/**
 * 신고 우선순위 결정
 */
function getReportPriority(reason) {
    const highPriorityReasons = ['fraud', 'harassment'];
    const mediumPriorityReasons = ['inappropriate'];
    if (highPriorityReasons.includes(reason))
        return 'high';
    if (mediumPriorityReasons.includes(reason))
        return 'medium';
    return 'low';
}
/**
 * 대상에 대한 조치 실행
 */
async function executeTargetAction(transaction, targetType, targetId, action, reason) {
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
            }
            else if (action === 'warn') {
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
            }
            else if (action === 'warn') {
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
            }
            else if (action === 'warn') {
                transaction.update(postRef, {
                    warning: reason,
                    warnedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            break;
    }
}
