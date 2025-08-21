// src/lib/locationService.ts
export type LatLng = { lat: number; lng: number; accuracy?: number };

export async function getCurrentLocation(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      reject,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export async function reverseGeocode(lat: number, lng: number) {
  const key = import.meta.env.VITE_KAKAO_REST_KEY; // 예: 026b65...
  
  if (!key) {
    throw new Error('VITE_KAKAO_REST_KEY가 설정되지 않았습니다.');
  }

  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`,
      { headers: { Authorization: `KakaoAK ${key}` } }
    );
    
    if (!res.ok) {
      throw new Error(`카카오 API 오류: ${res.status}`);
    }
    
    const data = await res.json();
    
    if (!data.documents || data.documents.length === 0) {
      throw new Error('위치 정보를 찾을 수 없습니다.');
    }
    
    // 행정동 정보 우선 (H), 없으면 법정동 (B)
    const r = data.documents.find((d: any) => d.region_type === 'H') ?? data.documents[0];
    
    return {
      sido: r.region_1depth_name,
      sigungu: r.region_2depth_name,
      dong: r.region_3depth_name,
      full: `${r.region_1depth_name} ${r.region_2depth_name} ${r.region_3depth_name}`,
      regionType: r.region_type,
      regionCode: r.code
    };
  } catch (error) {
    console.error('역지오코딩 실패:', error);
    throw error;
  }
}

// 위치 정보 검증
export function validateLocation(lat: number, lng: number): boolean {
  return (
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !isNaN(lat) && !isNaN(lng)
  );
}

// 위치 정보 정규화
export function normalizeLocation(lat: number, lng: number): { lat: number; lng: number } {
  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6))
  };
} 