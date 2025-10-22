import { Link, useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { useRegion } from "@/hooks/useRegion";
import TopNavQuickLinks from "./TopNavQuickLinks";
import UserMenu from "./UserMenu";
import { logout } from "@/features/auth/authService";
import HeaderAuth from "./HeaderAuth";

export default function Header() {
  const { region } = useRegion();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      // 로그아웃 후 SPA 방식으로 /start로 이동
      navigate('/start');
    } catch (e) {
      console.error("logout failed", e);
      alert("로그아웃에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link
          to="/start"
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-none p-0"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 text-xl">+</div>
          <span className="text-xl font-extrabold">YAGO SPORTS</span>
          <span className="text-xs text-gray-500">Region: {region}</span>
        </Link>
        <TopNavQuickLinks />
        <nav className="hidden gap-2 md:flex">
          <Link to="/app/market" className="btn-ghost">스포츠마켓</Link>
          <Link to="/chat" className="btn-ghost">채팅</Link>
          <Link to="/jobs" className="btn-ghost">구인·구직</Link>
          <Link to="/groups" className="btn-ghost">모임</Link>
          <Link to="/dashboard" className="btn-ghost">대시보드</Link>
          {auth.currentUser && (
            <Link to="/my/products" className="btn-ghost">내상품</Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <UserMenu />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}