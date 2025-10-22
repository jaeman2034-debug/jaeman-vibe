import { ReactNode, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [user, loading] = useAuthState(auth);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      if (loading) return;
      
      if (!user) {
        console.log("??AdminGuard: ë¡œê·¸???„ìš”");
        setAuthorized(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
          console.log("? ï¸ AdminGuard: ?¬ìš©??ë¬¸ì„œ ?†ìŒ");
          setAuthorized(false);
          return;
        }

        const userData = userDoc.data();
        const role = userData.role;

        console.log("?” AdminGuard: role =", role);

        if (role === "admin") {
          console.log("??AdminGuard: ê´€ë¦¬ì ê¶Œí•œ ?•ì¸??);
          setAuthorized(true);
        } else {
          console.log("??AdminGuard: ê¶Œí•œ ?†ìŒ (role:", role, ")");
          setAuthorized(false);
        }
      } catch (error) {
        console.error("??AdminGuard: ê¶Œí•œ ?•ì¸ ?¤ë¥˜:", error);
        setAuthorized(false);
      }
    };

    checkAdmin();
  }, [user, loading]);

  // ë¡œë”© ì¤?  if (loading || authorized === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">ê¶Œí•œ ?•ì¸ ì¤?..</p>
      </div>
    );
  }

  // ê¶Œí•œ ?†ìŒ
  if (!authorized) {
    setTimeout(() => navigate("/dashboard"), 1500);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-6xl mb-4">?”’</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">ê´€ë¦¬ì ?„ìš© ?˜ì´ì§€</h2>
        <p className="text-gray-600 mb-6">?‘ê·¼ ê¶Œí•œ???†ìŠµ?ˆë‹¤.</p>
        <div className="text-sm text-gray-500">
          <p>?€?œë³´?œë¡œ ?´ë™?©ë‹ˆ??..</p>
        </div>
      </div>
    );
  }

  // ê¶Œí•œ ?ˆìŒ
  return <>{children}</>;
}

