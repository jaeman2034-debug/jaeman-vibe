// src/features/market/components/MarketListWithLocation.tsx
import React, { useEffect, useState } from 'react';
import { useLocationStore } from '@/stores/locationStore';
import MarketCard from './MarketCard';
import LocationSetup from '@/components/location/LocationSetup';

// 예시 상품 데이터
const mockProducts = [
  {
    id: '1',
    title: '나이키 축구화',
    price: 80000,
    category: '축구화',
    condition: 'used',
    images: ['https://example.com/soccer-shoes.jpg'],
    location: { lat: 37.5665, lng: 126.9780, accuracy: 10 },
    region_dong: '삼성동',
    region_sigungu: '강남구',
    region_full: '서울특별시 강남구 삼성동',
    status: 'active',
    ownerId: 'user123',
    createdAt: new Date()
  },
  {
    id: '2',
    title: '아디다스 유니폼',
    price: 50000,
    category: '유니폼',
    condition: 'new',
    images: ['https://example.com/uniform.jpg'],
    location: { lat: 37.5665, lng: 126.9780, accuracy: 15 },
    region_dong: '역삼동',
    region_sigungu: '강남구',
    region_full: '서울특별시 강남구 역삼동',
    status: 'active',
    ownerId: 'user456',
    createdAt: new Date()
  },
  {
    id: '3',
    title: '축구공',
    price: 30000,
    category: '볼/장비',
    condition: 'used',
    images: ['https://example.com/soccer-ball.jpg'],
    location: { lat: 37.5665, lng: 126.9780, accuracy: 20 },
    region_dong: '청담동',
    region_sigungu: '강남구',
    region_full: '서울특별시 강남구 청담동',
    status: 'active',
    ownerId: 'user789',
    createdAt: new Date()
  }
];

export function MarketListWithLocation() {
  const { userLoc, load, isLoading } = useLocationStore();
  const [showLocationSetup, setShowLocationSetup] = useState(false);

  // 컴포넌트 마운트 시 저장된 위치 정보 자동 로드
  useEffect(() => {
    load(); // localStorage에서 위치 정보 읽어오기
  }, [load]);

  const handleProductClick = (product: any) => {
    console.log('상품 클릭:', product);
    // 상품 상세 페이지로 이동 또는 모달 열기
  };

  const handleLocationSet = (location: { lat: number; lng: number; accuracy?: number }) => {
    console.log('위치 설정됨:', location);
    setShowLocationSetup(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">스포츠 마켓</h1>
        
        {/* 위치 설정 버튼 */}
        <button
          onClick={() => setShowLocationSetup(!showLocationSetup)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {userLoc ? '📍 위치 설정됨' : '📍 위치 설정'}
        </button>
      </div>

      {/* 위치 설정 패널 */}
      {showLocationSetup && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <LocationSetup
            onLocationSet={handleLocationSet}
            showCurrentLocation={true}
          />
        </div>
      )}

      {/* 현재 위치 상태 표시 */}
      {userLoc && (
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="text-sm text-green-800">
            <strong>📍 현재 위치:</strong> {userLoc.lat.toFixed(6)}, {userLoc.lng.toFixed(6)}
            {userLoc.accuracy && ` (정확도: ${userLoc.accuracy}m)`}
          </div>
          <div className="text-xs text-green-600 mt-1">
            거리 기반 정렬 및 필터링이 활성화되었습니다.
          </div>
        </div>
      )}

      {/* 상품 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProducts.map((product) => (
          <MarketCard
            key={product.id}
            item={product}
            onClick={handleProductClick}
            showDistance={true} // 사용자 위치가 있으면 거리 표시
          />
        ))}
      </div>

      {/* 위치 정보가 없을 때 안내 */}
      {!userLoc && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg mb-2">📍 위치 정보를 설정해주세요</div>
          <div className="text-sm">
            위치를 설정하면 상품과의 거리를 확인할 수 있습니다.
          </div>
          <button
            onClick={() => setShowLocationSetup(true)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            위치 설정하기
          </button>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg">📍 위치 확인 중...</div>
        </div>
      )}
    </div>
  );
}

export default MarketListWithLocation; 