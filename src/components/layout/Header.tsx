import { Link, NavLink, useNavigate } from "react-router-dom";
import ThemeToggle from "../theme/ThemeToggle";
import { useModal } from "../ModalHost";
import { canAccessDev } from "../../lib/devMode";
import { getUid } from "../../lib/auth";
import ProfileMenu from "../auth/ProfileMenu";
import NotificationBell from "../notifications/NotificationBell";
import { useState } from "react";

const nav = [
  { to: "/", label: "홈" },
  { to: "/market", label: "마켓", submenu: [
    { to: "/market", label: "전체 상품" },
    { to: "/market/nearby", label: "내 주변" },
    { to: "/market/new", label: "상품 등록" }
  ]},
  { to: "/meet", label: "모임" },
  { to: "/jobs", label: "채용" },
];

export default function Header() {
  const { open } = useModal();
  const uid = getUid();
  const dev = uid && canAccessDev({ uid } as any); // 임시 타입 캐스팅
  const navigate = useNavigate();
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-950/60 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="font-extrabold text-lg">
          YAGO <span className="text-emerald-600">VIBE</span>
        </button>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          {nav.map((n) => (
            <div key={n.to} className="relative">
              {n.submenu ? (
                // 서브메뉴가 있는 경우
                <div
                  className="relative"
                  onMouseEnter={() => setActiveSubmenu(n.to)}
                  onMouseLeave={() => setActiveSubmenu(null)}
                >
                  <button className="px-3 py-1.5 rounded-xl border hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    {n.label} ▼
                  </button>
                  
                  {activeSubmenu === n.to && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-2 z-50">
                      {n.submenu.map((sub) => (
                        <Link
                          key={sub.to}
                          to={sub.to}
                          className="block px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          onClick={() => setActiveSubmenu(null)}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // 일반 메뉴
                <NavLink
                  to={n.to}
                  className={({ isActive }) => `px-3 py-1.5 rounded-xl border ${isActive ? "bg-zinc-900 text-white border-zinc-900" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
                >
                  {n.label}
                </NavLink>
              )}
            </div>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {dev && (
            <Link to="/voice" className="hidden sm:inline-flex px-3 py-1.5 rounded-xl border hover:bg-zinc-100 dark:hover:bg-zinc-800">/voice</Link>
          )}
          <button onClick={() => open("voice:asr")} className="px-3 py-1.5 rounded-xl border inline-flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="음성 열기">
            <IconMic /> 음성
          </button>
          <NotificationBell />
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}

function IconMic() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><path d="M12 1a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10a7 7 0 0 1-14 0"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
  );
} 