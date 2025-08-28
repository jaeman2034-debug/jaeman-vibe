import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import FIREBASE from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';

type Ctx = {
  user: User | null;
  loading: boolean;
  country: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  setCountry: (c: string) => void;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [country, setCountryState] = useState<string | null>(localStorage.getItem('country'));

  useEffect(() => {
    const unsub = onAuthStateChanged(FIREBASE.auth, (u) => { setUser(u ?? null); setLoading(false); });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => { await signInWithPopup(FIREBASE.auth, FIREBASE.googleProvider); };
  const signOutUser = async () => { await signOut(FIREBASE.auth); };
  const setCountry = (c: string) => { setCountryState(c); localStorage.setItem('country', c); };

  return (
    <AuthContext.Provider value={{ user, loading, country, signInWithGoogle, signOutUser, setCountry }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
