// src/services/searchService.ts

import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '../firebase';
import type { MarketItem, SearchResult, Location } from '../features/market/types';
import { searchItemsByLocation, calculateLocationScore } from './locationService';

// 검색 타입 정의
export type SearchType = 'text' | 'image' | 'voice' | 'semantic';

// 검색 필터 인터페이스
export interface SearchFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  condition?: string;
  region?: string;
  radiusKm?: number;
  brand?: string;
  tags?: string[];
}

// 검색 옵션 인터페이스
export interface SearchOptions {
  type: SearchType;
  query: string;
  filters?: SearchFilters;
  userLocation?: Location;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'distance' | 'price' | 'freshness' | 'popularity';
}

// 검색 결과 인터페이스
export interface SearchResultWithScore extends SearchResult {
  finalScore: number;
  relevance: number;
  distance?: number;
  freshness: number;
  popularity: number;
}

// 텍스트 검색 (Algolia/Meilisearch 시뮬레이션)
export const performTextSearch = async (
  query: string,
  filters?: SearchFilters,
  limitCount: number = 20
): Promise<SearchResult[]> => {
  try {
    // 실제로는 Algolia/Meilisearch API 호출
    // 여기서는 Firestore 기반 시뮬레이션
    
    let q = query(
      collection(db, 'market_items'),
      where('status', '==', 'active')
    );

    // 카테고리 필터
    if (filters?.category) {
      q = query(q, where('category', '==', filters.category));
    }

    // 가격 범위 필터
    if (filters?.priceRange) {
      if (filters.priceRange.min > 0) {
        q = query(q, where('price', '>=', filters.priceRange.min));
      }
      if (filters.priceRange.max < 1000000) {
        q = query(q, where('price', '<=', filters.priceRange.max));
      }
    }

    // 상태 등급 필터
    if (filters?.condition) {
      q = query(q, where('condition', '==', filters.condition));
    }

    // 지역 필터
    if (filters?.region) {
      q = query(q, where('geo.region', '==', filters.region));
    }

    // 기본 정렬 (최신순)
    q = query(q, orderBy('createdAt', 'desc'), limit(limitCount));

    const querySnapshot = await getDocs(q);
    const results: SearchResult[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as MarketItem;
      
      // 텍스트 관련성 계산 (간단한 키워드 매칭)
      const relevance = calculateTextRelevance(query, data);
      
      if (relevance > 0.1) { // 최소 관련성 임계값
                 results.push({
           id: doc.id,
           title: data.title,
           description: data.description,
           price: data.price,
           category: data.category,
           region: data.region || '지역 정보 없음',
           distance: undefined, // 위치 기반 검색에서 계산
           relevance,
           imageUrl: data.images?.[0] || '/placeholder.jpg',
           ai: data.ai,
           createdAt: data.createdAt
         });
      }
    });

    // 관련성 순으로 정렬
    return results.sort((a, b) => b.relevance - a.relevance);

  } catch (error) {
    console.error('텍스트 검색 실패:', error);
    return [];
  }
};

// 이미지 검색 (CLIP/OpenAI Vision 시뮬레이션)
export const performImageSearch = async (
  imageFile: File,
  filters?: SearchFilters,
  limitCount: number = 20
): Promise<SearchResult[]> => {
  try {
    // 실제로는 이미지 임베딩 생성 후 벡터 DB 검색
    // 여기서는 시뮬레이션
    
    // 이미지 분석 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 유사한 상품 검색 결과 시뮬레이션
    const mockResults: SearchResult[] = [
      {
        id: 'img-1',
        title: '업로드 이미지와 유사한 축구화',
        description: '이미지 분석 결과와 가장 유사한 상품',
        price: 180000,
        category: '축구화',
        region: '서울',
        distance: undefined,
        relevance: 0.85,
        imageUrl: '/mock-similar-shoe.jpg',
        ai: { quality_score: 0.82, confidence: 0.88 }
      },
      {
        id: 'img-2',
        title: '유사한 스타일의 축구화',
        description: '디자인과 색상이 유사한 상품',
        price: 150000,
        category: '축구화',
        region: '부산',
        distance: undefined,
        relevance: 0.78,
        imageUrl: '/mock-similar-style.jpg',
        ai: { quality_score: 0.75, confidence: 0.81 }
      }
    ];

    // 필터 적용
    return applyFilters(mockResults, filters);

  } catch (error) {
    console.error('이미지 검색 실패:', error);
    return [];
  }
};

