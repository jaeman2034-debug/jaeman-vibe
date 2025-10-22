import { useEffect, useState } from 'react';
import { auth, google } from '../firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setReady(true); 
    });
    return unsubscribe;
  }, []);

  return {
    user, 
    ready,
    loginGoogle: () => signInWithPopup(auth, google),
    logout: () => signOut(auth)
  };
}
