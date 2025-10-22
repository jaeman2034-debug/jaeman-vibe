import { useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "@/lib/firebase"; // ???�일 진입???�용

const functions = getFunctions();

interface AdminRoleInfo {
  uid: string;
  role: string;
  isAdmin: boolean;
  email?: string;
}

export function useAdminRole() {
  const [roleInfo, setRoleInfo] = useState<AdminRoleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 관리자 권한 ?�인
  const checkAdminRole = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = auth.currentUser;
      if (!user) {
        setRoleInfo(null);
        return;
      }

      const checkAdminFn = httpsCallable(functions, 'checkAdminRole');
      const result = await checkAdminFn({});
      const data = result.data as AdminRoleInfo;
      
      setRoleInfo(data);
    } catch (err: any) {
      console.error("관리자 권한 ?�인 ?�패:", err);
      setError(err.message || "권한 ?�인???�패?�습?�다.");
      setRoleInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // ?�용??권한 조회
  const getUserRole = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = auth.currentUser;
      if (!user) {
        setRoleInfo(null);
        return;
      }

      const getUserRoleFn = httpsCallable(functions, 'getUserRole');
      const result = await getUserRoleFn({});
      const data = result.data as AdminRoleInfo;
      
      setRoleInfo({
        ...data,
        isAdmin: data.role === 'admin' || data.role === 'superadmin'
      });
    } catch (err: any) {
      console.error("?�용??권한 조회 ?�패:", err);
      setError(err.message || "권한 조회???�패?�습?�다.");
      setRoleInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // 권한 ?�정 (?�퍼 관리자�?
  const setAdminRole = async (targetUid: string, role: 'admin' | 'user') => {
    try {
      const setAdminRoleFn = httpsCallable(functions, 'setAdminRole');
      const result = await setAdminRoleFn({ targetUid, role });
      return result.data;
    } catch (err: any) {
      console.error("권한 ?�정 ?�패:", err);
      throw err;
    }
  };

  // ?�증 ?�태 변�???권한 ?�인
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkAdminRole();
      } else {
        setRoleInfo(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return {
    roleInfo,
    loading,
    error,
    isAdmin: roleInfo?.isAdmin || false,
    role: roleInfo?.role || 'user',
    checkAdminRole,
    getUserRole,
    setAdminRole,
    refresh: checkAdminRole
  };
}
