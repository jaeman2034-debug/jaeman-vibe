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
exports.purgeDeletedUsers = exports.getUserStats = exports.updateProfile = exports.cancelDeletion = exports.requestDeletion = exports.setRole = exports.touchLogin = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../lib/auth");
const audit_1 = require("../lib/audit");
/**
 * 로그인 시간 업데이트 (재인증 후 호출)
 */
exports.touchLogin = (0, https_1.onCall)({
    enforceAppCheck: true,
    region: 'asia-northeast3'
}, async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
        throw new Error('UNAUTHENTICATED');
    }
    try {
        const db = admin.firestore();
        await db.doc(`users/${uid}`).set({ lastLoginAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        await (0, audit_1.logAuditEvent)('user_login_touched', uid);
        return { success: true };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('user_login_touch_failed', uid, {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
/**
 * 사용자 역할 설정 (관리자만)
 */
exports.setRole = (0, https_1.onCall)({
    enforceAppCheck: true,
    region: 'asia-northeast3'
}, async (req) => {
    const { uid, role } = req.data;
    const callerUid = req.auth?.uid;
    if (!callerUid) {
        throw new Error('UNAUTHENTICATED');
    }
    // 관리자 권한 확인
    const isCallerAdmin = await (0, auth_1.isAdmin)(callerUid);
    if (!isCallerAdmin) {
        await (0, audit_1.logSecurityEvent)('unauthorized_role_set_attempt', callerUid, { targetUid: uid, requestedRole: role });
        throw new Error('PERMISSION_DENIED');
    }
    // 유효한 역할인지 확인
    const validRoles = ['admin', 'moderator', 'user'];
    if (!validRoles.includes(role)) {
        throw new Error('INVALID_ROLE');
    }
    try {
        await (0, auth_1.setUserRole)(uid, role);
        await (0, audit_1.logAuditEvent)('user_role_set', callerUid, {
            targetUid: uid,
            newRole: role
        });
        return { success: true };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('user_role_set_failed', callerUid, {
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
exports.requestDeletion = (0, https_1.onCall)({
    enforceAppCheck: true,
    region: 'asia-northeast3'
}, async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
        throw new Error('UNAUTHENTICATED');
    }
    try {
        await (0, auth_1.requestAccountDeletion)(uid);
        await (0, audit_1.logAuditEvent)('account_deletion_requested', uid);
        return { success: true, message: 'Account deletion requested. Your account will be deleted in 7 days.' };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('account_deletion_request_failed', uid, {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
/**
 * 계정 삭제 요청 취소
 */
exports.cancelDeletion = (0, https_1.onCall)({
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
        await (0, audit_1.logAuditEvent)('account_deletion_cancelled', uid);
        return { success: true, message: 'Account deletion cancelled.' };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('account_deletion_cancel_failed', uid, {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
/**
 * 사용자 프로필 업데이트
 */
exports.updateProfile = (0, https_1.onCall)({
    enforceAppCheck: true,
    region: 'asia-northeast3'
}, async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
        throw new Error('UNAUTHENTICATED');
    }
    const { displayName, photoURL, bio } = req.data;
    try {
        const db = admin.firestore();
        const userRef = db.doc(`users/${uid}`);
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (displayName !== undefined)
            updateData.displayName = displayName;
        if (photoURL !== undefined)
            updateData.photoURL = photoURL;
        if (bio !== undefined)
            updateData.bio = bio;
        await userRef.set(updateData, { merge: true });
        await (0, audit_1.logAuditEvent)('user_profile_updated', uid, {
            fields: Object.keys(updateData)
        });
        return { success: true };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('user_profile_update_failed', uid, {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
/**
 * 사용자 통계 조회
 */
exports.getUserStats = (0, https_1.onCall)({
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
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('user_stats_fetch_failed', uid, {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
/**
 * 삭제 대기 중인 계정 정리 (매일 실행)
 */
exports.purgeDeletedUsers = (0, scheduler_1.onSchedule)({
    schedule: 'every 24 hours',
    region: 'asia-northeast3'
}, async () => {
    try {
        const pendingDeletions = await (0, auth_1.getPendingDeletions)(7); // 7일 이상 된 계정들
        if (pendingDeletions.length === 0) {
            console.log('No accounts to purge');
            return;
        }
        console.log(`Purging ${pendingDeletions.length} accounts`);
        for (const uid of pendingDeletions) {
            try {
                await (0, auth_1.deleteUserAccount)(uid);
                await (0, audit_1.logAuditEvent)('account_purged', uid);
            }
            catch (error) {
                console.error(`Failed to purge account ${uid}:`, error);
                await (0, audit_1.logAuditEvent)('account_purge_failed', uid, {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        console.log(`Successfully purged ${pendingDeletions.length} accounts`);
    }
    catch (error) {
        console.error('Error in purgeDeletedUsers:', error);
        await (0, audit_1.logAuditEvent)('account_purge_batch_failed', undefined, {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
