// src/features/market/components/MarketCardExample.tsx
import React from 'react';
import MarketCard from './MarketCard';
import LocationBadge from '@/components/location/LocationBadge';
import LocationSetup from '@/components/location/LocationSetup';

// 예시 데이터
const exampleItems = [
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
  }
];

export function MarketCardExample() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">MarketCard 사용 예시</h2>
      
      {/* 위치 설정 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">📍 위치 설정</h3>
        <LocationSetup />
      </div>

      {/* LocationBadge 독립 사용 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">🏷️ LocationBadge 독립 사용</h3>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-600">거리 표시:</span>
            <LocationBadge
              itemLocation={exampleItems[0].location}
              regionDong={exampleItems[0].region_dong}
              regionSigungu={exampleItems[0].region_sigungu}
              regionFull={exampleItems[0].region_full}
              showDistance={true}
              className="ml-2"
            />
          </div>
          <div>
            <span className="text-sm text-gray-600">행정동만 표시:</span>
            <LocationBadge
              itemLocation={exampleItems[0].location}
              regionDong={exampleItems[0].region_dong}
              regionSigungu={exampleItems[0].region_sigungu}
              regionFull={exampleItems[0].region_full}
              showDistance={false}
              className="ml-2"
            />
          </div>
          <div>
            <span className="text-sm text-gray-600">위치 없음:</span>
            <LocationBadge
              showDistance={true}
              className="ml-2"
            />
          </div>
        </div>
      </div>

      {/* MarketCard 그리드 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">🛍️ MarketCard 그리드</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exampleItems.map((item) => (
            <MarketCard
              key={item.id}
              item={item}
              onClick={(item) => console.log('클릭된 상품:', item)}
              showDistance={true}
            />
          ))}
        </div>
      </div>

      {/* 사용법 설명 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">📚 사용법</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>1. LocationBadge 독립 사용:</strong></p>
          <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
{`<LocationBadge
  itemLocation={item.location}
  regionDong={item.region_dong}
  showDistance={true}
/>`}
          </pre>
          
          <p><strong>2. MarketCard 내장 사용:</strong></p>
          <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
{`<MarketCard
  item={item}
  showDistance={true}
  onClick={handleItemClick}
/>`}
          </pre>
          
          <p><strong>3. 위치 설정:</strong></p>
          <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
{`<LocationSetup
  onLocationSet={handleLocationSet}
  showCurrentLocation={true}
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default MarketCardExample; 