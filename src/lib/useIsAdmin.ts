import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";

export default function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) return setIsAdmin(false);
      const tok = await user.getIdTokenResult();
      if (alive) setIsAdmin(!!tok.claims.admin);
    })();
    return () => { alive = false; };
  }, [user]);
  
  return isAdmin;
}
