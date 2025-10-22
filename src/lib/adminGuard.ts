import { getAuth } from 'firebase/auth';

export async function isAdmin(): Promise<boolean> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return false;
    }
    
    const tokenResult = await user.getIdTokenResult(true);
    const claims = tokenResult.claims as any;
    
    return !!(claims?.roles?.admin);
  } catch (error) {
    console.warn('Error checking admin status:', error);
    return false;
  }
}

export async function requireAdmin(): Promise<boolean> {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error('Admin 권한이 필요합니다');
  }
  return true;
}

export async function hasRole(role: string): Promise<boolean> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return false;
    }
    
    const tokenResult = await user.getIdTokenResult(true);
    const claims = tokenResult.claims as any;
    
    return !!(claims?.roles?.[role]);
  } catch (error) {
    console.warn('Error checking role status:', error);
    return false;
  }
}