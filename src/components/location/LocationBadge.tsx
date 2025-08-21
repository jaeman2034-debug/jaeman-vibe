// src/components/location/LocationBadge.tsx
import React from 'react';
import { haversineKm, formatDistance } from '@/lib/distance';
import { useLocationStore, isLocationValid } from '@/stores/locationStore';

interface LocationBadgeProps {
  itemLocation?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  regionDong?: string;
  regionSigungu?: string;
  regionFull?: string;
  showDistance?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LocationBadge({
  itemLocation,
  regionDong,
  regionSigungu,
  regionFull,
  showDistance = true,
  className = '',
  size = 'md'
}: LocationBadgeProps) {
  const { userLoc } = useLocationStore();
  const hasValidUserLocation = isLocationValid(userLoc);
  const hasItemLocation = itemLocation?.lat && itemLocation?.lng;

  // 거리 또는 행정동 표시 결정
  let displayText = '위치 미설정';
  let badgeType: 'distance' | 'region' | 'none' = 'none';
  let icon = '';

  if (hasItemLocation) {
    if (hasValidUserLocation && showDistance) {
      // 사용자 위치가 있고 거리 표시가 활성화된 경우
      const km = haversineKm(userLoc!, itemLocation!);
      displayText = formatDistance(km);
      icon = '📍';
    } else {
      // 행정동 정보 표시
      displayText = regionDong || regionSigungu || regionFull || '위치 정보';
      badgeType = 'region';
      icon = '🏠';
    }
  }

  // 크기별 스타일
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  // 타입별 색상
  const typeClasses = {
    distance: 'bg-green-100 text-green-800 border-green-200',
    region: 'bg-gray-100 text-gray-800 border-gray-200',
    none: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <span 
      className={`
        inline-flex items-center gap-1 rounded-full font-medium border
        ${sizeClasses[size]}
        ${typeClasses[badgeType]}
        ${className}
      `}
    >
      {icon && <span className="text-xs">{icon}</span>}
      {displayText}
    </span>
  );
}

// 기본 내보내기
export default LocationBadge; 