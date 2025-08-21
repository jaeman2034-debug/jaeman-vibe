import React, { useState, useEffect, useCallback } from 'react';
import { searchItemsByLocation, LocationSearchOptions } from '../../services/locationService';
import type { MarketItem, Location } from '../../features/market/types';

interface NearbyItemsSearchProps {
  userLocation: Location;
  onItemSelect?: (item: MarketItem) => void;
}

export default function NearbyItemsSearch({ userLocation, onItemSelect }: NearbyItemsSearchProps) {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LocationSearchOptions>({
    radiusKm: 10,
    limit: 20
  });

  // 근접 상품 검색
  const searchNearbyItems = useCallback(async () => {
    if (!userLocation) return;

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchItemsByLocation(userLocation, filters);
      setItems(results);
    } catch (err: any) {
      console.error('근접 검색 실패:', err);
      setError('근접 상품 검색 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, filters]);

  // 필터 변경 시 자동 검색
  useEffect(() => {
    if (userLocation) {
      searchNearbyItems();
    }
  }, [userLocation, filters, searchNearbyItems]);

  // 필터 업데이트
  const updateFilter = (key: keyof LocationSearchOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 상품 선택
  const handleItemSelect = (item: MarketItem) => {
    if (onItemSelect) {
      onItemSelect(item);
    }
  };

  // 거리 표시 포맷
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  // 가격 표시 포맷
  const formatPrice = (price: number): string => {
    return price.toLocaleString() + '원';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* 헤더 */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">📍 근처 상품</h3>
        <p className="text-sm text-gray-600 mt-1">
          {userLocation.address} 주변 {filters.radiusKm}km 이내의 상품
        </p>
      </div>

      {/* 필터 */}
      <div className="p-4 border-b bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 반경 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              검색 반경
            </label>
            <select
              value={filters.radiusKm}
              onChange={(e) => updateFilter('radiusKm', Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1km</option>
              <option value={3}>3km</option>
              <option value={5}>5km</option>
              <option value={10}>10km</option>
              <option value={20}>20km</option>
              <option value={50}>50km</option>
            </select>
          </div>

          {/* 카테고리 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => updateFilter('category', e.target.value || undefined)}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="축구화">축구화</option>
              <option value="유니폼">유니폼</option>
              <option value="보호장비">보호장비</option>
              <option value="볼/장비">볼/장비</option>
              <option value="트레이닝">트레이닝</option>
              <option value="기타">기타</option>
            </select>
          </div>

          {/* 가격 범위 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              최대 가격
            </label>
            <input
              type="number"
              placeholder="최대 가격"
              value={filters.maxPrice || ''}
              onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 상태 등급 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상태 등급
            </label>
            <select
              value={filters.condition || ''}
              onChange={(e) => updateFilter('condition', e.target.value || undefined)}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="A">A - 최상</option>
              <option value="B">B - 상</option>
              <option value="C">C - 하</option>
            </select>
          </div>
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="p-4">
        {isLoading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">근처 상품을 찾고 있습니다...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={searchNearbyItems}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              다시 시도
            </button>
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">🔍</div>
            <p className="text-gray-600">반경 {filters.radiusKm}km 이내에 상품이 없습니다.</p>
            <p className="text-sm text-gray-500 mt-1">검색 반경을 늘려보세요.</p>
          </div>
        )}

        {!isLoading && !error && items.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">
                총 <span className="font-semibold">{items.length}개</span>의 상품을 찾았습니다.
              </p>
              <button
                onClick={searchNearbyItems}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                새로고침
              </button>
            </div>

            {/* 상품 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemSelect(item)}
                  className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer group"
                >
                  {/* 상품 이미지 */}
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        📷
                      </div>
                    )}
                  </div>

                  {/* 상품 정보 */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition">
                      {item.title}
                    </h4>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600">
                        {formatPrice(item.price)}
                      </span>
                      <span className="text-sm text-gray-500">
                        📍 {formatDistance(item.distance || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item.category}</span>
                      {item.condition && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.condition === 'A' ? 'bg-green-100 text-green-800' :
                          item.condition === 'B' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.condition}등급
                        </span>
                      )}
                    </div>

                    {/* AI 품질 점수 */}
                    {item.ai?.quality_score && (
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${item.ai.quality_score * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round(item.ai.quality_score * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 