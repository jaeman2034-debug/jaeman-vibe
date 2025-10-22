// src/features/market/components/MarketCard.tsx
import React from 'react';
import { haversineKm, formatDistance } from '@/lib/distance';
import { useLocationStore, isLocationValid } from '@/stores/locationStore';
import { StatusBadge } from '@/components/StatusBadge';

interface MarketItem {
  id: string;
  title: string;
  price: number;
  description?: string;
  category: string;
  condition: string;
  images?: string[];
  thumbUrl?: string; // 추가: 목록용 썸네일 URL
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

  // 카드에서 커버 선택 (안전한 폴백 체인)
  const src =
    item.thumbUrl ??
    item.images?.[0]?.url ??
    '/placeholder.png';

  // 거리 표시 여정/지역 표시 결정
  let locationBadge = '위치 미설정';
  let badgeType: 'distance' | 'region' | 'none' = 'none';

  if (hasItemLocation) {
    if (hasValidUserLocation && showDistance) {
      // 사용자 위치가 있고 거리 표시가 활성화된 경우
      const km = haversineKm(userLoc!, item.location!);
      locationBadge = formatDistance(km);
      badgeType = 'distance';
    } else {
      // 지역 정보 표시
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
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative"
      onClick={handleClick}
    >
      {/* 썸네일 */}
      <div className="relative">
        <img
          src={src}
          alt={item.title ?? '상품 이미지'}
          className="block w-full h-40 object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        
        {/* 상태 뱃지 */}
        <StatusBadge status={item.status} />
      </div>

      {/* 내용 */}
      <div className="p-4">
        {/* 제목 */}
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
          {item.title}
        </h3>

        {/* 가격 */}
        <div className="text-lg font-bold text-gray-900 mb-2">
          {item.price > 0 ? `${item.price.toLocaleString()}원` : '가격 미정'}
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
          
          {/* 거리/지역 뱃지 */}
          <span 
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              badgeType === 'distance' 
                ? 'bg-green-100 text-green-800' 
                : badgeType === 'region'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {badgeType === 'distance' && '거리 '}
            {locationBadge}
          </span>
        </div>
      </div>
    </div>
  );
}

// 기본 내보내기
export default MarketCard;