// src/constants/routes.ts
// ? í”Œë¦¬ì??´ì…˜??ì£¼ìš” ê²½ë¡œ?¤ì„ ?ìˆ˜ë¡??•ì˜

export const ROUTES = {
  // ë©”ì¸ ê²½ë¡œ
  START: "/start",
  LOGIN: "/login",
  
  // ?€?œë³´??(ê¸°ë³¸ ?œë”©)
  DASHBOARD: "/market",
  HOME: "/home",
  
  // ê¸°ëŠ¥ë³?ê²½ë¡œ
  MARKET: "/market",
  MEET: "/meet",
  JOBS: "/jobs",
  GROUPS: "/groups",
  
  // ê³„ì • ê´€??
  ACCOUNT: "/account",
  PROFILE: "/profile",
  
  // ê¸°í?
  VOICE: "/voice",
  ADMIN: "/admin",
} as const;

// ê¸°ë³¸ ?€?œë³´??ê²½ë¡œ (ë¡œê·¸?????´ë™??ê³?
export const DEFAULT_DASHBOARD_PATH = ROUTES.DASHBOARD;

// ?€???•ì˜
export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];
