import React, { useState, useEffect } from 'react';
import { addToFavorites, removeFromFavorites, isFavorite } from '../../services/favoriteService';
import { getUid } from '@/lib/auth';

interface FavoriteButtonProps {
  itemId: string;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
  onFavoriteChange?: (isFavorited: boolean) => void;
}

export function FavoriteButton({ 
  itemId, 
  size = 'md', 
  showCount = false,
  className = '',
  onFavoriteChange
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  // 안전한 UID 가져오기
  const uid = getUid();

  // 찜하기 상태 확인
  useEffect(() => {
    if (uid) {
      checkFavoriteStatus();
    }
  }, [uid, itemId]);

  const checkFavoriteStatus = async () => {
    if (!uid) return;
    
    try {
      const favorited = await isFavorite(uid, itemId);
      setIsFavorited(favorited);
    } catch (error) {
      console.error('찜하기 상태 확인 실패:', error);
    }
  };

  // 찜하기 토글
  const toggleFavorite = async () => {
    if (!uid) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isFavorited) {
        await removeFromFavorites(uid, itemId);
        setIsFavorited(false);
        onFavoriteChange?.(false);
      } else {
        await addToFavorites(uid, itemId);
        setIsFavorited(true);
        onFavoriteChange?.(true);
      }
    } catch (error) {
      console.error('찜하기 토글 실패:', error);
      alert('찜하기 처리에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 크기별 스타일
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6 text-sm';
      case 'lg':
        return 'w-10 h-10 text-lg';
      default: // md
        return 'w-8 h-8 text-base';
    }
  };

  // 하트 아이콘 색상
  const getHeartColor = () => {
    if (isFavorited) {
      return 'text-red-500 fill-current';
    }
    return 'text-gray-400 hover:text-red-400';
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <button
        disabled
        className={`${getSizeStyles()} flex items-center justify-center rounded-full bg-gray-100 text-gray-400 ${className}`}
      >
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleFavorite}
        className={`${getSizeStyles()} flex items-center justify-center rounded-full hover:bg-red-50 transition-all duration-200 ${getHeartColor()} ${className}`}
        title={isFavorited ? '찜 해제' : '찜하기'}
      >
        {isFavorited ? (
          // 찜한 상태: 채워진 하트
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        ) : (
          // 찜하지 않은 상태: 빈 하트
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        )}
      </button>

      {/* 찜한 사용자 수 표시 */}
      {showCount && favoriteCount > 0 && (
        <span className="text-sm text-gray-500">
          {favoriteCount}
        </span>
      )}
    </div>
  );
}

// default도 같이 export (import 방식에 상관없이 동작)
export default FavoriteButton; 