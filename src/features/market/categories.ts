export type MarketCategory = {
  id: string;          // slug
  name: string;        // 표시명
  emoji?: string;      // 이모지 간단히
};

export const MARKET_CATEGORIES: MarketCategory[] = [
  { id: "baseball",   name: "야구",     emoji: "⚾" },
  { id: "football",   name: "축구",     emoji: "⚽" },
  { id: "basketball", name: "농구",     emoji: "🏀" },
  { id: "volleyball", name: "배구",     emoji: "🏐" },
  { id: "golf",       name: "골프",     emoji: "⛳" },
  { id: "tennis",     name: "테니스",   emoji: "🎾" },
  { id: "running",    name: "러닝",     emoji: "🏃" },
  { id: "outdoor",    name: "아웃도어", emoji: "🏔️" },
  { id: "fitness",    name: "피트니스", emoji: "💪" },
  { id: "esports",    name: "e스포츠",  emoji: "🎮" },
];