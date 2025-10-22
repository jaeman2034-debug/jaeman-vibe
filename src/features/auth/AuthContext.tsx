// src/features/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "firebase/auth";
import { auth } from "@/lib/firebase"; // ???�일 진입???�용
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Ctx = { 
  user: User | null; 
  initializing: boolean;
  claims: any;
  rolesDoc: any;
};
const AuthCtx = createContext<Ctx>({ 
  user: null, 
  initializing: true,
  claims: undefined,
  rolesDoc: undefined
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [claims, setClaims] = useState<any>(undefined);
  const [rolesDoc, setRolesDoc] = useState<any>(undefined);

  useEffect(() => {
    // ???�일 진입??auth ?�스?�스 ?�용 - ??번만 구독
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u ?? null);
      
      if (u) {
        // ?�용?��? 로그?�된 경우 claims?� rolesDoc 가?�오�?
        try {
          const t = await u.getIdTokenResult(true);
          setClaims(t.claims as any);
          
          const s = await getDoc(doc(db, "roles", u.uid));
          setRolesDoc(s.exists() ? (s.data() as any) : null);
        } catch (error) {
          console.error("[AuthContext] Error getting claims or roles:", error);
          setClaims(undefined);
          setRolesDoc(undefined);
        }
      } else {
        // ?�용?��? 로그?�웃??경우
        setClaims(undefined);
        setRolesDoc(undefined);
      }
      
      setInitializing(false); // ??마�?막에 ????�??�리�?
    });
    
    return unsub;
    // ???��? claims/rolesDoc ?�을 ?�존?�에 ?��? �?�?
  }, []);

  return <AuthCtx.Provider value={{ user, initializing, claims, rolesDoc }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
