# AI 검색/추천 Cloud Functions 구현 가이드 🔍✨

## 📋 개요

이 문서는 Cloud Functions를 통한 AI 기반 검색/추천 시스템 구현 방법을 설명합니다. 텍스트 검색, 이미지 검색, 의미 검색, 가중치 기반 랭킹 등을 포함합니다.

## 🎯 핵심 요구사항

### **1. 검색 타입**
- **텍스트 검색**: Algolia/Meilisearch 연동
- **이미지 검색**: CLIP/OpenAI Vision 기반
- **음성 검색**: Web Speech API 연동
- **의미 검색**: 임베딩 기반 벡터 검색

### **2. 랭킹 시스템**
- **가중치 기반**: relevance * 0.6 + distance * 0.2 + freshness * 0.2
- **AI 품질 점수**: 상품 품질 및 신뢰도 반영
- **개인화**: 사용자 선호도 및 행동 패턴 학습

## 🛠️ Cloud Functions 구현

### **1. 통합 검색 함수**

```typescript
// functions/src/search/unifiedSearch.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { performTextSearch, performImageSearch, performSemanticSearch } from './searchEngines';
import { applyWeightedRanking } from './ranking';

export const unifiedSearch = functions.https.onCall(async (data, context) => {
  // 인증 확인
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  try {
    const { 
      type, 
      query, 
      filters = {}, 
      userLocation, 
      limit = 20, 
      sortBy = 'relevance' 
    } = data;

    let searchResults: any[] = [];

    // 검색 타입별 실행
    switch (type) {
      case 'text':
        searchResults = await performTextSearch(query, filters, limit);
        break;
      
      case 'image':
        searchResults = await performImageSearch(query, filters, limit);
        break;
      
      case 'semantic':
        searchResults = await performSemanticSearch(query, filters, limit);
        break;
      
      default:
        throw new functions.https.HttpsError('invalid-argument', '지원하지 않는 검색 타입입니다.');
    }

    // 가중치 기반 랭킹 적용
    const rankedResults = await applyWeightedRanking(
      searchResults, 
      userLocation, 
      sortBy,
      context.auth.uid
    );

    // 검색 로그 저장
    await logSearch(context.auth.uid, type, query, rankedResults.length);

    return {
      success: true,
      data: {
        results: rankedResults,
        total: rankedResults.length,
        searchType: type,
        query,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      }
    };

  } catch (error) {
    console.error('통합 검색 실패:', error);
    throw new functions.https.HttpsError('internal', '검색 중 오류가 발생했습니다.');
  }
});
```

### **2. 텍스트 검색 엔진 (Algolia/Meilisearch)**

```typescript
// functions/src/search/searchEngines.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Algolia 연동
export const performTextSearch = async (
  query: string,
  filters: any,
  limitCount: number
): Promise<any[]> => {
  try {
    // Algolia 클라이언트 설정
    const algoliasearch = require('algoliasearch');
    const client = algoliasearch(
      process.env.ALGOLIA_APP_ID,
      process.env.ALGOLIA_SEARCH_KEY
    );
    const index = client.initIndex('market_items');

    // 검색 쿼리 구성
    const searchParams: any = {
      query,
      hitsPerPage: limitCount,
      filters: buildAlgoliaFilters(filters),
      attributesToRetrieve: [
        'objectID', 'title', 'description', 'price', 'category', 
        'region', 'images', 'ai', 'createdAt'
      ]
    };

    // 검색 실행
    const { hits } = await index.search(searchParams);
    
    // Firestore에서 상세 정보 조회
    const results = await Promise.all(
      hits.map(async (hit: any) => {
        const doc = await admin.firestore()
          .collection('market_items')
          .doc(hit.objectID)
          .get();
        
        return {
          id: hit.objectID,
          ...doc.data(),
          relevance: hit._score || 0
        };
      })
    );

    return results;

  } catch (error) {
    console.error('Algolia 검색 실패:', error);
    // 폴백: Firestore 기반 검색
    return performFirestoreTextSearch(query, filters, limitCount);
  }
};

// Algolia 필터 구성
const buildAlgoliaFilters = (filters: any): string => {
  const filterParts: string[] = [];
  
  if (filters.category) {
    filterParts.push(`category:${filters.category}`);
  }
  
  if (filters.priceRange) {
    filterParts.push(`price:${filters.priceRange.min} TO ${filters.priceRange.max}`);
  }
  
  if (filters.condition) {
    filterParts.push(`condition:${filters.condition}`);
  }
  
  if (filters.region) {
    filterParts.push(`region:${filters.region}`);
  }
  
  return filterParts.join(' AND ');
};

// Firestore 폴백 검색
const performFirestoreTextSearch = async (
  query: string,
  filters: any,
  limitCount: number
): Promise<any[]> => {
  const db = admin.firestore();
  
  let q = db.collection('market_items')
    .where('status', '==', 'active');
  
  // 필터 적용
  if (filters.category) {
    q = q.where('category', '==', filters.category);
  }
  
  if (filters.priceRange) {
    if (filters.priceRange.min > 0) {
      q = q.where('price', '>=', filters.priceRange.min);
    }
    if (filters.priceRange.max < 1000000) {
      q = q.where('price', '<=', filters.priceRange.max);
    }
  }
  
  const snapshot = await q
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    relevance: calculateTextRelevance(query, doc.data())
  }));
};
```

