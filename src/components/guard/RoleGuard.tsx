import { ReactNode } from "react";
import type { ActionKey, Role } from "@/constants/roles";

export function can(role: Role, action: ActionKey, ROLE_ACTIONS: Record<Role, ActionKey[]>) {
  return ROLE_ACTIONS[role]?.includes(action);
}

export function RoleGuard({
  role, need, children, fallback=null
}: { role: Role; need: ActionKey; children: ReactNode; fallback?: ReactNode }) {
  // ?�러 ??�� 보유 ?? ?�출부?�서 가???�선 ??��???�택???�달
  return can(role, need, (await import("@/constants/roles")).ROLE_ACTIONS as any) ? <>{children}</> : <>{fallback}</>;
}
