import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";

type Ctx = { user: User | null; ready: boolean };
const AuthCtx = createContext<Ctx>({ user: null, ready: false });
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setReady(true);          // ✅ 상태 초기화 완료 표시
      console.log("[AUTH] state:", u ? u.uid : null);
    });
  }, []);

  return <AuthCtx.Provider value={{ user, ready }}>{children}</AuthCtx.Provider>;
} 