import { jsx as _jsx } from "react/jsx-runtime";
// src/features/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import FIREBASE from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
const Ctx = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [countryCode, setCountryCode] = useState('KR');
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
                await setDoc(doc(FIREBASE.db, 'users', u.uid), {
                    uid: u.uid,
                    email: u.email ?? null,
                    displayName: u.displayName ?? null,
                    photoURL: u.photoURL ?? null,
                    updatedAt: Date.now(),
                }, { merge: true });
            }
        });
        return () => unsub();
    }, []);
    const value = useMemo(() => ({ user, loading, countryCode, setCountryCode, signInWithGoogle, signOutUser }), [user, loading, countryCode]);
    return _jsx(Ctx.Provider, { value: value, children: children });
}
export function useAuth() {
    const ctx = useContext(Ctx);
    if (!ctx)
        throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}
