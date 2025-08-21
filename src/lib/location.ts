import { geohashForLocation, distanceBetween } from 'geofire-common';
import type { Geo } from '@/features/market/types';

/**
 * 현재 위치 가져오기
 */
export function getCurrentPosition(opts: PositionOptions = {
  enableHighAccuracy: true, 
  timeout: 8000,
  maximumAge: 60000 // 1분 캐시
}): Promise<GeolocationPosition> {
  return new Promise((res, rej) =>
    navigator.geolocation.getCurrentPosition(res, rej, opts)
  );
}

/**
 * 현재 위치를 Geo 타입으로 변환
 */
export async function getCurrentGeo(): Promise<Geo> {
  const p = await getCurrentPosition();
  const lat = p.coords.latitude;
  const lng = p.coords.longitude;
  
  return {
    lat, 
    lng,
    geohash: geohashForLocation([lat, lng]),
    accuracy: p.coords.accuracy,
    ts: Date.now(),
  };
}

/**
 * 두 지점 간의 거리 계산 (Haversine 공식)
 */
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // km 단위
}

/**
 * 거리를 사용자 친화적인 텍스트로 변환
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
}

/**
 * 특정 위치에서의 거리를 사용자 친화적으로 표시
 * @param lat 대상 위도
 * @param lng 대상 경도
 * @param me 사용자 위치 {lat, lng}
 * @returns "1.2km" 또는 "800m" 형태의 문자열
 */
export function formatDistanceFrom(
  lat: number, 
  lng: number, 
  me: { lat: number; lng: number }
): string {
  const m = distanceBetween([lat, lng], [me.lat, me.lng]) * 1000;
  return m >= 1000 ? `${(m/1000).toFixed(1)}km` : `${m|0}m`;
}

/**
 * 위치 권한 상태 확인
 */
export async function checkLocationPermission(): Promise<PermissionState> {
  if (!navigator.permissions) {
    return 'granted'; // 권한 API를 지원하지 않는 경우
  }
  
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return result.state;
  } catch {
    return 'granted'; // 권한 API 오류 시 기본값
  }
}

/**
 * 위치 권한 요청
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const geo = await getCurrentGeo();
    return !!geo;
  } catch (error) {
    console.error('위치 권한 요청 실패:', error);
    return false;
  }
}

/**
 * localStorage에서 사용자 위치 가져오기
 */
export function getUserLocationFromStorage(): { lat: number; lng: number } | null {
  try {
    const stored = localStorage.getItem('userLocation');
    if (stored) {
      const location = JSON.parse(stored);
      // 저장된 위치가 24시간 이내인지 확인
      if (location.ts && Date.now() - location.ts < 24 * 60 * 60 * 1000) {
        return { lat: location.lat, lng: location.lng };
      }
    }
  } catch (error) {
    console.warn('저장된 위치 정보 파싱 실패:', error);
  }
  return null;
}

/**
 * 사용자 위치를 localStorage에 저장
 */
export function saveUserLocationToStorage(lat: number, lng: number): void {
  try {
    const location = { lat, lng, ts: Date.now() };
    localStorage.setItem('userLocation', JSON.stringify(location));
  } catch (error) {
    console.warn('위치 정보 저장 실패:', error);
  }
}

/**
 * 사용자 위치 가져오기 (저장된 위치 우선, 없으면 새로 요청)
 */
export async function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  // 먼저 저장된 위치 확인
  const stored = getUserLocationFromStorage();
  if (stored) {
    return stored;
  }

  // 저장된 위치가 없으면 새로 요청
  try {
    const geo = await getCurrentGeo();
    saveUserLocationToStorage(geo.lat, geo.lng);
    return { lat: geo.lat, lng: geo.lng };
  } catch (error) {
    console.warn('위치 정보 가져오기 실패:', error);
    return null;
  }
} 