// 음성 검색 (Web Speech API 시뮬레이션)
export const performVoiceSearch = async (
  audioBlob: Blob,
  filters?: SearchFilters,
  limitCount: number = 20
): Promise<SearchResult[]> => {
  try {
    // 실제로는 Web Speech API 또는 음성 인식 서비스 사용
    // 여기서는 시뮬레이션
    
    // 음성 인식 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 음성 검색 결과 시뮬레이션
    const mockResults: SearchResult[] = [
      {
        id: 'voice-1',
        title: '음성 검색: 축구화',
        description: '음성으로 검색한 축구화 상품',
        price: 95000,
        category: '축구화',
        region: '인천',
        distance: undefined,
        relevance: 0.72,
        imageUrl: '/mock-voice-result.jpg',
        ai: { quality_score: 0.68, confidence: 0.75 }
      }
    ];

    return applyFilters(mockResults, filters);

  } catch (error) {
    console.error('음성 검색 실패:', error);
    return [];
  }
};

// 의미 검색 (임베딩 기반 시뮬레이션)
export const performSemanticSearch = async (
  query: string,
  filters?: SearchFilters,
  limitCount: number = 20
): Promise<SearchResult[]> => {
  try {
    // 실제로는 OpenAI/Vertex AI 임베딩 생성 후 Pinecone/Weaviate 검색
    // 여기서는 시뮬레이션
    
    // 의미 분석 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 의미적 유사성 기반 검색 결과 시뮬레이션
    const mockResults: SearchResult[] = [
      {
        id: 'semantic-1',
        title: '의미적 유사성 기반 검색 결과',
        description: '임베딩 벡터 유사도로 찾은 상품',
        price: 135000,
        category: '축구화',
        region: '대구',
        distance: undefined,
        relevance: 0.91,
        imageUrl: '/mock-semantic-result.jpg',
        ai: { quality_score: 0.85, confidence: 0.88 }
      },
      {
        id: 'semantic-2',
        title: '컨텍스트 기반 추천 상품',
        description: '검색어의 맥락을 고려한 추천',
        price: 165000,
        category: '축구화',
        region: '광주',
        distance: undefined,
        relevance: 0.87,
        imageUrl: '/mock-context-result.jpg',
        ai: { quality_score: 0.79, confidence: 0.83 }
      }
    ];

    return applyFilters(mockResults, filters);

  } catch (error) {
    console.error('의미 검색 실패:', error);
    return [];
  }
};

// 통합 검색 서비스
export const performUnifiedSearch = async (
  options: SearchOptions
): Promise<SearchResultWithScore[]> => {
  try {
    let searchResults: SearchResult[] = [];

    // 검색 타입별 실행
    switch (options.type) {
      case 'text':
        searchResults = await performTextSearch(
          options.query,
          options.filters,
          options.limit || 20
        );
        break;
      
      case 'image':
        // 이미지 파일이 필요하므로 여기서는 시뮬레이션
        searchResults = await performImageSearch(
          new File([''], 'mock.jpg'),
          options.filters,
          options.limit || 20
        );
        break;
      
      case 'voice':
        // 음성 데이터가 필요하므로 여기서는 시뮬레이션
        searchResults = await performVoiceSearch(
          new Blob([''], { type: 'audio/wav' }),
          options.filters,
          options.limit || 20
        );
        break;
      
      case 'semantic':
        searchResults = await performSemanticSearch(
          options.query,
          options.filters,
          options.limit || 20
        );
        break;
    }

    // 가중치 기반 랭킹 적용
    const rankedResults = applyWeightedRanking(
      searchResults,
      options.userLocation,
      options.sortBy || 'relevance'
    );

    return rankedResults;

  } catch (error) {
    console.error('통합 검색 실패:', error);
    return [];
  }
};

// 가중치 기반 랭킹 적용
export const applyWeightedRanking = (
  results: SearchResult[],
  userLocation?: Location,
  sortBy: string = 'relevance'
): SearchResultWithScore[] => {
  return results.map(item => {
    let finalScore = 0;
    
    // Relevance 가중치 (60%)
    const relevanceScore = item.relevance || 0;
    finalScore += relevanceScore * 0.6;
    
    // Distance 가중치 (20%) - 사용자 위치가 있을 때만
    let distanceScore = 0;
    if (userLocation && item.distance !== undefined) {
      distanceScore = Math.max(0, 1 - (item.distance / 50)); // 50km 기준 정규화
      finalScore += distanceScore * 0.2;
    }
    
    // Freshness 가중치 (20%) - 최신 상품 우선
    const freshnessScore = 0.8; // 실제로는 createdAt 기반 계산
    finalScore += freshnessScore * 0.2;
    
    // Popularity 가중치 (추가 점수)
    const popularityScore = calculatePopularityScore(item);
    
    return {
      ...item,
      finalScore,
      relevance: relevanceScore,
      distance: item.distance,
      freshness: freshnessScore,
      popularity: popularityScore
    };
  }).sort((a, b) => b.finalScore - a.finalScore);
};

