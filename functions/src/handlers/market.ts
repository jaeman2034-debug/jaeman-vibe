import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { canTransition, validateTransition, createStateHistory, MarketState } from '../lib/states';
import { logAuditEvent, logBusinessEvent } from '../lib/audit';
import { tryHit } from '../lib/ratelimit';

/**
 * 마켓 상품 등록
 */
export const createMarketItem = onCall({
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new Error('UNAUTHENTICATED');
  }

  const {
    title,
    description,
    price,
    category,
    region,
    images,
    condition
  } = req.data as {
    title: string;
    description: string;
    price: number;
    category: string;
    region: string;
    images: string[];
    condition: string;
  };

  // 레이트 리미트 체크
  const rateLimitKey = `market_create:${uid}`;
  if (!tryHit(rateLimitKey, 5, 60_000)) { // 5개/분
    throw new Error('RATE_LIMIT_EXCEEDED');
  }

  try {
    const db = admin.firestore();
    const now = admin.firestore.FieldValue.serverTimestamp();
    
    const marketData = {
      title,
      description,
      price,
      category,
      region,
      images,
      condition,
      ownerId: uid,
      state: 'listed' as MarketState,
      keywords: generateKeywords(title, description, category),
      createdAt: now,
      updatedAt: now,
      history: [createStateHistory('listed', 'listed', uid, 'Item created')]
    };

    const docRef = await db.collection('market').add(marketData);
    
    await logBusinessEvent('market_item_created', uid, 'market', docRef.id, {
      title,
      price,
      category
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    await logAuditEvent('market_item_creation_failed', uid, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 마켓 상품 상태 전이
 */
export const transitionMarket = onCall({
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const { id, to, reason } = req.data as { 
    id: string; 
    to: MarketState; 
    reason?: string;
  };
  const uid = req.auth?.uid;
  
  if (!uid) {
    throw new Error('UNAUTHENTICATED');
  }

  try {
    const db = admin.firestore();
    const marketRef = db.doc(`market/${id}`);
    
    await db.runTransaction(async (transaction) => {
      const marketDoc = await transaction.get(marketRef);
      
      if (!marketDoc.exists) {
        throw new Error('MARKET_ITEM_NOT_FOUND');
      }
      
      const marketData = marketDoc.data()!;
      const currentState = marketData.state as MarketState;
      
      // 권한 확인
      const isOwner = marketData.ownerId === uid;
      const isBuyer = marketData.buyerId === uid;
      const isAdmin = req.auth?.token?.role === 'admin';
      
      if (!isOwner && !isBuyer && !isAdmin) {
        throw new Error('PERMISSION_DENIED');
      }
      
      // 상태 전이 검증
      const validation = validateTransition(
        currentState, 
        to, 
        uid, 
        req.auth?.token?.role as string
      );
      
      if (!validation.valid) {
        throw new Error(`INVALID_TRANSITION: ${validation.reason}`);
      }
      
      // 히스토리 업데이트
      const history = marketData.history || [];
      const newHistory = [...history, createStateHistory(currentState, to, uid, reason)];
      
      // 상태 업데이트
      const updateData: any = {
        state: to,
        history: newHistory,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // 특정 상태별 추가 필드 업데이트
      if (to === 'reserved' && !marketData.buyerId) {
        updateData.buyerId = uid;
      }
      
      transaction.update(marketRef, updateData);
    });
    
    await logBusinessEvent('market_state_transition', uid, 'market', id, {
      from: 'unknown', // 트랜잭션 내에서만 알 수 있음
      to,
      reason
    });
    
    return { success: true };
  } catch (error) {
    await logAuditEvent('market_transition_failed', uid, {
      marketId: id,
      targetState: to,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 입찰/제안 생성
 */
export const createOffer = onCall({
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new Error('UNAUTHENTICATED');
  }

  const { marketId, price, message } = req.data as {
    marketId: string;
    price: number;
    message?: string;
  };

  // 레이트 리미트 체크
  const rateLimitKey = `offer_create:${uid}:${marketId}`;
  if (!tryHit(rateLimitKey, 3, 60_000)) { // 3개/분
    throw new Error('RATE_LIMIT_EXCEEDED');
  }

  try {
    const db = admin.firestore();
    
    // 마켓 아이템 존재 및 상태 확인
    const marketDoc = await db.doc(`market/${marketId}`).get();
    if (!marketDoc.exists) {
      throw new Error('MARKET_ITEM_NOT_FOUND');
    }
    
    const marketData = marketDoc.data()!;
    if (marketData.ownerId === uid) {
      throw new Error('CANNOT_BID_OWN_ITEM');
    }
    
    if (marketData.state !== 'listed') {
      throw new Error('ITEM_NOT_AVAILABLE_FOR_BIDDING');
    }
    
    const offerData = {
      marketId,
      bidderId: uid,
      price,
      message: message || '',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const offerRef = await db.collection('offers').add(offerData);
    
    await logBusinessEvent('offer_created', uid, 'offers', offerRef.id, {
      marketId,
      price
    });
    
    return { success: true, id: offerRef.id };
  } catch (error) {
    await logAuditEvent('offer_creation_failed', uid, {
      marketId,
      price,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 마켓 상품 검색
 */
export const searchMarketItems = onCall({
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const { 
    query, 
    category, 
    region, 
    minPrice, 
    maxPrice, 
    state = 'listed',
    limit = 20,
    startAfter
  } = req.data as {
    query?: string;
    category?: string;
    region?: string;
    minPrice?: number;
    maxPrice?: number;
    state?: MarketState;
    limit?: number;
    startAfter?: string;
  };

  try {
    const db = admin.firestore();
    let queryRef = db.collection('market')
      .where('state', '==', state)
      .orderBy('createdAt', 'desc')
      .limit(limit);
    
    // 필터 적용
    if (category) {
      queryRef = queryRef.where('category', '==', category);
    }
    
    if (region) {
      queryRef = queryRef.where('region', '==', region);
    }
    
    if (minPrice !== undefined) {
      queryRef = queryRef.where('price', '>=', minPrice);
    }
    
    if (maxPrice !== undefined) {
      queryRef = queryRef.where('price', '<=', maxPrice);
    }
    
    // 페이지네이션
    if (startAfter) {
      const startDoc = await db.doc(`market/${startAfter}`).get();
      queryRef = queryRef.startAfter(startDoc);
    }
    
    const snapshot = await queryRef.get();
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 텍스트 검색 (클라이언트 사이드 필터링)
    let filteredItems = items;
    if (query) {
      const searchTerms = query.toLowerCase().split(' ');
      filteredItems = items.filter((item: any) => {
        const searchableText = `${item.title || ''} ${item.description || ''} ${item.category || ''}`.toLowerCase();
        return searchTerms.every(term => searchableText.includes(term));
      });
    }
    
    return {
      success: true,
      items: filteredItems,
      hasMore: snapshot.docs.length === limit
    };
  } catch (error) {
    await logAuditEvent('market_search_failed', undefined, {
      query,
      category,
      region,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 키워드 생성 (검색 최적화)
 */
function generateKeywords(title: string, description: string, category: string): string[] {
  const text = `${title} ${description} ${category}`.toLowerCase();
  const words = text.split(/\s+/).filter(word => word.length > 1);
  
  // 중복 제거 및 정렬
  return [...new Set(words)].sort();
}
