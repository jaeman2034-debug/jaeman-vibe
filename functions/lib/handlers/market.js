"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchMarketItems = exports.createOffer = exports.transitionMarket = exports.createMarketItem = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const states_1 = require("../lib/states");
const audit_1 = require("../lib/audit");
const ratelimit_1 = require("../lib/ratelimit");
/**
 * 마켓 상품 등록
 */
exports.createMarketItem = (0, https_1.onCall)({
    enforceAppCheck: true,
    region: 'asia-northeast3'
}, async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
        throw new Error('UNAUTHENTICATED');
    }
    const { title, description, price, category, region, images, condition } = req.data;
    // 레이트 리미트 체크
    const rateLimitKey = `market_create:${uid}`;
    if (!(0, ratelimit_1.tryHit)(rateLimitKey, 5, 60000)) { // 5개/분
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
            state: 'listed',
            keywords: generateKeywords(title, description, category),
            createdAt: now,
            updatedAt: now,
            history: [(0, states_1.createStateHistory)('listed', 'listed', uid, 'Item created')]
        };
        const docRef = await db.collection('market').add(marketData);
        await (0, audit_1.logBusinessEvent)('market_item_created', uid, 'market', docRef.id, {
            title,
            price,
            category
        });
        return { success: true, id: docRef.id };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('market_item_creation_failed', uid, {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
/**
 * 마켓 상품 상태 전이
 */
exports.transitionMarket = (0, https_1.onCall)({
    enforceAppCheck: true,
    region: 'asia-northeast3'
}, async (req) => {
    const { id, to, reason } = req.data;
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
            const marketData = marketDoc.data();
            const currentState = marketData.state;
            // 권한 확인
            const isOwner = marketData.ownerId === uid;
            const isBuyer = marketData.buyerId === uid;
            const isAdmin = req.auth?.token?.role === 'admin';
            if (!isOwner && !isBuyer && !isAdmin) {
                throw new Error('PERMISSION_DENIED');
            }
            // 상태 전이 검증
            const validation = (0, states_1.validateTransition)(currentState, to, uid, req.auth?.token?.role);
            if (!validation.valid) {
                throw new Error(`INVALID_TRANSITION: ${validation.reason}`);
            }
            // 히스토리 업데이트
            const history = marketData.history || [];
            const newHistory = [...history, (0, states_1.createStateHistory)(currentState, to, uid, reason)];
            // 상태 업데이트
            const updateData = {
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
        await (0, audit_1.logBusinessEvent)('market_state_transition', uid, 'market', id, {
            from: 'unknown', // 트랜잭션 내에서만 알 수 있음
            to,
            reason
        });
        return { success: true };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('market_transition_failed', uid, {
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
exports.createOffer = (0, https_1.onCall)({
    enforceAppCheck: true,
    region: 'asia-northeast3'
}, async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
        throw new Error('UNAUTHENTICATED');
    }
    const { marketId, price, message } = req.data;
    // 레이트 리미트 체크
    const rateLimitKey = `offer_create:${uid}:${marketId}`;
    if (!(0, ratelimit_1.tryHit)(rateLimitKey, 3, 60000)) { // 3개/분
        throw new Error('RATE_LIMIT_EXCEEDED');
    }
    try {
        const db = admin.firestore();
        // 마켓 아이템 존재 및 상태 확인
        const marketDoc = await db.doc(`market/${marketId}`).get();
        if (!marketDoc.exists) {
            throw new Error('MARKET_ITEM_NOT_FOUND');
        }
        const marketData = marketDoc.data();
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
        await (0, audit_1.logBusinessEvent)('offer_created', uid, 'offers', offerRef.id, {
            marketId,
            price
        });
        return { success: true, id: offerRef.id };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('offer_creation_failed', uid, {
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
exports.searchMarketItems = (0, https_1.onCall)({
    enforceAppCheck: true,
    region: 'asia-northeast3'
}, async (req) => {
    const { query, category, region, minPrice, maxPrice, state = 'listed', limit = 20, startAfter } = req.data;
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
            filteredItems = items.filter((item) => {
                const searchableText = `${item.title || ''} ${item.description || ''} ${item.category || ''}`.toLowerCase();
                return searchTerms.every(term => searchableText.includes(term));
            });
        }
        return {
            success: true,
            items: filteredItems,
            hasMore: snapshot.docs.length === limit
        };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('market_search_failed', undefined, {
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
function generateKeywords(title, description, category) {
    const text = `${title} ${description} ${category}`.toLowerCase();
    const words = text.split(/\s+/).filter(word => word.length > 1);
    // 중복 제거 및 정렬
    return [...new Set(words)].sort();
}
