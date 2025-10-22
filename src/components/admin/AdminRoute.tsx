import React from "react";
import { useAdminRole } from "@/hooks/useAdminRole";

interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export default function AdminRoute({ 
  children, 
  fallback,
  requireSuperAdmin = false 
}: AdminRouteProps) {
  const { isAdmin, role, loading } = useAdminRole();

  // 로딩 �?
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-500">권한 ?�인 �?..</p>
        </div>
      </div>
    );
  }

  // ?�퍼 관리자 권한???�요??경우
  if (requireSuperAdmin && role !== 'superadmin') {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">?��</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">?�근 권한 ?�음</h2>
          <p className="text-gray-500 mb-4">?�퍼 관리자 권한???�요?�니??</p>
          <p className="text-sm text-gray-400">?�재 권한: {role}</p>
        </div>
      </div>
    );
  }

  // ?�반 관리자 권한???�요??경우
  if (!isAdmin) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">?��</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">?�근 권한 ?�음</h2>
          <p className="text-gray-500 mb-4">관리자 권한???�요?�니??</p>
          <p className="text-sm text-gray-400">?�재 권한: {role}</p>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
            <h3 className="font-medium text-blue-900 mb-2">관리자 권한???�요???�유</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>???�설 ?�롯 관�?/li>
              <li>???�약 강제 취소</li>
              <li>???�용??권한 관�?/li>
              <li>???�스??모니?�링</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 권한???�는 경우 ?�식 컴포?�트 ?�더�?
  return <>{children}</>;
}
