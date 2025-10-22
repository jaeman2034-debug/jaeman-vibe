import { Link } from "react-router-dom";
import { fixTeamLogos } from "../utils/fixTeamLogos";

export default function GlobalHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
      <Link to="/" className="font-bold text-2xl tracking-wide flex items-center gap-2 hover:scale-105 transition-transform">
        ??YAGO VIBE
      </Link>
      <nav className="flex items-center gap-4">
        <Link 
          to="/blogs" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-105"
        >
          ?�� 블로�?        </Link>
        <Link 
          to="/market" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 transition-all duration-200 hover:scale-105"
        >
          ?�� 중고마켓
        </Link>
        <Link 
          to="/academy/courses" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 transition-all duration-200 hover:scale-105"
        >
          ?�� ?�카?��?
        </Link>
        <Link 
          to="/academy-demo" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 transition-all duration-200 hover:scale-105"
        >
          ?�� ?�카?��? ?�모
        </Link>
        <Link 
          to="/academy-simple" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition-all duration-200 hover:scale-105"
        >
          ?�� 간단 ?�카?��?
        </Link>
        <Link 
          to="/academy-simple/admin" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition-all duration-200 hover:scale-105"
        >
          ?�� 관리자
        </Link>
        <Link 
          to="/academy-simple/qa" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition-all duration-200 hover:scale-105"
        >
          ?�� AI Q&A
        </Link>
        <Link 
          to="/academy-simple/qa/admin" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 transition-all duration-200 hover:scale-105"
        >
          ?�� Q&A 관�?        </Link>
        <Link 
          to="/blogs/new" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 transition-all duration-200 hover:scale-105"
        >
          ?�️ 글?�기
        </Link>
        <Link 
          to="/blogs/create" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition-all duration-200 hover:scale-105"
        >
          ?�� ?�립 블로�?        </Link>
        <Link 
          to="/teams/soheul-fc60/dashboard" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-105"
        >
          ?�� ?� 관�?        </Link>
        <Link 
          to="/teams/create" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-105"
        >
          ?????� ?�성
        </Link>
        <button 
          onClick={async () => {
            try {
              const count = await fixTeamLogos();
              alert(`?� 로고 ?�데?�트 ?�료! ${count}�??� ?�정??);
            } catch (error) {
              console.error("?� 로고 ?�데?�트 ?�패:", error);
              alert("?� 로고 ?�데?�트 ?�패");
            }
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 transition-all duration-200 hover:scale-105"
        >
          ?�� 로고 ?�정
        </button>
        <Link 
          to="/notifications" 
          className="relative flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 transition-all duration-200 hover:scale-105"
        >
          ?�� ?�림?�터
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
            3
          </span>
        </Link>
        <Link 
          to="/posts/new" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 transition-all duration-200 hover:scale-105"
        >
          ?�️ ??글 ?�성
        </Link>
        <Link 
          to="/seed" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition-all duration-200 hover:scale-105"
        >
          ?�� ?�모 ?�이??        </Link>
      </nav>
    </header>
  );
}
