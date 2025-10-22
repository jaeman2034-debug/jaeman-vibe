import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import useTradeAttention from "@/features/trade/useTradeAttention";

const NAV = [
  { to: "/app/market", label: "마켓" },
  { to: "/meet", label: "모임" },
  { to: "/jobs", label: "구인·구직" },
  { to: "/me/reservations", label: "거래" },
  { to: "/admin", label: "관리/정보" },
];

export default function AppHeader() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const tradeCount = useTradeAttention();

  // 해시 링크를 SPA로 변환하는 클릭 핸들러
  const onNavClick: React.MouseEventHandler = (e) => {
    const el = (e.target as HTMLElement).closest("a");
    if (!el) return;
    const href = el.getAttribute("href") ?? "";
    if (href.startsWith("#/")) {
      e.preventDefault();                  // 기본 동작 막고
      navigate(href.slice(1));             // '/start' 같은 실제 경로로 이동
      if (import.meta.env.DEV) {
        console.log(`[AppHeader] [Hash Link Converted] ${href} -> ${href.slice(1)}`);
      }
    }
  };

  // 전역 클릭 이벤트 리스너 추가 (개발 환경에서만)
  useEffect(() => {
    if (!import.meta.env.DEV) return; // 프로덕션에서는 비활성화
    
    const handleGlobalClick = (e: MouseEvent) => {
      // 로깅용 - preventDefault/stopPropagation 없이 사용하는 것만 확인
      console.log(`[AppHeader] [Global Click] Target:`, e.target);
      console.log(`[AppHeader] [Global Click] Current Target:`, e.currentTarget);
      console.log(`[AppHeader] [Global Click] Event:`, e);
    };
    
    // passive: true로 설정하여 기본 동작을 방해하지 않음
    document.addEventListener('click', handleGlobalClick, { capture: false, passive: true });
    return () => document.removeEventListener('click', handleGlobalClick, { capture: false, passive: true });
  }, []);

  return (
    <header 
      className="sticky top-0 z-40 border-b border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-black/40 backdrop-blur"
      onClick={(e) => {
        // 해시 링크 변환 처리
        onNavClick(e);
        // 개발 환경에서만 로깅
        if (import.meta.env.DEV) {
          console.log(`[AppHeader] [Header Click] Target:`, e.target);
          console.log(`[AppHeader] [Header Click] Event:`, e);
        }
      }}
    >
      <div className="max-w-6xl mx-auto px-3 md:px-4 h-14 flex items-center justify-between gap-3">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <button className="md:hidden btn" onClick={() => setOpen(v => !v)} aria-label="메뉴">
            ☰
          </button>
          <Link to="/" className="flex items-baseline gap-1 font-extrabold tracking-tight">
            <span>YAGO</span><span className="font-medium">SPORTS</span>
          </Link>
          <span className="hidden md:inline-block text-xs text-gray-400">Region: KR</span>
        </div>

        {/* Center: Nav */}
        <nav className="hidden md:flex items-center gap-4 text-sm whitespace-nowrap">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/market"}
              className={({isActive}) =>
                "nav-link px-3 py-2 rounded-lg text-sm font-medium transition-colors " +
                (isActive 
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 font-semibold" 
                  : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                )
              }
            >
              {n.label}
              {n.to === "/me/reservations" && tradeCount > 0 && (
                <span
                  className="ml-1 min-w-5 h-5 px-1 rounded-full text-[11px] flex items-center justify-center
                             bg-red-500 text-white"
                  aria-label={`처리 필요한 거래 ${tradeCount}건`}
                  title={`처리 필요한 거래 ${tradeCount}건`}
                >
                  {tradeCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2" style={{zIndex: 9999, position: 'relative'}}>
          <span className="badge badge-blue">PROD</span>
          <Link 
            to="/" 
            className="btn nav-link"
            title="스타트 스크린"
          >
            🏠 홈
          </Link>
          <Link 
            to="/app/market" 
            className="btn nav-link"
          >
            마켓으로
          </Link>
          <Link 
            to="/me/settings" 
            className="btn nav-link"
          >
            설정
          </Link>
          <div className="w-8 h-8 rounded-full bg-gray-300/70 flex items-center justify-center text-xs">J</div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-gray-200/70 dark:border-white/10 bg-white/95 dark:bg-black/70">
          <nav className="max-w-6xl mx-auto px-3 py-2 flex flex-col">
            {NAV.map(n => (
              <NavLink 
                key={n.to} 
                to={n.to} 
                onClick={(e) => {
                  if (import.meta.env.DEV) {
                    console.log(`[AppHeader] [AppHeader Mobile] Click detected: ${n.to}`);
                    console.log(`[AppHeader] [AppHeader Mobile] Event:`, e);
                    console.log(`[AppHeader] [AppHeader Mobile] Current URL:`, window.location.href);
                  }
                  setOpen(false);
                }}
                className={({isActive}) =>
                  "px-3 py-3 rounded-lg transition-colors duration-200 cursor-pointer " +
                  "hover:bg-blue-50 dark:hover:bg-blue-950/20 " +
                  (isActive 
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold" 
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}