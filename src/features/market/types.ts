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

// 상품 아이템 타입
export interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: typeof CATEGORIES[number];
  region: typeof REGIONS[number];
  images: string[];
  ownerId: string;
  createdAt: any; // Firestore Timestamp
  status: typeof ITEM_STATUS[number];
  
  // 구조화된 속성
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  
  // 상태 및 품질
  condition?: typeof CONDITION_GRADES[number];
  defects?: string[];
  
  // AI 분석 결과
  ai?: {
    quality_score: number;
    confidence: number;
    tags: string[];
    ocr?: string[];
    embedding?: number[]; // 벡터 검색용
  };
  
  // 지리 정보
  geo?: {
    latitude: number;
    longitude: number;
    geohash: string;
    region: typeof REGIONS[number];
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

// 위치 정보 타입
export interface Location {
  latitude: number;
  longitude: number;
  geohash: string;
  address?: string;
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
  ai?: {
    quality_score: number;
    confidence: number;
  };
}