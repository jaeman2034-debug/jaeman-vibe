import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
const AuthCtx = createContext({ user: null, ready: false });
export const useAuth = () => useContext(AuthCtx);
export default function AuthProvider({ children }) { const [user, setUser] = useState(null); const [ready, setReady] = useState(false); useEffect(() => { return onAuthStateChanged(auth, u => { setUser(u); setReady(true); }); }); } // ???�태 초기???�료 ?�시      console.log("[AUTH] state:", u ? u.uid : null);    });  }, []);  return <AuthCtx.Provider value={{ user, ready }}>{children}</AuthCtx.Provider>;} 
