import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function AcademyHeader() {
  const { id } = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // /academy/list ?�이지?��? ?�인
  const isListPage = !id;

  return (
    <header className="w-full bg-white shadow px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* 좌측 로고 + ?�카?��?�?*/}
      <h1 className="text-lg font-bold flex items-center gap-2">
        {isListPage ? "?�� ?�카?��? 목록" : "?�� FC88 ?�카?��?"}
      </h1>
      
      {/* PC 메뉴 */}
      <nav className="hidden md:flex gap-4 text-sm">
        {isListPage ? (
          <>
            <Link 
              to="/academy/list" 
              className="hover:text-blue-600 transition-colors"
            >
              ?�� ?�카?��? 목록
            </Link>
            <Link 
              to="/academy/new" 
              className="hover:text-blue-600 transition-colors"
            >
              ?????�카?��?
            </Link>
          </>
        ) : (
          <>
            <Link 
              to={`/academy/${id}`} 
              className="hover:text-blue-600 transition-colors"
            >
              ?�� ??            </Link>
            <Link 
              to={`/academy/${id}/courses`} 
              className="hover:text-blue-600 transition-colors"
            >
              ?�� 강좌
            </Link>
            <Link 
              to={`/academy/${id}/reports`} 
              className="hover:text-blue-600 transition-colors"
            >
              ?�� 리포??            </Link>
            <Link 
              to={`/academy/${id}/gallery`} 
              className="hover:text-blue-600 transition-colors"
            >
              ?���?갤러�?            </Link>
            <Link 
              to={`/academy/${id}/contact`} 
              className="hover:text-blue-600 transition-colors"
            >
              ?�� 문의
            </Link>
          </>
        )}
      </nav>
      
      {/* 모바??메뉴 버튼 */}
      <button 
        className="md:hidden p-2 rounded hover:bg-gray-100 transition-colors"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>
      
      {/* 모바???�롭?�운 */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t md:hidden">
          <nav className="px-6 py-3 space-y-2">
            {isListPage ? (
              <>
                <Link 
                  to="/academy/list" 
                  className="block py-2 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ?�� ?�카?��? 목록
                </Link>
                <Link 
                  to="/academy/new" 
                  className="block py-2 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ?????�카?��?
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to={`/academy/${id}`} 
                  className="block py-2 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ?�� ??                </Link>
                <Link 
                  to={`/academy/${id}/courses`} 
                  className="block py-2 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ?�� 강좌
                </Link>
                <Link 
                  to={`/academy/${id}/reports`} 
                  className="block py-2 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ?�� 리포??                </Link>
                <Link 
                  to={`/academy/${id}/gallery`} 
                  className="block py-2 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ?���?갤러�?                </Link>
                <Link 
                  to={`/academy/${id}/contact`} 
                  className="block py-2 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ?�� 문의
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
