import { NavLink } from "react-router-dom";
import { useEffect } from "react";

const items = [
  { to: "/app/market", label: "마켓" },
  { to: "/meet",   label: "모임" },
  { to: "/jobs",   label: "구인·구직" },
  { to: "/admin",  label: "관리/정보" },
];

export default function QuickNav() {
  // 클릭 지연의 겹침 문제 진단 (개발 환경에서만)
  useEffect(() => {
    if (!import.meta.env.DEV) return; // 프로덕션에서는 비활성화
    
    const handleClick = (e: MouseEvent) => {
      // 로그용 - preventDefault/stopPropagation 없이 사용하는 것만 확인
      const els = document.elementsFromPoint(e.clientX, e.clientY);
      console.table(els.slice(0,5).map(el => {
        const s = getComputedStyle(el);
        return { 
          tag: el.tagName, 
          cls: el.className, 
          pe: s.pointerEvents, 
          z: s.zIndex,
          id: el.id
        };
      }));
    };
    
    // passive: true로 설정하여 기본 동작을 방해하지 않음
    document.addEventListener('click', handleClick, { capture: false, passive: true });
    return () => document.removeEventListener('click', handleClick, { capture: false, passive: true });
  }, []);
  return (
    <nav aria-label="빠른 이동" className="mb-4">
      <ul className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
        {items.map(i => (
          <li key={i.to}>
            <NavLink
              to={i.to}
              style={{
                pointerEvents: 'auto',
                zIndex: 10000,
                position: 'relative',
                display: 'block',
                width: '100%',
                height: '100%'
              }}
              className={({ isActive }) =>
                `nav-link block rounded-lg px-3 py-2 transition
                 hover:bg-muted focus:bg-muted focus:outline-none focus:ring-2 focus:ring-ring
                 ${isActive ? "bg-muted font-semibold" : ""}`
              }
            >
              {i.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}