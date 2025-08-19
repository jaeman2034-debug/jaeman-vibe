import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { canAccessDev } from "../lib/devMode";
import { useAuthUser } from "../lib/auth";
import AppSplash from "./AppSplash";

export default function DevGuard({ children }: { children: ReactNode }) {
  const user = useAuthUser();
  const loc = useLocation();

  // 로딩 상태면 잠깐 비움
  if (user === undefined) return <AppSplash small/>;

  if (!canAccessDev(user)) {
    // 접근 불가 시 홈으로
    return <Navigate to="/" replace state={{ from: loc.pathname }} />;
  }
  return <>{children}</>;
} 