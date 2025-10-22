import crypto from 'node:crypto';
import { dbAdmin } from './firebaseAdmin.mjs';

const col = () => dbAdmin.collection('invites');
const gen = () => crypto.randomBytes(24).toString('base64url');

export async function createInvite({ clubId, role = 'player', ttlHours = 48 }) {
  const token = gen();
  const now = Date.now();
  
  await col().doc(token).set({ 
    clubId, 
    role, 
    createdAt: now, 
    expiresAt: now + ttlHours * 3600 * 1000 
  });
  
  return token;
}

export async function acceptInvite({ token, uid }) {
  const ref = col().doc(token);
  const snap = await ref.get();
  
  if (!snap.exists) throw new Error('invalid invite');
  
  const inv = snap.data();
  if (inv.usedBy) throw new Error('already used');
  if (Date.now() > inv.expiresAt) throw new Error('expired');
  
  // 클럽 멤버로 추가
  await dbAdmin.doc(`clubs/${inv.clubId}/members/${uid}`).set({ 
    role: inv.role, 
    joinedAt: Date.now() 
  }, { merge: true });
  
  // 초대 토큰 사용 처리
  await ref.update({ 
    usedBy: uid, 
    usedAt: Date.now() 
  });
  
  return inv;
}

export async function getInviteInfo({ token }) {
  const snap = await col().doc(token).get();
  if (!snap.exists) return null;
  
  const data = snap.data();
  return {
    ...data,
    expired: Date.now() > data.expiresAt,
    used: !!data.usedBy
  };
}
