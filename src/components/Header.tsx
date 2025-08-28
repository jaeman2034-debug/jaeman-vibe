import { Link, useNavigate } from "react-router-dom";
import FIREBASE from "@/lib/firebase";
import { useRegion } from "@/hooks/useRegion";

export default function Header() {
  const navigate = useNavigate();
  const { region } = useRegion();

  const handleLogoClick = () => {
    console.log('[Header] 로고 클릭 - 시작 페이지(/start)로 이동');
    navigate('/start');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-none p-0"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 text-xl">+</div>
          <span className="text-xl font-extrabold">YAGO SPORTS</span>
          <span className="text-xs text-gray-500">Region: {region}</span>
        </button>
        <nav className="hidden gap-2 md:flex">
          <Link to="/market" className="btn-ghost">스포츠마켓</Link>
          <Link to="/chat" className="btn-ghost">채팅</Link>
          <Link to="/jobs" className="btn-ghost">구인·구직</Link>
          <Link to="/groups" className="btn-ghost">모임</Link>
          {FIREBASE.auth.currentUser && (
            <Link to="/my/products" className="btn-ghost">내상품</Link>
          )}
        </nav>
      </div>
    </header>
  );
}