// featureFlags.ts - 기능 플래그 관리
export const ENABLE_VAD = false; // 이 화면은 VAD 미사용 (나중에 켤 때 true)

// 다른 기능 플래그들도 여기에 추가 가능
export const ENABLE_DEBUG_MODE = process.env.NODE_ENV === 'development';
export const ENABLE_ANALYTICS = true; 