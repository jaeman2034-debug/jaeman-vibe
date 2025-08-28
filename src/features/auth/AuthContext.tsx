// src/features/auth/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import FIREBASE from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

type AuthCtx = {
  user: User | null;
  loading: boolean;
  countryCode: string;
  setCountryCode: (code: string) => void;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [countryCode, setCountryCode] = useState<string>('KR');

  // 로그인
  const signInWithGoogle = async () => {
    await signInWithPopup(FIREBASE.auth, FIREBASE.googleProvider);
  };

  // 로그아웃
  const signOutUser = async () => {
    await signOut(FIREBASE.auth);
  };

  // 사용자 상태 감시 + 유저 문서 upsert
  useEffect(() => {
    const unsub = onAuthStateChanged(FIREBASE.auth, async (u) => {
      setUser(u ?? null);
      setLoading(false);

      if (u) {
        await setDoc(
          doc(FIREBASE.db, 'users', u.uid),
          {
            uid: u.uid,
            email: u.email ?? null,
            displayName: u.displayName ?? null,
            photoURL: u.photoURL ?? null,
            updatedAt: Date.now(),
          },
          { merge: true },
        );
      }
    });
    return () => unsub();
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({ user, loading, countryCode, setCountryCode, signInWithGoogle, signOutUser }),
    [user, loading, countryCode],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
