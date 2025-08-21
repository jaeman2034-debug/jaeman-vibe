import { useEffect, useState } from "react";

export default function NotificationBell() {
  const [count, setCount] = useState<number>(0);

  // TODO: 실제 알림 소스 연동. 현재는 데모로 로컬 스토리지 숫자 사용
  useEffect(() => {
    const n = Number(localStorage.getItem("demo:noti") || 0);
    setCount(n);
  }, []);

  return (
    <button
      className="relative px-3 py-1.5 rounded-xl border hover:bg-zinc-100 dark:hover:bg-zinc-800"
      aria-label="알림"
      onClick={() => alert("알림센터(데모)")}
    >
      <BellIcon />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-xs grid place-items-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/>
      <path d="M10 21a2 2 0 0 0 4 0"/>
    </svg>
  );
} 