// 텍스트 관련성 계산
const calculateTextRelevance = (query: string, item: MarketItem): number => {
  const queryLower = query.toLowerCase();
  const titleLower = item.title.toLowerCase();
  const descLower = item.description.toLowerCase();
  const categoryLower = item.category.toLowerCase();
  
  let score = 0;
  
  // 제목 매칭 (가장 높은 가중치)
  if (titleLower.includes(queryLower)) {
    score += 0.8;
  }
  
  // 설명 매칭
  if (descLower.includes(queryLower)) {
    score += 0.4;
  }
  
  // 카테고리 매칭
  if (categoryLower.includes(queryLower)) {
    score += 0.6;
  }
  
  // 브랜드/모델 매칭
  if (item.brand && item.brand.toLowerCase().includes(queryLower)) {
    score += 0.7;
  }
  
  if (item.model && item.model.toLowerCase().includes(queryLower)) {
    score += 0.7;
  }
  
  // 태그 매칭
  if (item.ai?.tags) {
    const tagMatches = item.ai.tags.filter(tag => 
      tag.toLowerCase().includes(queryLower)
    ).length;
    score += tagMatches * 0.3;
  }
  
  return Math.min(1, score);
};

// 인기도 점수 계산
const calculatePopularityScore = (item: MarketItem): number => {
  let score = 0.5; // 기본 점수
  
  // AI 품질 점수 반영
  if (item.ai?.quality_score) {
    score += item.ai.quality_score * 0.3;
  }
  
  // 가격 대비 품질 (저가 고품질 상품 선호)
  if (item.price > 0) {
    const priceQualityRatio = (item.ai?.quality_score || 0.5) / (item.price / 100000);
    score += Math.min(0.2, priceQualityRatio);
  }
  
  return Math.min(1, score);
};

// 필터 적용
const applyFilters = (results: SearchResult[], filters?: SearchFilters): SearchResult[] => {
  if (!filters) return results;
  
  return results.filter(item => {
    // 카테고리 필터
    if (filters.category && item.category !== filters.category) {
      return false;
    }
    
    // 가격 범위 필터
    if (filters.priceRange) {
      if (item.price < filters.priceRange.min || item.price > filters.priceRange.max) {
        return false;
      }
    }
    
    // 상태 등급 필터
    if (filters.condition && item.ai?.quality_score) {
      const condition = item.ai.quality_score > 0.8 ? 'A' : 
                       item.ai.quality_score > 0.6 ? 'B' : 'C';
      if (condition !== filters.condition) {
        return false;
      }
    }
    
    // 지역 필터
    if (filters.region && item.region !== filters.region) {
      return false;
    }
    
    // 브랜드 필터
    if (filters.brand && item.title.toLowerCase().indexOf(filters.brand.toLowerCase()) === -1) {
      return false;
    }
    
    return true;
  });
};

// 검색 제안 (자동완성)
export const getSearchSuggestions = async (
  partialQuery: string,
  limitCount: number = 5
): Promise<string[]> => {
  try {
    if (partialQuery.length < 2) return [];
    
    // 실제로는 검색 엔진의 자동완성 API 사용
    // 여기서는 간단한 시뮬레이션
    
    const suggestions = [
      '축구화',
      'NIKE 머큐리얼',
      'Adidas 프레데터',
      '축구 유니폼',
      '보호장비',
      '축구공',
      '트레이닝복'
    ];
    
    return suggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(partialQuery.toLowerCase())
      )
      .slice(0, limitCount);
      
  } catch (error) {
    console.error('검색 제안 실패:', error);
    return [];
  }
};

// 인기 검색어
export const getPopularSearches = async (): Promise<string[]> => {
  try {
    // 실제로는 검색 로그 분석 또는 인기 상품 기반
    return [
      '축구화',
      'NIKE',
      'Adidas',
      '프레데터',
      '머큐리얼',
      '유니폼',
      '보호장비'
    ];
  } catch (error) {
    console.error('인기 검색어 조회 실패:', error);
    return [];
  }
};

// 검색 통계
export const getSearchStats = async (): Promise<{
  totalSearches: number;
  popularCategories: string[];
  averageRelevance: number;
}> => {
  try {
    // 실제로는 검색 로그 분석
    return {
      totalSearches: 1250,
      popularCategories: ['축구화', '유니폼', '보호장비'],
      averageRelevance: 0.78
    };
  } catch (error) {
    console.error('검색 통계 조회 실패:', error);
    return {
      totalSearches: 0,
      popularCategories: [],
      averageRelevance: 0
    };
  }
}; 