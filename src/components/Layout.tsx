import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import {
  Home,
  ShoppingBag,
  LayoutDashboard,
  Users,
  GraduationCap,
  Building,
  Menu,
  X,
  MessageCircle,
  BarChart3,
  TestTube,
  Bot,
} from "lucide-react";

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?�식 ?�비?�용 반응???�더 */}
      <header className="w-full bg-white border-b shadow-sm fixed top-0 left-0 z-50">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          {/* 로고 */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-2xl">??/span>
            <span>YAGO VIBE</span>
          </Link>

          {/* ?�스?�탑 ?�비게이??*/}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
            <Link to="/" className="flex items-center gap-1 hover:text-blue-600">
              <Home size={16} /> ??            </Link>
            <Link to="/market" className="flex items-center gap-1 hover:text-blue-600">
              <ShoppingBag size={16} /> 마켓
            </Link>
            <Link to="/dashboard" className="flex items-center gap-1 hover:text-blue-600">
              <LayoutDashboard size={16} /> ?�?�보??            </Link>
            <Link to="/club" className="flex items-center gap-1 hover:text-blue-600">
              <Users size={16} /> ?�럽
            </Link>
            <Link to="/academy" className="flex items-center gap-1 hover:text-blue-600">
              <GraduationCap size={16} /> ?�카?��?
            </Link>
            <Link to="/facilities" className="flex items-center gap-1 hover:text-blue-600">
              <Building size={16} /> ?�설
            </Link>
            {isAdmin && (
              <>
                <Link to="/admin/home" className="flex items-center gap-1 hover:text-blue-600">
                  <LayoutDashboard size={16} /> 관리자 ??                </Link>
                <Link to="/admin/ai-chat" className="flex items-center gap-1 hover:text-lime-600">
                  <Bot size={16} /> ?�� AI ?�??                </Link>
                <Link to="/admin/chat-dashboard" className="flex items-center gap-1 hover:text-purple-600">
                  <MessageCircle size={16} /> AI 채팅 관�?                </Link>
                <Link to="/admin/chat-stats" className="flex items-center gap-1 hover:text-indigo-600">
                  <BarChart3 size={16} /> AI ?�계
                </Link>
                <Link to="/admin/slack-test" className="flex items-center gap-1 hover:text-green-600">
                  <TestTube size={16} /> Slack ?�스??                </Link>
              </>
            )}
          </nav>

          {/* ?�용??로그??*/}
          <div className="hidden md:flex items-center gap-3 text-sm">
            {user ? (
              <>
                <span className="text-gray-600">
                  ?�녕?�세?? {user.displayName || user.email || "?�용??}??
                </span>
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
                >
                  로그?�웃
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
              >
                로그??              </Link>
            )}
          </div>

          {/* 모바??메뉴 버튼 */}
          <button
            className="md:hidden flex items-center justify-center text-gray-700"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* 모바???�롭?�운 메뉴 */}
        {open && (
          <div className="md:hidden bg-white border-t shadow-sm flex flex-col items-start px-6 py-4 space-y-3 text-sm font-medium text-gray-700">
            <Link
              to="/"
              className="flex items-center gap-2 hover:text-blue-600"
              onClick={() => setOpen(false)}
            >
              <Home size={16} /> ??            </Link>
            <Link
              to="/market"
              className="flex items-center gap-2 hover:text-blue-600"
              onClick={() => setOpen(false)}
            >
              <ShoppingBag size={16} /> 마켓
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 hover:text-blue-600"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard size={16} /> ?�?�보??            </Link>
            <Link
              to="/club"
              className="flex items-center gap-2 hover:text-blue-600"
              onClick={() => setOpen(false)}
            >
              <Users size={16} /> ?�럽
            </Link>
            <Link
              to="/academy"
              className="flex items-center gap-2 hover:text-blue-600"
              onClick={() => setOpen(false)}
            >
              <GraduationCap size={16} /> ?�카?��?
            </Link>
            <Link
              to="/facilities"
              className="flex items-center gap-2 hover:text-blue-600"
              onClick={() => setOpen(false)}
            >
              <Building size={16} /> ?�설
            </Link>
            {isAdmin && (
              <>
                <Link
                  to="/admin/home"
                  className="flex items-center gap-2 hover:text-blue-600"
                  onClick={() => setOpen(false)}
                >
                  <LayoutDashboard size={16} /> 관리자 ??                </Link>
                <Link
                  to="/admin/ai-chat"
                  className="flex items-center gap-2 hover:text-lime-600"
                  onClick={() => setOpen(false)}
                >
                  <Bot size={16} /> ?�� AI ?�??                </Link>
                <Link
                  to="/admin/chat-dashboard"
                  className="flex items-center gap-2 hover:text-purple-600"
                  onClick={() => setOpen(false)}
                >
                  <MessageCircle size={16} /> AI 채팅 관�?                </Link>
                <Link
                  to="/admin/chat-stats"
                  className="flex items-center gap-2 hover:text-indigo-600"
                  onClick={() => setOpen(false)}
                >
                  <BarChart3 size={16} /> AI ?�계
                </Link>
                <Link
                  to="/admin/slack-test"
                  className="flex items-center gap-2 hover:text-green-600"
                  onClick={() => setOpen(false)}
                >
                  <TestTube size={16} /> Slack ?�스??                </Link>
              </>
            )}

            <div className="border-t w-full pt-3 mt-2">
              {user ? (
                <>
                  <span className="text-gray-600 block mb-2">
                    ?�녕?�세?? {user.displayName || user.email || "?�용??}??
                  </span>
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
                  >
                    로그?�웃
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
                  onClick={() => setOpen(false)}
                >
                  로그??                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 메인 콘텐�??�역 (?�더 ?�이만큼 ?�딩 추�?) */}
      <main className="pt-14">
        <Outlet />
      </main>
    </div>
  );
}
