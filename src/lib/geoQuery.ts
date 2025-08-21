import { geohashQueryBounds, distanceBetween } from 'geofire-common';
import { collection, getDocs, orderBy, query, startAt, endAt, limit } from 'firebase/firestore';
import { db } from '@/firebase';
import type { MarketItem } from '@/features/market/types';

export interface NearbySearchResult extends MarketItem {
  _dist: number; // 거리 (m 단위)
}

/**
 * 특정 위치 기준으로 반경 내 상품 검색
 * @param lat 위도
 * @param lng 경도
 * @param radiusInM 반경 (미터 단위, 기본값: 5000m = 5km)
 * @returns 거리순으로 정렬된 상품 목록
 */
export async function searchNearby(
  lat: number, 
  lng: number, 
  radiusInM: number = 5000
): Promise<NearbySearchResult[]> {
  // geohash 기반 쿼리 범위 계산
  const bounds = geohashQueryBounds([lat, lng], radiusInM);
  const col = collection(db, 'market_items');
  const results: any[] = [];

  // geohash 범위별 쿼리 후 합치기
  await Promise.all(bounds.map(async (b) => {
    try {
      const q = query(
        col, 
        orderBy('geo.geohash'), 
        startAt(b[0]), 
        endAt(b[1]), 
        limit(50)
      );
      const snap = await getDocs(q);
      snap.docs.forEach(d => {
        const data = d.data();
        // geo 필드가 있는 상품만 포함
        if (data.geo && data.geo.lat && data.geo.lng) {
          results.push({ id: d.id, ...data });
        }
      });
    } catch (error) {
      console.warn('geohash 쿼리 실패:', error);
      // 개별 쿼리 실패 시 계속 진행
    }
  }));

  // 원 밖 제거 + 거리 계산/정렬
  return results
    .map(r => ({
      ...r,
      _dist: distanceBetween([lat, lng], [r.geo?.lat, r.geo?.lng]) * 1000 // km -> m 변환
    }))
    .filter(r => isFinite(r._dist) && r._dist <= radiusInM) // 반경 내 상품만 필터링
    .sort((a, b) => a._dist - b._dist); // 거리순 정렬
}

/**
 * 특정 카테고리 내에서 반경 검색
 */
export async function searchNearbyByCategory(
  lat: number,
  lng: number,
  category: string,
  radiusInM: number = 5000
): Promise<NearbySearchResult[]> {
  const allResults = await searchNearby(lat, lng, radiusInM);
  return allResults.filter(item => item.category === category);
}

/**
 * 가격 범위 내에서 반경 검색
 */
export async function searchNearbyByPrice(
  lat: number,
  lng: number,
  minPrice: number,
  maxPrice: number,
  radiusInM: number = 5000
): Promise<NearbySearchResult[]> {
  const allResults = await searchNearby(lat, lng, radiusInM);
  return allResults.filter(item => 
    item.price >= minPrice && item.price <= maxPrice
  );
}

/**
 * 복합 조건으로 반경 검색
 */
export async function searchNearbyAdvanced(
  lat: number,
  lng: number,
  options: {
    radiusInM?: number;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: 'active' | 'reserved' | 'sold';
    maxResults?: number;
  } = {}
): Promise<NearbySearchResult[]> {
  const {
    radiusInM = 5000,
    category,
    minPrice,
    maxPrice,
    status = 'active',
    maxResults = 100
  } = options;

  let results = await searchNearby(lat, lng, radiusInM);

  // 카테고리 필터링
  if (category) {
    results = results.filter(item => item.category === category);
  }

  // 가격 범위 필터링
  if (minPrice !== undefined || maxPrice !== undefined) {
    results = results.filter(item => {
      if (minPrice !== undefined && item.price < minPrice) return false;
      if (maxPrice !== undefined && item.price > maxPrice) return false;
      return true;
    });
  }

  // 상태 필터링
  if (status) {
    results = results.filter(item => item.status === status);
  }

  // 결과 수 제한
  if (maxResults) {
    results = results.slice(0, maxResults);
  }

  return results;
}

// 추가 유틸리티 함수들
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return distanceBetween([lat1, lng1], [lat2, lng2]) * 1000; // 미터 단위로 변환
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

export function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
} 