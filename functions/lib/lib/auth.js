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
exports.setUserRole = setUserRole;
exports.getUserRole = getUserRole;
exports.hasRole = hasRole;
exports.isAdmin = isAdmin;
exports.isModerator = isModerator;
exports.isRecentLogin = isRecentLogin;
exports.requestAccountDeletion = requestAccountDeletion;
exports.getPendingDeletions = getPendingDeletions;
exports.deleteUserAccount = deleteUserAccount;
const admin = __importStar(require("firebase-admin"));
/**
 * 사용자에게 역할 설정
 */
async function setUserRole(uid, role) {
    await admin.auth().setCustomUserClaims(uid, { role });
}
/**
 * 사용자 역할 가져오기
 */
async function getUserRole(uid) {
    try {
        const user = await admin.auth().getUser(uid);
        return user.customClaims?.role || null;
    }
    catch (error) {
        console.error('Error getting user role:', error);
        return null;
    }
}
/**
 * 사용자가 특정 역할을 가지고 있는지 확인
 */
async function hasRole(uid, role) {
    const userRole = await getUserRole(uid);
    return userRole === role;
}
/**
 * 사용자가 관리자인지 확인
 */
async function isAdmin(uid) {
    return hasRole(uid, 'admin');
}
/**
 * 사용자가 모더레이터인지 확인
 */
async function isModerator(uid) {
    const role = await getUserRole(uid);
    return role === 'admin' || role === 'moderator';
}
/**
 * 최근 로그인 확인 (일 단위)
 */
function isRecentLogin(authTime, days = 30) {
    const now = Date.now();
    const loginTime = authTime * 1000; // auth_time is in seconds
    const daysInMs = days * 24 * 60 * 60 * 1000;
    return (now - loginTime) < daysInMs;
}
/**
 * 사용자 계정 삭제 요청 처리
 */
async function requestAccountDeletion(uid) {
    const db = admin.firestore();
    await db.doc(`users/${uid}`).set({
        deleteRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending_deletion'
    }, { merge: true });
}
/**
 * 계정 삭제 대기 중인 사용자 목록 조회
 */
async function getPendingDeletions(olderThanDays = 7) {
    const db = admin.firestore();
    const cutoffTime = admin.firestore.Timestamp.fromDate(new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000));
    const snapshot = await db.collection('users')
        .where('deleteRequestedAt', '<=', cutoffTime)
        .where('status', '==', 'pending_deletion')
        .get();
    return snapshot.docs.map(doc => doc.id);
}
/**
 * 사용자 계정 완전 삭제
 */
async function deleteUserAccount(uid) {
    const db = admin.firestore();
    try {
        // 1. 사용자 소유 데이터 일괄 삭제
        await deleteUserData(uid);
        // 2. Firebase Auth에서 사용자 삭제
        await admin.auth().deleteUser(uid);
        // 3. 사용자 문서 삭제
        await db.doc(`users/${uid}`).delete();
        console.log(`User account ${uid} deleted successfully`);
    }
    catch (error) {
        console.error(`Error deleting user account ${uid}:`, error);
        throw error;
    }
}
/**
 * 사용자 소유 데이터 재귀적 삭제
 */
async function deleteUserData(uid) {
    const db = admin.firestore();
    const batch = db.batch();
    // 사용자가 소유한 모든 컬렉션의 문서들 삭제
    const collections = ['market', 'offers', 'reports', 'orders', 'posts', 'media'];
    for (const collection of collections) {
        const snapshot = await db.collection(collection)
            .where('ownerId', '==', uid)
            .get();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
    }
    // buyerId로 참조된 문서들도 처리
    const buyerCollections = ['market', 'offers', 'orders'];
    for (const collection of buyerCollections) {
        const snapshot = await db.collection(collection)
            .where('buyerId', '==', uid)
            .get();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
    }
    await batch.commit();
}
