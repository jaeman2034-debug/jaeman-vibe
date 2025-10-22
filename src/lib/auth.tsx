// src/lib/auth.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

// ---- Context ----
type AuthContextValue = {
  user: User | null;
  loading: boolean;
  initializing: boolean; // ??초기???태 추?
  signInWithGoogle: () => Promise<void>; // loginWithGoogle ??signInWithGoogle
  logout: () => Promise<void>;            // signOut ??logout (충돌 방?)
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Google Provider 직접 ?성
const provider = new GoogleAuthProvider();
// provider.setCustomParameters({ prompt: 'select_account' });  // ?택???션

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true); // ??초기???태

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null);
      setLoading(false);
      setInitializing(false); // ??초기???료
      
      // 사용자가 로그인했을 때 lastLoginAt 업데이트
      if (u) {
        try {
          const touchLoginFn = httpsCallable(getFunctions(), 'touchLogin');
          await touchLoginFn();
          console.log('[AUTH] lastLoginAt updated successfully');
        } catch (error) {
          console.error('[AUTH] Failed to update lastLoginAt:', error);
          // 에러가 발생해도 로그인은 계속 진행
        }
      }
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {  // ?수?변?
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {            // ?수?변?
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, initializing, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// ---- helpers ----
export const getUid = (): string | null => auth.currentUser?.uid ?? null;

// ---- UI shown when login is required ----
export const LoginRequiredUI: React.FC<{
  title?: string;
  description?: string;
  buttonText?: string;
}> = ({
  title = '로그?이 ?요?니??,
  description = '??기능???용?려?로그?해 주세??',
  buttonText = 'Google?로그??,
}) => {
  const { signInWithGoogle, loading } = useAuth(); // ?수?변?
  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ color: '#666', marginBottom: 16 }}>{description}</div>
      <button disabled={loading} onClick={signInWithGoogle} style={{ padding: '10px 16px' }}>
        {buttonText}
      </button>
    </div>
  );
};

// (?택) 보호 ?퍼
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, initializing } = useAuth();
  
  // ??초기??중에??리다?렉??금?
  if (initializing) return <div>로딩 중?/div>;
  if (loading) return null;
  if (!user) return <LoginRequiredUI />;
  return <>{children}</>;
};