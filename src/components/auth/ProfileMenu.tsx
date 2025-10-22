import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) {
    return (
      <Link to="/login" className="px-3 py-1.5 rounded-xl border hover:bg-zinc-100 dark:hover:bg-zinc-800">
        로그인
      </Link>
    );
  }

  // 기본 아바타 (사용자 정보가 제한적이므로)
  const avatar = `https://ui-avatars.com/api/?name=${user.displayName?.charAt(0) || 'U'}&background=random`;

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen((v) => !v)} 
        className="inline-flex items-center gap-2"
      >
        <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full border" />
        <span className="hidden sm:inline text-sm font-medium max-w-[160px] truncate">
          {user.displayName || '사용자'}
        </span>
      </button>
      
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white dark:bg-zinc-900 shadow-lg p-1">
          <Link 
            to="/me" 
            className="block px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => setOpen(false)}
          >
            마이페이지
          </Link>
          <Link 
            to="/me/listings" 
            className="block px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => setOpen(false)}
          >
            등록상품
          </Link>
          <button
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}