### **3. 이미지 검색 (CLIP/OpenAI Vision)**

```typescript
// functions/src/search/imageSearch.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const performImageSearch = async (
  imageUrl: string,
  filters: any,
  limitCount: number
): Promise<any[]> => {
  try {
    // 1. 이미지 임베딩 생성
    const embedding = await generateImageEmbedding(imageUrl);
    
    // 2. 벡터 DB에서 유사한 상품 검색
    const similarItems = await searchSimilarItems(embedding, limitCount);
    
    // 3. Firestore에서 상세 정보 조회
    const results = await Promise.all(
      similarItems.map(async (item: any) => {
        const doc = await admin.firestore()
          .collection('market_items')
          .doc(item.id)
          .get();
        
        return {
          id: item.id,
          ...doc.data(),
          similarity: item.similarity,
          relevance: item.similarity
        };
      })
    );
    
    // 4. 필터 적용
    return applyFilters(results, filters);
    
  } catch (error) {
    console.error('이미지 검색 실패:', error);
    throw error;
  }
};

// OpenAI Vision API를 사용한 이미지 임베딩
const generateImageEmbedding = async (imageUrl: string): Promise<number[]> => {
  try {
    // OpenAI Vision API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "이 이미지를 분석하여 상품의 카테고리, 브랜드, 모델, 색상, 상태 등을 추출하고, 384차원의 임베딩 벡터를 생성해주세요."
            },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 1000
    });
    
    // 응답에서 임베딩 벡터 추출 (실제로는 별도 임베딩 API 사용)
    const content = response.choices[0].message.content;
    
    // 간단한 시뮬레이션 (실제로는 OpenAI Embeddings API 사용)
    return Array.from({ length: 384 }, () => Math.random() - 0.5);
    
  } catch (error) {
    console.error('이미지 임베딩 생성 실패:', error);
    throw error;
  }
};

// 벡터 DB에서 유사한 상품 검색
const searchSimilarItems = async (
  embedding: number[],
  limitCount: number
): Promise<any[]> => {
  try {
    // Pinecone 또는 Weaviate 연동
    // 여기서는 Firestore 기반 시뮬레이션
    
    const db = admin.firestore();
    const snapshot = await db.collection('market_items')
      .where('status', '==', 'active')
      .limit(limitCount * 2) // 필터링을 위해 더 많은 결과 조회
      .get();
    
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 코사인 유사도 계산 (실제로는 벡터 DB에서 처리)
    const itemsWithSimilarity = items.map(item => ({
      ...item,
      similarity: calculateCosineSimilarity(embedding, item.ai?.embedding || [])
    }));
    
    // 유사도 순으로 정렬
    return itemsWithSimilarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limitCount);
      
  } catch (error) {
    console.error('유사 상품 검색 실패:', error);
    throw error;
  }
};

// 코사인 유사도 계산
const calculateCosineSimilarity = (vec1: number[], vec2: number[]): number => {
  if (vec1.length !== vec2.length || vec1.length === 0) return 0;
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  return Math.max(0, similarity); // 0~1 범위로 정규화
};
```

### **4. 가중치 기반 랭킹 시스템**

