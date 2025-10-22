import React, { useEffect, useRef } from 'react';
import { useKakaoMaps } from '../hooks/useKakaoMaps';

interface KakaoMapProps {
  latitude?: number;
  longitude?: number;
  level?: number;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export const KakaoMap: React.FC<KakaoMapProps> = ({
  latitude = 37.5665,
  longitude = 126.9780,
  level = 3,
  className = '',
  style = { width: '100%', height: '400px' }
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const { isLoaded, error } = useKakaoMaps();

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.kakao) return;

    try {
      // 지???�성
      const container = mapRef.current;
      const options = {
        center: new window.kakao.maps.LatLng(latitude, longitude),
        level: level
      };
      
      const map = new window.kakao.maps.Map(container, options);

      // 마커 ?�성
      const markerPosition = new window.kakao.maps.LatLng(latitude, longitude);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition
      });
      
      marker.setMap(map);

    } catch (err) {
      console.error('카카??지??초기???�류:', err);
    }
  }, [isLoaded, latitude, longitude, level]);

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 text-red-500">
        지??로드 ?�류: {error}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-4 text-gray-500">
        지?��? 불러?�는 �?..
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={className}
      style={style}
    />
  );
};
