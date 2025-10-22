import { Navigate } from "react-router-dom";
import { ReactNode, useMemo } from "react";
import { useAuth } from "@/features/auth/AuthContext";

type Props = {
  children: ReactNode;
  requireAdmin?: boolean;
  allowGuest?: boolean; // 공개 페이지면 true로 설정해주세요
};

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  allowGuest = false,
}: Props) {
  const { user, initializing, claims, rolesDoc } = useAuth();

  const isAdmin = useMemo(() => {
    const claimRoles = Array.isArray((claims as any)?.roles)
      ? (claims as any).roles
      : [];
    const docRoles = Array.isArray(rolesDoc?.roles) ? rolesDoc!.roles : [];
    return (
      (claims as any)?.admin === true ||
      rolesDoc?.admin === true ||
      claimRoles.includes("admin") ||
      docRoles.includes("admin")
    );
  }, [claims, rolesDoc]);

  // 초기화 중에는 리다이렉트하지 말고 스켈레톤/로더를 보여줍니다
  if (initializing) return <div className="p-6 text-center">로딩 중...</div>;

  if (!user && !allowGuest) return <Navigate to="/start" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}