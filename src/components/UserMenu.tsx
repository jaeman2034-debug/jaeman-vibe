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
      navigate(ROUTES.START, { replace: true });   // ??로그?�웃 ???��??�로
    } catch (e) {
      console.error("logout failed", e);
      alert("로그?�웃???�패?�습?�다. ?�시 ?�도??주세??");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      {/* ?�로???�바?� 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="?�용??메뉴"
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

      {/* ?�롭?�운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {/* ?�용???�보 */}
            <div className="px-4 py-2 text-sm text-gray-700 border-b">
              <div className="font-medium">{user.email}</div>
              <div className="text-gray-500 text-xs">로그?�됨</div>
            </div>

            {/* 메뉴 ??��??*/}
            <button
              onClick={() => {
                navigate(ROUTES.ACCOUNT);
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              계정 ?�정
            </button>

            <button
              onClick={() => {
                navigate(ROUTES.MARKET);
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              마켓?�로 ?�동
            </button>

            {/* 로그?�웃 버튼 */}
            <button
              onClick={onLogout}
              disabled={isLoggingOut}
              className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                isLoggingOut
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              {isLoggingOut ? '로그?�웃 �?..' : '로그?�웃'}
            </button>
          </div>
        </div>
      )}

      {/* ?�롭?�운 ?��? ?�릭 ???�기 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
