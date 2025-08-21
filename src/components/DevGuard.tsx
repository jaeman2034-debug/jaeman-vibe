import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { canAccessDev } from "../lib/devMode";
import { getUid } from "../lib/auth";
import AppSplash from "./AppSplash";

export default function DevGuard({ children }: { children: ReactNode }) {
  const uid = getUid();
  const loc = useLocation();

  // 로딩 상태면 잠깐 비움 (uid가 null이면 로그인 안됨)
  if (uid === null) return <AppSplash small/>;

  if (!canAccessDev({ uid } as any)) {
    // 접근 불가 시 홈으로
    return <Navigate to="/" replace state={{ from: loc.pathname }} />;
  }
  return <>{children}</>;
} 