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
        console.log("??AdminGuard: 로그???�요");
        setAuthorized(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
          console.log("?�️ AdminGuard: ?�용??문서 ?�음");
          setAuthorized(false);
          return;
        }

        const userData = userDoc.data();
        const role = userData.role;

        console.log("?�� AdminGuard: role =", role);

        if (role === "admin") {
          console.log("??AdminGuard: 관리자 권한 ?�인??);
          setAuthorized(true);
        } else {
          console.log("??AdminGuard: 권한 ?�음 (role:", role, ")");
          setAuthorized(false);
        }
      } catch (error) {
        console.error("??AdminGuard: 권한 ?�인 ?�류:", error);
        setAuthorized(false);
      }
    };

    checkAdmin();
  }, [user, loading]);

  // 로딩 �?  if (loading || authorized === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">권한 ?�인 �?..</p>
      </div>
    );
  }

  // 권한 ?�음
  if (!authorized) {
    setTimeout(() => navigate("/dashboard"), 1500);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-6xl mb-4">?��</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">관리자 ?�용 ?�이지</h2>
        <p className="text-gray-600 mb-6">?�근 권한???�습?�다.</p>
        <div className="text-sm text-gray-500">
          <p>?�?�보?�로 ?�동?�니??..</p>
        </div>
      </div>
    );
  }

  // 권한 ?�음
  return <>{children}</>;
}

