import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import FIREBASE from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [country, setCountryState] = useState(localStorage.getItem('country'));
    useEffect(() => {
        const unsub = onAuthStateChanged(FIREBASE.auth, (u) => { setUser(u ?? null); setLoading(false); });
        return () => unsub();
    }, []);
    const signInWithGoogle = async () => { await signInWithPopup(FIREBASE.auth, FIREBASE.googleProvider); };
    const signOutUser = async () => { await signOut(FIREBASE.auth); };
    const setCountry = (c) => { setCountryState(c); localStorage.setItem('country', c); };
    return (_jsx(AuthContext.Provider, { value: { user, loading, country, signInWithGoogle, signOutUser, setCountry }, children: children }));
}
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
