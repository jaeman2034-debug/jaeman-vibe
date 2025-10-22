// src/components/UserMenu.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { logout } from '@/features/auth/authService';
import { ROUTES } from '@/constants/routes';

export default function UserMenu() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const onLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate(ROUTES.START, { replace: true });   // ??ë¡œê·¸?„ì›ƒ ???¤í??¸ë¡œ
    } catch (e) {
      console.error("logout failed", e);
      alert("ë¡œê·¸?„ì›ƒ???¤íŒ¨?ˆìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„??ì£¼ì„¸??");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      {/* ?„ë¡œ???„ë°”?€ ë²„íŠ¼ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="?¬ìš©??ë©”ë‰´"
      >
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="text-sm text-gray-700 hidden sm:block">
          {user.email}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ?œë¡­?¤ìš´ ë©”ë‰´ */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {/* ?¬ìš©???•ë³´ */}
            <div className="px-4 py-2 text-sm text-gray-700 border-b">
              <div className="font-medium">{user.email}</div>
              <div className="text-gray-500 text-xs">ë¡œê·¸?¸ë¨</div>
            </div>

            {/* ë©”ë‰´ ??ª©??*/}
            <button
              onClick={() => {
                navigate(ROUTES.ACCOUNT);
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              ê³„ì • ?¤ì •
            </button>

            <button
              onClick={() => {
                navigate(ROUTES.MARKET);
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              ë§ˆì¼“?¼ë¡œ ?´ë™
            </button>

            {/* ë¡œê·¸?„ì›ƒ ë²„íŠ¼ */}
            <button
              onClick={onLogout}
              disabled={isLoggingOut}
              className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                isLoggingOut
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              {isLoggingOut ? 'ë¡œê·¸?„ì›ƒ ì¤?..' : 'ë¡œê·¸?„ì›ƒ'}
            </button>
          </div>
        </div>
      )}

      {/* ?œë¡­?¤ìš´ ?¸ë? ?´ë¦­ ???«ê¸° */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
