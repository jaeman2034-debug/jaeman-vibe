import { isDevBuild, canAccessDev } from "../lib/devMode";
import { useAuthUser } from "../lib/auth";

export default function DevBanner() {
  const user = useAuthUser();
  const show = isDevBuild() && canAccessDev(user || null);
  if (!show) return null;
  return (
    <div className="fixed top-3 right-3 z-[1000] select-none">
      <span className="px-2 py-1 rounded-md text-xs font-semibold bg-amber-500 text-black shadow">DEV</span>
    </div>
  );
} 