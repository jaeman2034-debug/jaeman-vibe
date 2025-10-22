import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/', label: '홈', icon: '🏠' },
  { to: '/meetups', label: '모임', icon: '📅' },
  { to: '/market', label: '마켓', icon: '🛒' },
  { to: '/jobs', label: '일자리', icon: '💼' },
  { to: '/me/saves', label: '저장함', icon: '⭐' },
];

export default function BottomTab() {
  const { pathname } = useLocation();
  
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t bg-white dark:bg-zinc-950 sm:hidden">
      <div className="grid grid-cols-5 h-14">
        {tabs.map(t => (
          <Link 
            key={t.to} 
            to={t.to} 
            className="flex flex-col items-center justify-center text-xs"
          >
            <div className={`${pathname.startsWith(t.to) ? 'text-black' : 'text-zinc-500'}`}>
              {t.icon}
            </div>
            <div className={`${pathname.startsWith(t.to) ? 'text-black' : 'text-zinc-500'}`}>
              {t.label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
