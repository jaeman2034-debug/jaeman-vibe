import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "홈", icon: HomeIcon },
  { to: "/market", label: "마켓", icon: StoreIcon },
  { to: "/meet", label: "모임", icon: UsersIcon },
  { to: "/jobs", label: "채용", icon: BriefcaseIcon },
];

export default function FooterNav() {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-white/90 dark:bg-zinc-950/90 backdrop-blur">
      <nav className="max-w-7xl mx-auto grid grid-cols-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <NavLink key={it.to} to={it.to} className={({ isActive }) => `flex flex-col items-center justify-center gap-1 py-2 ${isActive ? "text-emerald-600" : "text-zinc-700 dark:text-zinc-300"}`}>
              <Icon />
              <span className="text-[11px]">{it.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

function HomeIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7"/><path d="M9 22V12h6v10"/></svg>); }
function StoreIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-5h16l1 5"/><path d="M5 22V9h14v13"/></svg>); }
function UsersIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>); }
function BriefcaseIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>); } 