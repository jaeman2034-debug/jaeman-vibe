import "../_admin";
import { onCall, HttpsError, onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';

const INTERNAL_KEY = defineSecret('INTERNAL_KEY');

// (A) 운영용: 기존 admin만 호출 가능 (Callable)
export const grantRole = onCall({ secrets: [INTERNAL_KEY] }, async (req) => {
  const { uid, role } = req.data || {};
  const caller = req.auth;
  
  if (!caller?.token?.roles?.admin) {
    throw new HttpsError('permission-denied', 'admin only');
  }
  
  if (!uid || !role) {
    throw new HttpsError('invalid-argument', 'uid, role required');
  }
  
  try {
    const user = await admin.auth().getUser(uid);
    const claims = (user.customClaims as any) || {};
    claims.roles = { ...(claims.roles || {}), [role]: true };
    await admin.auth().setCustomUserClaims(uid, claims);
    
    logger.info(`Role ${role} granted to user ${uid} by ${caller.uid}`);
    return { ok: true, claims };
  } catch (error) {
    logger.error('Error granting role:', error);
    throw new HttpsError('internal', 'Failed to grant role');
  }
});

// (B) 초기 부트스트랩: 내부키로 1회성 admin 부여 (HTTPS)
export const bootstrapAdmin = onRequest({ secrets: [INTERNAL_KEY], cors: true }, async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', '*');
    return res.status(204).end();
  }
  
  const key = INTERNAL_KEY.value();
  if (req.get('x-internal-key') !== key) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  
  const { uid } = req.body || {};
  if (!uid) {
    return res.status(400).json({ error: 'uid required' });
  }
  
  try {
    const user = await admin.auth().getUser(uid);
    const claims = (user.customClaims as any) || {};
    claims.roles = { ...(claims.roles || {}), admin: true };
    await admin.auth().setCustomUserClaims(uid, claims);
    
    logger.info(`Bootstrap admin role granted to user ${uid}`);
    return res.json({ ok: true, claims });
  } catch (error) {
    logger.error('Error in bootstrap admin:', error);
    return res.status(500).json({ error: 'Failed to grant admin role' });
  }
});

// (C) 역할 회수 (Callable)
export const revokeRole = onCall({ secrets: [INTERNAL_KEY] }, async (req) => {
  const { uid, role } = req.data || {};
  const caller = req.auth;
  
  if (!caller?.token?.roles?.admin) {
    throw new HttpsError('permission-denied', 'admin only');
  }
  
  if (!uid || !role) {
    throw new HttpsError('invalid-argument', 'uid, role required');
  }
  
  try {
    const user = await admin.auth().getUser(uid);
    const claims = (user.customClaims as any) || {};
    const roles = { ...(claims.roles || {}) };
    delete roles[role];
    claims.roles = roles;
    await admin.auth().setCustomUserClaims(uid, claims);
    
    logger.info(`Role ${role} revoked from user ${uid} by ${caller.uid}`);
    return { ok: true, claims };
  } catch (error) {
    logger.error('Error revoking role:', error);
    throw new HttpsError('internal', 'Failed to revoke role');
  }
});

// (D) 사용자 클레임 조회 (Callable)
export const getUserClaims = onCall({ secrets: [INTERNAL_KEY] }, async (req) => {
  const { uid } = req.data || {};
  const caller = req.auth;
  
  if (!caller?.token?.roles?.admin) {
    throw new HttpsError('permission-denied', 'admin only');
  }
  
  if (!uid) {
    throw new HttpsError('invalid-argument', 'uid required');
  }
  
  try {
    const user = await admin.auth().getUser(uid);
    const claims = (user.customClaims as any) || {};
    return { ok: true, claims };
  } catch (error) {
    logger.error('Error getting user claims:', error);
    throw new HttpsError('internal', 'Failed to get user claims');
  }
});

// (E) 현재 사용자 역할 조회 (Callable)
export const getRoles = onCall(async (req) => {
  const caller = req.auth;
  
  if (!caller) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  try {
    const user = await admin.auth().getUser(caller.uid);
    const claims = (user.customClaims as any) || {};
    return { ok: true, roles: claims.roles || {} };
  } catch (error) {
    logger.error('Error getting roles:', error);
    throw new HttpsError('internal', 'Failed to get roles');
  }
});