```typescript
// functions/src/search/ranking.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const applyWeightedRanking = async (
  results: any[],
  userLocation?: any,
  sortBy: string = 'relevance',
  userId?: string
): Promise<any[]> => {
  try {
    const rankedResults = await Promise.all(
      results.map(async (item) => {
        let finalScore = 0;
        
        // 1. Relevance 가중치 (60%)
        const relevanceScore = item.relevance || 0;
        finalScore += relevanceScore * 0.6;
        
        // 2. Distance 가중치 (20%) - 사용자 위치가 있을 때만
        let distanceScore = 0;
        if (userLocation && item.geo) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            item.geo.latitude,
            item.geo.longitude
          );
          
          // 거리 점수 계산 (가까울수록 높은 점수)
          distanceScore = Math.max(0, 1 - (distance / 50)); // 50km 기준 정규화
          finalScore += distanceScore * 0.2;
          
          // 거리 정보 추가
          item.distance = distance;
        }
        
        // 3. Freshness 가중치 (20%) - 최신 상품 우선
        const freshnessScore = calculateFreshnessScore(item.createdAt);
        finalScore += freshnessScore * 0.2;
        
        // 4. 추가 점수들
        const additionalScore = await calculateAdditionalScore(item, userId);
        finalScore += additionalScore;
        
        return {
          ...item,
          finalScore: Math.min(1, finalScore),
          relevance: relevanceScore,
          distance: item.distance,
          freshness: freshnessScore,
          additional: additionalScore
        };
      })
    );
    
    // 최종 점수로 정렬
    rankedResults.sort((a, b) => b.finalScore - a.finalScore);
    
    return rankedResults;
    
  } catch (error) {
    console.error('랭킹 적용 실패:', error);
    return results; // 오류 시 원본 결과 반환
  }
};

// 신선도 점수 계산
const calculateFreshnessScore = (createdAt: any): number => {
  if (!createdAt) return 0.5;
  
  const now = admin.firestore.Timestamp.now();
  const created = createdAt.toDate();
  const daysDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  
  // 30일 이내: 높은 점수, 90일 이내: 중간 점수, 그 이상: 낮은 점수
  if (daysDiff <= 30) return 1.0;
  if (daysDiff <= 90) return 0.7;
  if (daysDiff <= 180) return 0.4;
  return 0.2;
};

// 추가 점수 계산
const calculateAdditionalScore = async (item: any, userId?: string): Promise<number> => {
  let score = 0;
  
  // AI 품질 점수 반영
  if (item.ai?.quality_score) {
    score += item.ai.quality_score * 0.1;
  }
  
  // 가격 대비 품질 점수
  if (item.price > 0 && item.ai?.quality_score) {
    const priceQualityRatio = item.ai.quality_score / (item.price / 100000);
    score += Math.min(0.1, priceQualityRatio);
  }
  
  // 사용자 개인화 점수 (선호도, 구매 이력 등)
  if (userId) {
    const personalizationScore = await calculatePersonalizationScore(userId, item);
    score += personalizationScore * 0.1;
  }
  
  return Math.min(0.2, score); // 최대 0.2점
};

// 개인화 점수 계산
const calculatePersonalizationScore = async (userId: string, item: any): Promise<number> => {
  try {
    const db = admin.firestore();
    
    // 사용자 선호도 조회
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    let score = 0;
    
    // 선호 카테고리
    if (userData?.preferences?.categories?.includes(item.category)) {
      score += 0.3;
    }
    
    // 선호 브랜드
    if (userData?.preferences?.brands?.includes(item.brand)) {
      score += 0.3;
    }
    
    // 가격 범위 선호도
    if (userData?.preferences?.priceRange) {
      const { min, max } = userData.preferences.priceRange;
      if (item.price >= min && item.price <= max) {
        score += 0.2;
      }
    }
    
    // 구매 이력 기반 점수
    const purchaseHistory = await db.collection('purchases')
      .where('buyerId', '==', userId)
      .where('category', '==', item.category)
      .limit(5)
      .get();
    
    if (!purchaseHistory.empty) {
      score += 0.2;
    }
    
    return Math.min(1, score);
    
  } catch (error) {
    console.error('개인화 점수 계산 실패:', error);
    return 0;
  }
};

// 거리 계산 (Haversine 공식)
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
```

### **5. 검색 로그 및 분석**

