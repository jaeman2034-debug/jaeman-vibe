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
      {/* ?•ì‹ ?œë¹„?¤ìš© ë°˜ì‘???¤ë” */}
      <header className="w-full bg-white border-b shadow-sm fixed top-0 left-0 z-50">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          {/* ë¡œê³  */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-2xl">??/span>
            <span>YAGO VIBE</span>
          </Link>

          {/* ?°ìŠ¤?¬íƒ‘ ?¤ë¹„ê²Œì´??*/}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
            <Link to="/" className="flex items-center gap-1 hover:text-blue-600">
              <Home size={16} /> ??            </Link>
            <Link to="/market" className="flex items-center gap-1 hover:text-blue-600">
              <ShoppingBag size={16} /> ë§ˆì¼“
            </Link>
            <Link to="/dashboard" className="flex items-center gap-1 hover:text-blue-600">
              <LayoutDashboard size={16} /> ?€?œë³´??            </Link>
            <Link to="/club" className="flex items-center gap-1 hover:text-blue-600">
              <Users size={16} /> ?´ëŸ½
            </Link>
            <Link to="/academy" className="flex items-center gap-1 hover:text-blue-600">
              <GraduationCap size={16} /> ?„ì¹´?°ë?
            </Link>
            <Link to="/facilities" className="flex items-center gap-1 hover:text-blue-600">
              <Building size={16} /> ?œì„¤
            </Link>
            {isAdmin && (
              <>
                <Link to="/admin/home" className="flex items-center gap-1 hover:text-blue-600">
                  <LayoutDashboard size={16} /> ê´€ë¦¬ì ??                </Link>
                <Link to="/admin/ai-chat" className="flex items-center gap-1 hover:text-lime-600">
                  <Bot size={16} /> ?¤– AI ?€??                </Link>
                <Link to="/admin/chat-dashboard" className="flex items-center gap-1 hover:text-purple-600">
                  <MessageCircle size={16} /> AI ì±„íŒ… ê´€ë¦?                </Link>
                <Link to="/admin/chat-stats" className="flex items-center gap-1 hover:text-indigo-600">
                  <BarChart3 size={16} /> AI ?µê³„
                </Link>
                <Link to="/admin/slack-test" className="flex items-center gap-1 hover:text-green-600">
                  <TestTube size={16} /> Slack ?ŒìŠ¤??                </Link>
              </>
            )}
          </nav>

          {/* ?¬ìš©??ë¡œê·¸??*/}
          <div className="hidden md:flex items-center gap-3 text-sm">
            {user ? (
              <>
                <span className="text-gray-600">
                  ?ˆë…•?˜ì„¸?? {user.displayName || user.email || "?¬ìš©??}??
                </span>
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
                >
                  ë¡œê·¸?„ì›ƒ
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
              >
                ë¡œê·¸??              </Link>
            )}
          </div>

          {/* ëª¨ë°”??ë©”ë‰´ ë²„íŠ¼ */}
          <button
            className="md:hidden flex items-center justify-center text-gray-700"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* ëª¨ë°”???œë¡­?¤ìš´ ë©”ë‰´ */}
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
              <ShoppingBag size={16} /> ë§ˆì¼“
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 hover:text-blue-600"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard size={16} /> ?€?œë³´??            </Link>
            <Link
              to="/club"
              className="flex items-center gap-2 hover:text-blue-600"
              onClick={() => setOpen(false)}
            >
              <Users size={16} /> ?´ëŸ½
            </Link>
            <Link
              to="/academy"
              className="flex items-center gap-2 hover:text-blue-600"
              onClick={() => setOpen(false)}
            >
              <GraduationCap size={16} /> ?„ì¹´?°ë?
            </Link>
            <Link
              to="/facilities"
              className="flex items-center gap-2 hover:text-blue-600"
              onClick={() => setOpen(false)}
            >
              <Building size={16} /> ?œì„¤
            </Link>
            {isAdmin && (
              <>
                <Link
                  to="/admin/home"
                  className="flex items-center gap-2 hover:text-blue-600"
                  onClick={() => setOpen(false)}
                >
                  <LayoutDashboard size={16} /> ê´€ë¦¬ì ??                </Link>
                <Link
                  to="/admin/ai-chat"
                  className="flex items-center gap-2 hover:text-lime-600"
                  onClick={() => setOpen(false)}
                >
                  <Bot size={16} /> ?¤– AI ?€??                </Link>
                <Link
                  to="/admin/chat-dashboard"
                  className="flex items-center gap-2 hover:text-purple-600"
                  onClick={() => setOpen(false)}
                >
                  <MessageCircle size={16} /> AI ì±„íŒ… ê´€ë¦?                </Link>
                <Link
                  to="/admin/chat-stats"
                  className="flex items-center gap-2 hover:text-indigo-600"
                  onClick={() => setOpen(false)}
                >
                  <BarChart3 size={16} /> AI ?µê³„
                </Link>
                <Link
                  to="/admin/slack-test"
                  className="flex items-center gap-2 hover:text-green-600"
                  onClick={() => setOpen(false)}
                >
                  <TestTube size={16} /> Slack ?ŒìŠ¤??                </Link>
              </>
            )}

            <div className="border-t w-full pt-3 mt-2">
              {user ? (
                <>
                  <span className="text-gray-600 block mb-2">
                    ?ˆë…•?˜ì„¸?? {user.displayName || user.email || "?¬ìš©??}??
                  </span>
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
                  >
                    ë¡œê·¸?„ì›ƒ
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
                  onClick={() => setOpen(false)}
                >
                  ë¡œê·¸??                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ë©”ì¸ ì½˜í…ì¸??ì—­ (?¤ë” ?’ì´ë§Œí¼ ?¨ë”© ì¶”ê?) */}
      <main className="pt-14">
        <Outlet />
      </main>
    </div>
  );
}
