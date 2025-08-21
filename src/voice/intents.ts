export type Intent =
  | "NAVIGATE"               // 페이지/카테고리 이동
  | "OPEN_MODAL"             // /voice 모달 열기
  | "CAPTURE_PRODUCT"        // 카메라 촬영
  | "REGISTER_PRODUCT"       // 상품 등록 플로우
  | "ANALYZE_PRODUCT"        // AI 분석
  | "LOCATION_ANALYSIS"      // 반경 검색
  | "HELP"
  | "CANCEL";

export type Entities = {
  page?: "home" | "market" | "meet" | "jobs" | "sell";
  category?: string;             // 축구화/유니폼 등
  radiusKm?: number;             // 0.5, 1, 2, 5 ...
  price?: number;                // 65000 등
};

export type Command = { intent: Intent; entities?: Entities; raw: string };

export const PAGE_SYNONYMS: Record<string, Entities["page"]> = {
  "홈": "home",
  "메인": "home",
  "홈페이지": "home",
  "마켓": "market",
  "시장": "market",
  "장터": "market",
  "모임": "meet",
  "모임페이지": "meet",
  "채용": "jobs",
  "구인": "jobs",
  "구직": "jobs",
  "등록": "sell",
  "상품등록": "sell",
}; 