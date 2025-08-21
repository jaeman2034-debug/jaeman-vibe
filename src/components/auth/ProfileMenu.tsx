import { useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { getUid } from "../../lib/auth";

export default function ProfileMenu() {
  const uid = getUid();
  const [open, setOpen] = useState(false);

  if (!uid) {
    return (
      <a href="/login" className="px-3 py-1.5 rounded-xl border hover:bg-zinc-100 dark:hover:bg-zinc-800">로그인</a>
    );
  }

  // 기본 아바타 (사용자 정보가 제한적이므로)
  const avatar = `https://ui-avatars.com/api/?name=U&background=random`;

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-2">
        <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full border" />
        <span className="hidden sm:inline text-sm font-medium max-w-[160px] truncate">사용자</span>
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