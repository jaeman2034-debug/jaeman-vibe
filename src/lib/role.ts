export const ROLE_KEY = "yago.role";
export type Role = "player"|"coach"|"club"|"facility"|"referee"|"trainer"|"shop";

export function getSavedRole(): Role {
  return (localStorage.getItem(ROLE_KEY) as Role) || "player";
}

export function saveRole(role: Role) {
  localStorage.setItem(ROLE_KEY, role);
}
