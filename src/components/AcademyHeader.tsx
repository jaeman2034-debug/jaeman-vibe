import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function AcademyHeader() {
  const { id } = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // /academy/list ?˜ì´ì§€?¸ì? ?•ì¸
  const isListPage = !id;

  return (
    <header className="w-full bg-white shadow px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* ì¢Œì¸¡ ë¡œê³  + ?„ì¹´?°ë?ëª?*/}
      <h1 className="text-lg font-bold flex items-center gap-2">
        {isListPage ? "?« ?„ì¹´?°ë? ëª©ë¡" : "?« FC88 ?„ì¹´?°ë?"}
      </h1>
      
      {/* PC ë©”ë‰´ */}
      <nav className="hidden md:flex gap-4 text-sm">
        {isListPage ? (
          <>
            <Link 
              to="/academy/list" 
              className="hover:text-blue-600 transition-colors"
            >
              ?« ?„ì¹´?°ë? ëª©ë¡
            </Link>
            <Link 
              to="/academy/new" 
              className="hover:text-blue-600 transition-colors"
            >
              ?????„ì¹´?°ë?
            </Link>
          </>
        ) : (
          <>
            <Link 
              to={`/academy/${id}`} 
              className="hover:text-blue-600 transition-colors"
            >
              ?  ??            </Link>
            <Link 
              to={`/academy/${id}/courses`} 
              className="hover:text-blue-600 transition-colors"
            >
              ?“š ê°•ì¢Œ
            </Link>
            <Link 
              to={`/academy/${id}/reports`} 
              className="hover:text-blue-600 transition-colors"
            >
              ?“Š ë¦¬í¬??            </Link>
            <Link 
              to={`/academy/${id}/gallery`} 
              className="hover:text-blue-600 transition-colors"
            >
              ?–¼ï¸?ê°¤ëŸ¬ë¦?            </Link>
            <Link 
              to={`/academy/${id}/contact`} 
              className="hover:text-blue-600 transition-colors"
            >
              ?“ ë¬¸ì˜
            </Link>
          </>
        )}
      </nav>
      
      {/* ëª¨ë°”??ë©”ë‰´ ë²„íŠ¼ */}
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
      
      {/* ëª¨ë°”???œë¡­?¤ìš´ */}
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
                  ?« ?„ì¹´?°ë? ëª©ë¡
                </Link>
                <Link 
                  to="/academy/new" 
                  className="block py-2 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ?????„ì¹´?°ë?
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to={`/academy/${id}`} 
                  className="block py-2 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ?  ??                </Link>
                <Link 
                  to={`/academy/${id}/courses`} 
                  className="block py-2 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ?“š ê°•ì¢Œ
                </Link>
                <Link 
                  to={`/academy/${id}/reports`} 
                  className="block py-2 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ?“Š ë¦¬í¬??                </Link>
                <Link 
                  to={`/academy/${id}/gallery`} 
                  className="block py-2 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ?–¼ï¸?ê°¤ëŸ¬ë¦?                </Link>
                <Link 
                  to={`/academy/${id}/contact`} 
                  className="block py-2 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ?“ ë¬¸ì˜
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
