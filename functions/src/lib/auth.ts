import * as admin from 'firebase-admin';

/**
 * 커스텀 클레임 및 역할 검증 유틸리티
 */

export interface UserClaims {
  role?: string;
  [key: string]: any;
}

/**
 * 사용자에게 역할 설정
 */
export async function setUserRole(uid: string, role: string): Promise<void> {
  await admin.auth().setCustomUserClaims(uid, { role });
}

/**
 * 사용자 역할 가져오기
 */
export async function getUserRole(uid: string): Promise<string | null> {
  try {
    const user = await admin.auth().getUser(uid);
    return user.customClaims?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * 사용자가 특정 역할을 가지고 있는지 확인
 */
export async function hasRole(uid: string, role: string): Promise<boolean> {
  const userRole = await getUserRole(uid);
  return userRole === role;
}

/**
 * 사용자가 관리자인지 확인
 */
export async function isAdmin(uid: string): Promise<boolean> {
  return hasRole(uid, 'admin');
}

/**
 * 사용자가 모더레이터인지 확인
 */
export async function isModerator(uid: string): Promise<boolean> {
  const role = await getUserRole(uid);
  return role === 'admin' || role === 'moderator';
}

/**
 * 최근 로그인 확인 (일 단위)
 */
export function isRecentLogin(authTime: number, days: number = 30): boolean {
  const now = Date.now();
  const loginTime = authTime * 1000; // auth_time is in seconds
  const daysInMs = days * 24 * 60 * 60 * 1000;
  return (now - loginTime) < daysInMs;
}

/**
 * 사용자 계정 삭제 요청 처리
 */
export async function requestAccountDeletion(uid: string): Promise<void> {
  const db = admin.firestore();
  await db.doc(`users/${uid}`).set({
    deleteRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'pending_deletion'
  }, { merge: true });
}

/**
 * 계정 삭제 대기 중인 사용자 목록 조회
 */
export async function getPendingDeletions(olderThanDays: number = 7): Promise<string[]> {
  const db = admin.firestore();
  const cutoffTime = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
  );
  
  const snapshot = await db.collection('users')
    .where('deleteRequestedAt', '<=', cutoffTime)
    .where('status', '==', 'pending_deletion')
    .get();
  
  return snapshot.docs.map(doc => doc.id);
}

/**
 * 사용자 계정 완전 삭제
 */
export async function deleteUserAccount(uid: string): Promise<void> {
  const db = admin.firestore();
  
  try {
    // 1. 사용자 소유 데이터 일괄 삭제
    await deleteUserData(uid);
    
    // 2. Firebase Auth에서 사용자 삭제
    await admin.auth().deleteUser(uid);
    
    // 3. 사용자 문서 삭제
    await db.doc(`users/${uid}`).delete();
    
    console.log(`User account ${uid} deleted successfully`);
  } catch (error) {
    console.error(`Error deleting user account ${uid}:`, error);
    throw error;
  }
}

/**
 * 사용자 소유 데이터 재귀적 삭제
 */
async function deleteUserData(uid: string): Promise<void> {
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
