import { geohashQueryBounds, distanceBetween } from 'geofire-common';
import { getDocs, limit, orderBy, query, startAt, endAt, collection } from 'firebase/firestore';
import { db } from '@/firebase';

export async function searchNearby(lat: number, lng: number, radiusInM = 5000) {
  const bounds = geohashQueryBounds([lat, lng], radiusInM);
  const results: any[] = [];
  
  await Promise.all(bounds.map(async (b) => {
    const q = query(
      collection(db, 'market_items'),
      orderBy('geo.geohash'),
      startAt(b[0]), 
      endAt(b[1]),
      limit(50)
    );
    const snap = await getDocs(q);
    snap.docs.forEach(d => results.push({ id: d.id, ...d.data() }));
  }));
  
  // 원 밖 제거 + 거리 정렬
  return results
    .map(r => ({ 
      ...r, 
      _dist: distanceBetween([lat, lng], [r.geo?.lat, r.geo?.lng]) * 1000 
    }))
    .filter(r => r._dist <= radiusInM)
    .sort((a, b) => a._dist - b._dist);
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

// 특정 카테고리 내에서 근처 검색
export async function searchNearbyByCategory(
  lat: number, 
  lng: number, 
  category: string, 
  radiusInM = 5000
) {
  const bounds = geohashQueryBounds([lat, lng], radiusInM);
  const results: any[] = [];
  
  await Promise.all(bounds.map(async (b) => {
    const q = query(
      collection(db, 'market_items'),
      orderBy('geo.geohash'),
      startAt(b[0]), 
      endAt(b[1]),
      limit(50)
    );
    const snap = await getDocs(q);
    snap.docs.forEach(d => {
      const data = d.data();
      if (data.category === category) {
        results.push({ id: d.id, ...data });
      }
    });
  }));
  
  return results
    .map(r => ({ 
      ...r, 
      _dist: distanceBetween([lat, lng], [r.geo?.lat, r.geo?.lng]) * 1000 
    }))
    .filter(r => r._dist <= radiusInM)
    .sort((a, b) => a._dist - b._dist);
}

// 가격 범위와 거리를 모두 고려한 검색
export async function searchNearbyWithFilters(
  lat: number,
  lng: number,
  radiusInM = 5000,
  filters: {
    minPrice?: number;
    maxPrice?: number;
    category?: string;
    condition?: string;
  } = {}
) {
  const bounds = geohashQueryBounds([lat, lng], radiusInM);
  const results: any[] = [];
  
  await Promise.all(bounds.map(async (b) => {
    const q = query(
      collection(db, 'market_items'),
      orderBy('geo.geohash'),
      startAt(b[0]), 
      endAt(b[1]),
      limit(100) // 필터링 후 결과가 적을 수 있으므로 더 많이 가져옴
    );
    const snap = await getDocs(q);
    snap.docs.forEach(d => {
      const data = d.data();
      let include = true;
      
      // 카테고리 필터
      if (filters.category && data.category !== filters.category) {
        include = false;
      }
      
      // 가격 범위 필터
      if (filters.minPrice !== undefined && data.price < filters.minPrice) {
        include = false;
      }
      if (filters.maxPrice !== undefined && data.price > filters.maxPrice) {
        include = false;
      }
      
      // 상태 필터
      if (filters.condition && data.ai?.condition !== filters.condition) {
        include = false;
      }
      
      if (include) {
        results.push({ id: d.id, ...data });
      }
    });
  }));
  
  return results
    .map(r => ({ 
      ...r, 
      _dist: distanceBetween([lat, lng], [r.geo?.lat, r.geo?.lng]) * 1000 
    }))
    .filter(r => r._dist <= radiusInM)
    .sort((a, b) => a._dist - b._dist);
} 