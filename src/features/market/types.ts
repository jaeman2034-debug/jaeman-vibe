import type { Timestamp } from "firebase/firestore";

// src/features/market/types.ts

// 상품 카테고리
export const CATEGORIES = [
  '축구화', '유니폼', '보호장비', '볼/장비', '트레이닝', '기타'
] as const;

// 지역
export const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
] as const;

// 상품 상태
export const ITEM_STATUS = ['active', 'sold'] as const;

export const CONDITION_GRADES = ['A', 'B', 'C'] as const; // A: 최상, B: 상, C: 하

// 위치 정보 타입 (새로 추가)
export type Geo = {
  lat: number;
  lng: number;
  geohash: string;
  accuracy?: number;  // 브라우저가 준 정확도(m)
  ts?: number;        // 저장 시각
};

export type Location = {
  lat: number;
  lng: number;
  geohash?: string;
  regionCode?: string | null;
};

// 기본 좌표 상수 (런타임 값으로 사용)
export const LOCATION_DEFAULT = { lat: 37.5665, lng: 126.9780 } as const; // 서울 시청
export const LOCATION_EMPTY = { lat: 0, lng: 0 } as const;

export type Condition = '새상품' | '최상' | '상' | '중' | '하';

export interface MarketItem {
  id?: string;
  title: string;
  price: number;
  description: string;
  category?: typeof CATEGORIES[number];
  region?: typeof REGIONS[number];
  images: string[];
  ownerId: string;
  createdAt?: any;  // Timestamp | Date (간단히 any)
  status: 'active' | 'reserved' | 'sold';
  geo?: Geo | null;  // 새로운 Geo 타입 사용
  ai?: {
    category?: string;
    condition?: string;
    tags?: string[];
    brand?: string;
    color?: string;
    title?: string;
  };
}

// 사용자 타입
export interface User {
  uid: string;
  nickname: string;
  phone?: string;
  profileImage?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  
  // 위치 정보
  location?: {
    latitude: number;
    longitude: number;
    geohash: string;
    address?: string;
  };
  
  // 선호도 설정
  preferences?: {
    favoriteCategories: string[];
    priceRange: {
      min: number;
      max: number;
    };
    preferredRegions: string[];
  };
}

// 채팅방 타입
export interface ChatRoom {
  id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  lastMessage?: string;
  lastMessageAt?: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

// 채팅 메시지 타입
export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'offer';
  createdAt: any; // Firestore Timestamp
}

// 찜하기 타입
export interface Favorite {
  id: string;
  userId: string;
  itemId: string;
  createdAt: any; // Firestore Timestamp
}

// 찜하기 상세 타입 (상품 정보 포함)
export interface FavoriteWithItem extends Favorite {
  item: MarketItem;
}

// 가격 제안 타입
export interface Offer {
  id: string;
  itemId: string;
  buyerId: string;
  price: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

// 필터 타입
export interface MarketFilters {
  category?: typeof CATEGORIES[number] | null;
  region?: typeof REGIONS[number] | null;
  priceRange?: {
    min: number;
    max: number;
  } | null;
  condition?: typeof CONDITION_GRADES[number] | null;
  brand?: string | null;
  status?: typeof ITEM_STATUS[number] | null;
  sort?: 'latest' | 'price_asc' | 'price_desc' | 'popular' | 'distance' | 'relevance';
}

// AI 분석 결과 타입
export interface ProductAnalysis {
  // 기본 정보
  category: string;
  brand: string;
  model: string;
  color: string;
  size: string;
  
  // 상태 및 품질
  condition: typeof CONDITION_GRADES[number];
  defects: string[];
  
  // AI 생성 콘텐츠
  suggestedTitle: string;
  suggestedDescription: string;
  tags: string[];
  
  // AI 분석 결과
  ai: {
    quality_score: number;
    confidence: number;
    ocr: string[];
    embedding?: number[];
  };
}



// 검색 결과 타입
export interface SearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  region: string;
  distance?: number;
  relevance: number;
  imageUrl: string;
  createdAt?: any; // Firestore Timestamp
  ai?: {
    quality_score: number;
    confidence: number;
  };
}