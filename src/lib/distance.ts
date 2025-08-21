// src/lib/distance.ts
export function haversineKm(a: {lat: number; lng: number}, b: {lat: number; lng: number}) {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(km < 10 ? 1 : 0)}km`;
}

// 거리 기반 정렬을 위한 비교 함수
export function compareByDistance(a: any, b: any, userLocation: {lat: number; lng: number}) {
  if (!a.location || !b.location) return 0;
  
  const distA = haversineKm(userLocation, a.location);
  const distB = haversineKm(userLocation, b.location);
  
  return distA - distB;
}

// 거리 범위 필터링
export function filterByDistance(items: any[], userLocation: {lat: number; lng: number}, maxKm: number) {
  return items.filter(item => {
    if (!item.location) return false;
    const distance = haversineKm(userLocation, item.location);
    return distance <= maxKm;
  });
} 