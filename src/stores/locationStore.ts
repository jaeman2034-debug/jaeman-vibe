// src/stores/locationStore.ts
import { create } from 'zustand';
import { getCurrentLocation } from '@/lib/locationService';

type UserLocation = { lat: number; lng: number; accuracy?: number; timestamp: number } | null;

export const useLocationStore = create<{
  userLoc: UserLocation;
  setUserLoc: (l: UserLocation) => void;
  load: () => void;
  clear: () => void;
  fetchCurrent: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}>(set => ({
  userLoc: null,
  isLoading: false,
  error: null,
  
  setUserLoc: (l) => { 
    if (l) {
      localStorage.setItem('userLoc', JSON.stringify(l)); 
    } else {
      localStorage.removeItem('userLoc');
    }
    set({ userLoc: l, error: null }); 
  },
  
  load: () => { 
    try {
      const raw = localStorage.getItem('userLoc');
      if (raw) {
        const parsed = JSON.parse(raw);
        // 24시간 이내의 위치 정보만 유효
        const oneDay = 24 * 60 * 60 * 1000;
        if (Date.now() - parsed.timestamp < oneDay) {
          set({ userLoc: parsed });
          return;
        }
      }
      // 유효하지 않으면 제거
      localStorage.removeItem('userLoc');
      set({ userLoc: null });
    } catch (error) {
      console.error('위치 정보 로드 실패:', error);
      localStorage.removeItem('userLoc');
      set({ userLoc: null });
    }
  },
  
  clear: () => {
    localStorage.removeItem('userLoc');
    set({ userLoc: null, error: null });
  },
  
  fetchCurrent: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const location = await getCurrentLocation();
      const userLocation: UserLocation = {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        timestamp: Date.now()
      };
      
      // localStorage에 저장하고 상태 업데이트
      localStorage.setItem('userLoc', JSON.stringify(userLocation));
      set({ userLoc: userLocation, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '위치를 가져올 수 없습니다.';
      set({ error: errorMessage, isLoading: false });
    }
  }
}));

// 위치 정보가 유효한지 확인하는 헬퍼 함수
export const isLocationValid = (location: UserLocation): boolean => {
  if (!location) return false;
  
  // 24시간 이내의 위치 정보만 유효
  const oneDay = 24 * 60 * 60 * 1000;
  if (Date.now() - location.timestamp > oneDay) return false;
  
  // 좌표 유효성 검사
  return (
    location.lat >= -90 && location.lat <= 90 &&
    location.lng >= -180 && location.lng <= 180
  );
};

// 기존 훅과의 호환성을 위한 별칭
export const useUserLocation = useLocationStore; 