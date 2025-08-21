// src/components/location/LocationSetup.tsx
import React, { useEffect } from 'react';
import { useLocationStore } from '@/stores/locationStore';

interface LocationSetupProps {
  onLocationSet?: (location: { lat: number; lng: number; accuracy?: number }) => void;
  showCurrentLocation?: boolean;
  className?: string;
}

export function LocationSetup({
  onLocationSet,
  showCurrentLocation = true,
  className = ''
}: LocationSetupProps) {
  const { 
    userLoc, 
    isLoading, 
    error, 
    fetchCurrent, 
    clear 
  } = useLocationStore();

  useEffect(() => {
    // 컴포넌트 마운트 시 위치 정보가 있으면 콜백 호출
    if (userLoc && onLocationSet) {
      onLocationSet(userLoc);
    }
  }, [userLoc, onLocationSet]);

  const handleGetLocation = async () => {
    try {
      await fetchCurrent();
    } catch (error) {
      console.error('위치 가져오기 실패:', error);
    }
  };

  const handleClearLocation = () => {
    clear();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 현재 위치 표시 */}
      {showCurrentLocation && userLoc && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-green-800">
              <div className="font-medium">📍 현재 위치</div>
              <div className="text-xs">
                {userLoc.lat.toFixed(6)}, {userLoc.lng.toFixed(6)}
              </div>
              {userLoc.accuracy && (
                <div className="text-xs">정확도: {userLoc.accuracy}m</div>
              )}
            </div>
            <button
              onClick={handleClearLocation}
              className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
            >
              초기화
            </button>
          </div>
        </div>
      )}

      {/* 위치 설정 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={handleGetLocation}
          disabled={isLoading}
          className={`
            flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors
            ${isLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {isLoading ? '위치 확인 중...' : '📍 현재 위치 사용'}
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-800">
            <div className="font-medium">❌ 위치 가져오기 실패</div>
            <div className="text-xs mt-1">{error}</div>
          </div>
        </div>
      )}

      {/* 도움말 */}
      <div className="text-xs text-gray-500">
        <p>• 위치 정보는 상품 검색과 거리 계산에 사용됩니다</p>
        <p>• 브라우저에서 위치 접근을 허용해주세요</p>
        <p>• 위치 정보는 로컬에 저장되며 24시간 후 만료됩니다</p>
      </div>
    </div>
  );
}

// 기본 내보내기
export default LocationSetup; 