import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/', label: '홈' },
  { to: '/meetups', label: '모임' },
  { to: '/market', label: '마켓' },
  { to: '/clubs', label: '클럽' },
  { to: '/jobs', label: '일자리' },
  { to: '/me/saves', label: '저장함' },
  { to: '/me/tickets', label: '내 티켓' },
  { to: '/me', label: '내정보' },
];

export default function TopNav() {
  const { pathname } = useLocation();
  
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/80 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold">YAGO SPORTS</Link>
        <nav className="hidden sm:flex gap-2">
          {tabs.map(t => (
            <Link 
              key={t.to} 
              to={t.to}
              className={`px-3 py-1 rounded-full text-sm ${
                pathname.startsWith(t.to) 
                  ? 'bg-black text-white' 
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
