// src/features/market/components/MarketCard.tsx
import React from 'react';
import { haversineKm, formatDistance } from '@/lib/distance';
import { useLocationStore, isLocationValid } from '@/stores/locationStore';

interface MarketItem {
  id: string;
  title: string;
  price: number;
  description?: string;
  category: string;
  condition: string;
  images?: string[];
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  region_dong?: string;
  region_sigungu?: string;
  region_full?: string;
  createdAt: any;
  ownerId: string;
  status: string;
}

interface MarketCardProps {
  item: MarketItem;
  onClick?: (item: MarketItem) => void;
  showDistance?: boolean;
}

export function MarketCard({ item, onClick, showDistance = true }: MarketCardProps) {
  const { userLoc } = useLocationStore();
  const hasValidUserLocation = isLocationValid(userLoc);
  const hasItemLocation = item?.location?.lat && item?.location?.lng;

  // 거리 또는 행정동 표시 결정
  let locationBadge = '위치 미설정';
  let badgeType: 'distance' | 'region' | 'none' = 'none';

  if (hasItemLocation) {
    if (hasValidUserLocation && showDistance) {
      // 사용자 위치가 있고 거리 표시가 활성화된 경우
      const km = haversineKm(userLoc!, item.location!);
      locationBadge = formatDistance(km);
      badgeType = 'distance';
    } else {
      // 행정동 정보 표시
      locationBadge = item.region_dong || item.region_sigungu || item.region_full || '위치 정보';
      badgeType = 'region';
    }
  }

  const handleClick = () => {
    if (onClick) {
      onClick(item);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      {/* 썸네일 */}
      <div className="aspect-square bg-gray-100 relative">
        {item.images && item.images.length > 0 ? (
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* 상태 뱃지 */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {item.status === 'active' ? '판매중' : '판매완료'}
          </span>
        </div>
      </div>

      {/* 내용 */}
      <div className="p-4">
        {/* 제목 */}
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
          {item.title}
        </h3>

        {/* 가격 */}
        <div className="text-lg font-bold text-gray-900 mb-2">
          {item.price > 0 ? `${item.price.toLocaleString()}원` : '가격 협의'}
        </div>

        {/* 카테고리 */}
        <div className="text-xs text-gray-500 mb-2">
          {item.category}
        </div>

        {/* 위치 정보 */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {item.region_dong || item.region_sigungu || item.region_full || '위치 미설정'}
          </div>
          
          {/* 거리/행정동 뱃지 */}
          <span 
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              badgeType === 'distance' 
                ? 'bg-green-100 text-green-800' 
                : badgeType === 'region'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {badgeType === 'distance' && '📍 '}
            {locationBadge}
          </span>
        </div>
      </div>
    </div>
  );
}

// 기본 내보내기
export default MarketCard; 