import { ReactNode } from "react";
import type { ActionKey, Role } from "@/constants/roles";

export function can(role: Role, action: ActionKey, ROLE_ACTIONS: Record<Role, ActionKey[]>) {
  return ROLE_ACTIONS[role]?.includes(action);
}

export function RoleGuard({
  role, need, children, fallback=null
}: { role: Role; need: ActionKey; children: ReactNode; fallback?: ReactNode }) {
  // ?¨Îü¨ ??ï† Î≥¥Ïú† ?? ?∏Ï∂úÎ∂Ä?êÏÑú Í∞Ä???∞ÏÑ† ??ï†???†ÌÉù???ÑÎã¨
  return can(role, need, (await import("@/constants/roles")).ROLE_ACTIONS as any) ? <>{children}</> : <>{fallback}</>;
}
