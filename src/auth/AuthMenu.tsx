import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "./useAuth";

export default function AuthMenu() {
  const { user, loading, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (loading) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" aria-label="로딩 중" />
    );
  }

  if (!user) {
    return (
      <button
        onClick={login}
        className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        로그인
      </button>
    );
  }

  const avatar = user.photoURL ?? "";
  const name = user.displayName ?? "사용자";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border px-2 py-1 hover:bg-gray-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {avatar ? (
          <img src={avatar} alt="avatar" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-gray-300" />
        )}
        <span className="max-w-[10rem] truncate text-sm">{name}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-[10000] mt-2 w-44 overflow-hidden rounded-lg border bg-white shadow-lg"
        >
          <div className="px-3 py-2 text-xs text-gray-500">
            {user.email ?? user.uid}
          </div>
          <button
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
            onClick={() => (window.location.href = "/profile")}
          >
            내 정보
          </button>
          <button
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
            onClick={logout}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
