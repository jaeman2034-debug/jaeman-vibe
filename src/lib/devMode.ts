import type { User } from "firebase/auth";

const parseCsv = (v?: string) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export function isDevBuild() {
  // vite의 DEV 플래그 + 수동 오버라이드
  const flag = import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === "true";
  return !!flag;
}

export function whitelistFromEnv() {
  return parseCsv(import.meta.env.VITE_DEV_WHITELIST);
}

export function isWhitelisted(user?: Pick<User, "uid" | "email"> | null) {
  const list = new Set(whitelistFromEnv());

  // 로컬 강제 허용 토글(브라우저 콘솔에서 localStorage.setItem('dev:allow','1'))
  const localAllow = typeof window !== "undefined" && localStorage.getItem("dev:allow") === "1";
  if (localAllow) return true;

  if (!user) return false;
  if (user.uid && list.has(user.uid)) return true;
  if (user.email && list.has(user.email)) return true;
  return false;
}

export function canAccessDev(user?: Pick<User, "uid" | "email"> | null) {
  return isDevBuild() && isWhitelisted(user);
} 