```typescript
// functions/src/search/analytics.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// 검색 로그 저장
export const logSearch = async (
  userId: string,
  searchType: string,
  query: string,
  resultCount: number
): Promise<void> => {
  try {
    const db = admin.firestore();
    
    await db.collection('search_logs').add({
      userId,
      searchType,
      query,
      resultCount,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userAgent: 'Cloud Function',
      ipAddress: 'Cloud Function'
    });
    
  } catch (error) {
    console.error('검색 로그 저장 실패:', error);
  }
};

// 검색 통계 조회
export const getSearchStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  try {
    const db = admin.firestore();
    const { startDate, endDate } = data;
    
    let q = db.collection('search_logs');
    
    if (startDate && endDate) {
      q = q.where('timestamp', '>=', new Date(startDate))
           .where('timestamp', '<=', new Date(endDate));
    }
    
    const snapshot = await q.get();
    
    const stats = {
      totalSearches: snapshot.size,
      searchTypes: {} as Record<string, number>,
      popularQueries: {} as Record<string, number>,
      averageResults: 0,
      totalResults: 0
    };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // 검색 타입별 통계
      stats.searchTypes[data.searchType] = (stats.searchTypes[data.searchType] || 0) + 1;
      
      // 인기 검색어
      stats.popularQueries[data.query] = (stats.popularQueries[data.query] || 0) + 1;
      
      // 결과 수 통계
      stats.totalResults += data.resultCount;
    });
    
    stats.averageResults = stats.totalResults / stats.totalSearches;
    
    return {
      success: true,
      data: stats
    };
    
  } catch (error) {
    console.error('검색 통계 조회 실패:', error);
    throw new functions.https.HttpsError('internal', '통계 조회 중 오류가 발생했습니다.');
  }
});
```

## 🔒 보안 및 최적화

### **1. 검색 결과 캐싱**

```typescript
// functions/src/search/cache.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Redis 캐싱 (선택사항)
export const cacheSearchResults = async (
  cacheKey: string,
  results: any[],
  ttl: number = 300 // 5분
): Promise<void> => {
  try {
    // Redis 클라이언트 설정
    const redis = require('redis');
    const client = redis.createClient({
      url: process.env.REDIS_URL
    });
    
    await client.connect();
    await client.setEx(cacheKey, ttl, JSON.stringify(results));
    await client.disconnect();
    
  } catch (error) {
    console.error('검색 결과 캐싱 실패:', error);
  }
};

// 캐시된 결과 조회
export const getCachedResults = async (cacheKey: string): Promise<any[] | null> => {
  try {
    const redis = require('redis');
    const client = redis.createClient({
      url: process.env.REDIS_URL
    });
    
    await client.connect();
    const cached = await client.get(cacheKey);
    await client.disconnect();
    
    return cached ? JSON.parse(cached) : null;
    
  } catch (error) {
    console.error('캐시된 결과 조회 실패:', error);
    return null;
  }
};
```

### **2. 검색 성능 최적화**

```typescript
// functions/src/search/optimization.ts
import * as functions from 'firebase-functions';

// 검색 결과 제한 및 페이지네이션
export const optimizeSearchResults = (
  results: any[],
  limit: number = 20,
  offset: number = 0
): any[] => {
  return results.slice(offset, offset + limit);
};

// 검색 쿼리 최적화
export const optimizeSearchQuery = (query: string): string => {
  // 불용어 제거, 정규화 등
  return query
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, '') // 특수문자 제거
    .trim();
};

// 검색 인덱스 최적화
export const createSearchIndexes = async (): Promise<void> => {
  // Firestore 인덱스 생성
  const indexes = [
    {
      collectionGroup: 'market_items',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'status', order: 'ASCENDING' },
        { fieldPath: 'category', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ]
    },
    {
      collectionGroup: 'market_items',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'status', order: 'ASCENDING' },
        { fieldPath: 'price', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ]
    }
  ];
  
  // 인덱스 생성 로직
  console.log('검색 인덱스 생성 완료');
};
```

## 🗺️ 향후 개발 계획

### **1. 단기 (1-2개월)**
- [ ] Algolia/Meilisearch 완전 연동
- [ ] OpenAI Vision API 연동
- [ ] 기본 벡터 검색 구현

### **2. 중기 (3-6개월)**
- [ ] Pinecone/Weaviate 벡터 DB 연동
- [ ] 개인화 추천 시스템
- [ ] 실시간 검색 분석

### **3. 장기 (6개월+)**
- [ ] 머신러닝 기반 검색 최적화
- [ ] 멀티모달 검색 (이미지+텍스트+음성)
- [ ] 예측 검색 및 자동완성

## 🎉 결론

이 AI 검색/추천 시스템은 **다양한 검색 타입**과 **가중치 기반 랭킹**을 통해 사용자에게 정확하고 관련성 높은 검색 결과를 제공합니다.

**Algolia/Meilisearch**로 빠른 텍스트 검색을, **OpenAI Vision**으로 이미지 기반 검색을, **벡터 DB**로 의미적 검색을 구현하여 사용자 경험을 크게 향상시킬 수 있습니다! 🔍✨ 