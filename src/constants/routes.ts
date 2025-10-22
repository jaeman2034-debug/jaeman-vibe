// src/constants/routes.ts
// ?�플리�??�션??주요 경로?�을 ?�수�??�의

export const ROUTES = {
  // 메인 경로
  START: "/start",
  LOGIN: "/login",
  
  // ?�?�보??(기본 ?�딩)
  DASHBOARD: "/market",
  HOME: "/home",
  
  // 기능�?경로
  MARKET: "/market",
  MEET: "/meet",
  JOBS: "/jobs",
  GROUPS: "/groups",
  
  // 계정 관??
  ACCOUNT: "/account",
  PROFILE: "/profile",
  
  // 기�?
  VOICE: "/voice",
  ADMIN: "/admin",
} as const;

// 기본 ?�?�보??경로 (로그?????�동??�?
export const DEFAULT_DASHBOARD_PATH = ROUTES.DASHBOARD;

// ?�???�의
export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];
