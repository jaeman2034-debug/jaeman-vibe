// src/services/locationService.ts

import { collection, query, where, orderBy, limit, getDocs, GeoPoint } from 'firebase/firestore';
import { db } from '../firebase';
import type { Location } from '@/features/market/types';
import type { MarketItem } from '@/features/market/types';

// GeoFire 기반 지오해시 생성 (클라이언트용 간단 버전)
export const generateGeohash = (lat: number, lng: number, precision: number = 6): string => {
  // 실제로는 GeoFire 라이브러리 사용 권장
  // 여기서는 간단한 구현으로 대체
  
  const latitude = lat + 90;
  const longitude = lng + 180;
  
  let geohash = '';
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  
  for (let i = 0; i < precision; i++) {
    let char = 0;
    
    if (i % 2 === 0) {
      // 경도
      const mid = (lng + 180) / 2;
      if (longitude >= mid) {
        char |= 16;
        longitude = mid;
      } else {
        longitude = mid - 180;
      }
    } else {
      // 위도
      const mid = (lat + 90) / 2;
      if (latitude >= mid) {
        char |= 16;
        latitude = mid;
      } else {
        latitude = mid - 90;
      }
    }
    
    geohash += base32[char];
  }
  
  return geohash;
};

// 두 지점 간의 거리 계산 (Haversine 공식)
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// 지오해시 기반 근접 검색
export const findNearbyItems = async (
  userLocation: Location,
  radiusKm: number = 10,
  limitCount: number = 20
): Promise<MarketItem[]> => {
  try {
    // 지오해시 정밀도 결정 (반경에 따라)
    let precision = 6;
    if (radiusKm <= 1) precision = 7;
    else if (radiusKm <= 5) precision = 6;
    else if (radiusKm <= 20) precision = 5;
    else if (radiusKm <= 50) precision = 4;
    else precision = 3;
    
    const geohash = generateGeohash(userLocation.lat, userLocation.lng, precision);
    const geohashPrefix = geohash.substring(0, precision);
    
    // Firestore 쿼리 (지오해시 기반)
    const q = query(
      collection(db, 'market_items'),
      where('geo.geohash', '>=', geohashPrefix),
      where('geo.geohash', '<=', geohashPrefix + '\uf8ff'),
      where('status', '==', 'active'),
      orderBy('geo.geohash'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const items: MarketItem[] = [];
    
    querySnapshot.forEach((doc) => {
      const item = { id: doc.id, ...doc.data() } as MarketItem;
      
      // 거리 계산 및 필터링
      if (item.geo) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          item.geo.lat,
          item.geo.lng
        );
        
        if (distance <= radiusKm) {
          items.push({
            ...item,
            distance // 거리 정보 추가
          });
        }
      }
    });
    
    // 거리순 정렬
    return items.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
  } catch (error) {
    console.error('근접 상품 검색 실패:', error);
    return [];
  }
};

// 지역별 상품 검색
export const findItemsByRegion = async (
  region: string,
  limitCount: number = 20
): Promise<MarketItem[]> => {
  try {
    const q = query(
      collection(db, 'market_items'),
      where('geo.region', '==', region),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const items: MarketItem[] = [];
    
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as MarketItem);
    });
    
    return items;
    
  } catch (error) {
    console.error('지역별 상품 검색 실패:', error);
    return [];
  }
};

// 위치 기반 필터링
export const filterItemsByLocation = (
  items: MarketItem[],
  userLocation: Location,
  maxDistanceKm: number = 50
): MarketItem[] => {
  return items
    .filter(item => {
      if (!item.geo) return false;
      
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        item.geo.lat,
        item.geo.lng
      );
      
      return distance <= maxDistanceKm;
    })
    .map(item => ({
      ...item,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        item.geo!.lat,
        item.geo!.lng
      )
    }))
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
};

// 위치 정보 검증
export const validateLocation = (location: Location): boolean => {
  return (
    location.lat >= -90 && location.lat <= 90 &&
    location.lng >= -180 && location.lng <= 180 &&
    location.geohash && location.geohash.length > 0
  );
};

// 위치 정보 정규화
export const normalizeLocation = (location: Location): Location => {
  return {
    lat: Number(location.lat.toFixed(6)),
    lng: Number(location.lng.toFixed(6)),
    geohash: location.geohash,
    regionCode: location.regionCode
  };
};

// 위치 기반 추천 점수 계산
export const calculateLocationScore = (
  item: MarketItem,
  userLocation: Location,
  maxDistanceKm: number = 50
): number => {
  if (!item.geo) return 0;
  
  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    item.geo.lat,
    item.geo.lng
  );
  
  if (distance > maxDistanceKm) return 0;
  
  // 거리에 따른 점수 계산 (가까울수록 높은 점수)
  const distanceScore = Math.max(0, 1 - (distance / maxDistanceKm));
  
  // 지역 일치 시 추가 점수
  const regionBonus = item.geo.region === userLocation.address?.split(' ')[0] ? 0.2 : 0;
  
  return Math.min(1, distanceScore + regionBonus);
};

// 위치 기반 검색 옵션
export interface LocationSearchOptions {
  radiusKm?: number;
  region?: string;
  category?: string;
  maxPrice?: number;
  minPrice?: number;
  condition?: string;
  limit?: number;
}

// 통합 위치 기반 검색
export const searchItemsByLocation = async (
  userLocation: Location,
  options: LocationSearchOptions = {}
): Promise<MarketItem[]> => {
  try {
    const {
      radiusKm = 10,
      region,
      category,
      maxPrice,
      minPrice,
      condition,
      limit = 20
    } = options;
    
    // 기본 근접 검색
    let items = await findNearbyItems(userLocation, radiusKm, limit * 2);
    
    // 추가 필터링
    if (region) {
      items = items.filter(item => item.geo?.region === region);
    }
    
    if (category) {
      items = items.filter(item => item.category === category);
    }
    
    if (maxPrice !== undefined) {
      items = items.filter(item => item.price <= maxPrice);
    }
    
    if (minPrice !== undefined) {
      items = items.filter(item => item.price >= minPrice);
    }
    
    if (condition) {
      items = items.filter(item => item.condition === condition);
    }
    
    // 거리순 정렬 및 제한
    return items
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, limit);
      
  } catch (error) {
    console.error('위치 기반 검색 실패:', error);
    return [];
  }
}; 