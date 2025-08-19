import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";

export function useAuthUser(): User | null | undefined {
  const [u, setU] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (user) => setU(user));
  }, []);
  return u;
} 