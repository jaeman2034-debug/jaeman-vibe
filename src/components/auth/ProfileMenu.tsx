import { useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useAuthUser } from "../../lib/auth";

export default function ProfileMenu() {
  const user = useAuthUser();
  const [open, setOpen] = useState(false);
  if (user === undefined) return null; // 로딩 중

  if (!user) {
    return (
      <a href="/login" className="px-3 py-1.5 rounded-xl border hover:bg-zinc-100 dark:hover:bg-zinc-800">로그인</a>
    );
  }

  const avatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || "U")}`;

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-2">
        <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full border" />
        <span className="hidden sm:inline text-sm font-medium max-w-[160px] truncate">{user.email}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white dark:bg-zinc-900 shadow-lg p-1">
          <a href="/me" className="block px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">마이페이지</a>
          <a href="/me/listings" className="block px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">내 등록상품</a>
          <button
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={async () => { await signOut(getAuth()); location.href = "/"; }}
          >로그아웃</button>
        </div>
      )}
    </div>
  );
} 