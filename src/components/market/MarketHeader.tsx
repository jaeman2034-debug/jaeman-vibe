import { Link } from "react-router-dom";

export default function MarketHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-neutral-900/70 dark:border-neutral-800">
      <div className="max-w-screen-md mx-auto px-4 h-12 flex items-center justify-between">
        {/* 지역(placeholder) */}
        <button className="font-semibold tracking-tight">송산2동 ▾</button>

        {/* 우측 아이콘들 */}
        <div className="flex items-center gap-3 text-xl">
          <Link to="/" aria-label="홈" className="text-blue-500" title="스타트 스크린">🏠</Link>
          <button aria-label="검색">🔎</button>
          <button aria-label="알림">🔔</button>
          <Link to="/app/market/new" aria-label="글쓰기" className="text-orange-500">✚</Link>
        </div>
      </div>
    </header>
  );
}
