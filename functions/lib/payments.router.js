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
exports.confirmStripePayment = exports.confirmTossPayment = exports.createSmartCheckout = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
if (!admin.apps.length)
    admin.initializeApp();
const db = admin.firestore();
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || '';
const TOSS_API_BASE = process.env.TOSS_API_BASE || 'https://api.tosspayments.com';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const PUBLIC_URL = process.env.PUBLIC_URL || '';
// Toss API 호출 헬퍼
async function tossFetch(endpoint, options) {
    const url = `${TOSS_API_BASE}${endpoint}`;
    const auth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Toss API error: ${response.status} ${text}`);
    }
    return response.json();
}
// Stripe API 호출 헬퍼
async function stripeFetch(endpoint, options) {
    const url = `https://api.stripe.com/v1${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            ...options.headers,
        },
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Stripe API error: ${response.status} ${text}`);
    }
    return response.json();
}
// 게이트웨이 자동 선택
function selectGateway(currency, gateway) {
    if (gateway && gateway !== 'auto') {
        return gateway;
    }
    // KRW는 Toss, 그 외는 Stripe
    return currency === 'KRW' ? 'toss' : 'stripe';
}
// 스마트 결제 체크아웃 생성
exports.createSmartCheckout = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    const { clubId, amount, orderName, currency = 'KRW', gateway = 'auto' } = data || {};
    if (!clubId || !amount) {
        throw new functions.https.HttpsError('invalid-argument', 'clubId와 amount가 필요합니다.');
    }
    if (!PUBLIC_URL) {
        throw new functions.https.HttpsError('failed-precondition', 'PUBLIC_URL이 설정되지 않았습니다.');
    }
    try {
        // 클럽 정보 조회
        const clubRef = db.collection('clubs').doc(clubId);
        const clubSnap = await clubRef.get();
        if (!clubSnap.exists) {
            throw new functions.https.HttpsError('not-found', '클럽을 찾을 수 없습니다.');
        }
        const club = clubSnap.data() || {};
        const finalAmount = Number(amount);
        const finalCurrency = currency || 'KRW';
        const finalOrderName = orderName || `${club.name || '클럽'} 회원가입`;
        // 게이트웨이 선택
        const selectedGateway = selectGateway(finalCurrency, gateway);
        // 주문 ID 생성
        const orderId = `club-${clubId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        if (selectedGateway === 'toss') {
            // Toss 결제창 생성
            if (!TOSS_SECRET_KEY) {
                throw new functions.https.HttpsError('failed-precondition', 'TOSS_SECRET_KEY가 설정되지 않았습니다.');
            }
            // 주문 정보 저장
            await db.collection('membershipOrders').doc(orderId).set({
                orderId,
                clubId,
                userId: context.auth.uid,
                orderName: finalOrderName,
                amount: finalAmount,
                currency: finalCurrency,
                gateway: 'toss',
                status: 'pending',
                paymentKey: null,
                toss: { method: null, secret: null },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                paidAt: null
            });
            // Toss Hosted 결제창 생성
            const body = {
                method: 'CARD',
                amount: finalAmount,
                orderId,
                orderName: finalOrderName,
                successUrl: `${PUBLIC_URL}/join/success`,
                failUrl: `${PUBLIC_URL}/join/fail`
            };
            const tossResponse = await tossFetch('/v1/payments', {
                method: 'POST',
                body: JSON.stringify(body)
            });
            const checkoutUrl = tossResponse?.checkout?.url;
            if (!checkoutUrl) {
                throw new functions.https.HttpsError('internal', 'Toss checkout URL을 생성할 수 없습니다.');
            }
            return {
                gateway: 'toss',
                orderId,
                checkoutUrl,
                currency: finalCurrency,
                amount: finalAmount
            };
        }
        else {
            // Stripe 결제창 생성
            if (!STRIPE_SECRET_KEY) {
                throw new functions.https.HttpsError('failed-precondition', 'STRIPE_SECRET_KEY가 설정되지 않았습니다.');
            }
            // 주문 정보 저장
            await db.collection('membershipOrders').doc(orderId).set({
                orderId,
                clubId,
                userId: context.auth.uid,
                orderName: finalOrderName,
                amount: finalAmount,
                currency: finalCurrency,
                gateway: 'stripe',
                status: 'pending',
                stripe: { sessionId: null, paymentIntentId: null },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                paidAt: null
            });
            // Stripe Checkout Session 생성 (일회성 결제)
            const stripeResponse = await stripeFetch('/checkout/sessions', {
                method: 'POST',
                body: new URLSearchParams({
                    'payment_method_types[]': 'card',
                    'line_items[0][price_data][currency]': finalCurrency.toLowerCase(),
                    'line_items[0][price_data][product_data][name]': finalOrderName,
                    'line_items[0][price_data][unit_amount]': (finalAmount * 100).toString(), // Stripe는 센트 단위
                    'line_items[0][quantity]': '1',
                    'mode': 'payment',
                    'success_url': `${PUBLIC_URL}/join/success?session_id={CHECKOUT_SESSION_ID}`,
                    'cancel_url': `${PUBLIC_URL}/join/fail`,
                    'metadata[orderId]': orderId,
                    'metadata[clubId]': clubId,
                    'metadata[userId]': context.auth.uid
                })
            });
            const checkoutUrl = stripeResponse?.url;
            if (!checkoutUrl) {
                throw new functions.https.HttpsError('internal', 'Stripe checkout URL을 생성할 수 없습니다.');
            }
            // Stripe 세션 ID 저장
            await db.collection('membershipOrders').doc(orderId).update({
                'stripe.sessionId': stripeResponse.id
            });
            return {
                gateway: 'stripe',
                orderId,
                checkoutUrl,
                currency: finalCurrency,
                amount: finalAmount
            };
        }
    }
    catch (error) {
        console.error('Smart checkout creation error:', error);
        throw new functions.https.HttpsError('internal', error.message || '결제 생성에 실패했습니다.');
    }
});
// Toss 결제 확정 (기존 함수와 동일)
exports.confirmTossPayment = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    const { paymentKey, orderId, amount } = data || {};
    if (!paymentKey || !orderId || !amount) {
        throw new functions.https.HttpsError('invalid-argument', 'paymentKey, orderId, amount가 필요합니다.');
    }
    try {
        // 주문 검증
        const orderRef = db.collection('membershipOrders').doc(orderId);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
            throw new functions.https.HttpsError('not-found', '주문을 찾을 수 없습니다.');
        }
        const order = orderSnap.data();
        if (order.userId !== context.auth.uid) {
            throw new functions.https.HttpsError('permission-denied', '주문 소유자가 아닙니다.');
        }
        if (Number(order.amount) !== Number(amount)) {
            throw new functions.https.HttpsError('failed-precondition', '금액이 일치하지 않습니다.');
        }
        // Toss 결제 승인
        const tossResponse = await tossFetch('/v1/payments/confirm', {
            method: 'POST',
            body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) })
        });
        // 주문 상태 업데이트
        await orderRef.update({
            status: 'paid',
            paymentKey,
            'toss.method': tossResponse?.method || null,
            'toss.secret': tossResponse?.secret || null,
            paidAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // 멤버 승인 처리
        await db.collection('clubMembers').doc(order.clubId).collection('members').doc(context.auth.uid).set({
            userId: context.auth.uid,
            orderId,
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        }, { merge: true });
        return {
            ok: true,
            payment: {
                method: tossResponse?.method,
                totalAmount: tossResponse?.totalAmount
            }
        };
    }
    catch (error) {
        console.error('Toss payment confirmation error:', error);
        throw new functions.https.HttpsError('internal', error.message || '결제 승인에 실패했습니다.');
    }
});
// Stripe 결제 확인 (Webhook에서 처리되지만 클라이언트 확인용)
exports.confirmStripePayment = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    const { sessionId } = data || {};
    if (!sessionId) {
        throw new functions.https.HttpsError('invalid-argument', 'sessionId가 필요합니다.');
    }
    try {
        // Stripe 세션 조회
        const stripeResponse = await stripeFetch(`/checkout/sessions/${sessionId}`, {
            method: 'GET'
        });
        if (stripeResponse.payment_status !== 'paid') {
            throw new functions.https.HttpsError('failed-precondition', '결제가 완료되지 않았습니다.');
        }
        const orderId = stripeResponse.metadata?.orderId;
        if (!orderId) {
            throw new functions.https.HttpsError('not-found', '주문 정보를 찾을 수 없습니다.');
        }
        // 주문 상태 확인 및 업데이트
        const orderRef = db.collection('membershipOrders').doc(orderId);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
            throw new functions.https.HttpsError('not-found', '주문을 찾을 수 없습니다.');
        }
        const order = orderSnap.data();
        if (order.userId !== context.auth.uid) {
            throw new functions.https.HttpsError('permission-denied', '주문 소유자가 아닙니다.');
        }
        // 이미 처리된 경우 스킵
        if (order.status === 'paid') {
            return { ok: true, alreadyProcessed: true };
        }
        // 주문 상태 업데이트
        await orderRef.update({
            status: 'paid',
            'stripe.paymentIntentId': stripeResponse.payment_intent,
            paidAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // 멤버 승인 처리
        await db.collection('clubMembers').doc(order.clubId).collection('members').doc(context.auth.uid).set({
            userId: context.auth.uid,
            orderId,
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        }, { merge: true });
        return { ok: true, payment: { method: 'card', totalAmount: order.amount } };
    }
    catch (error) {
        console.error('Stripe payment confirmation error:', error);
        throw new functions.https.HttpsError('internal', error.message || '결제 확인에 실패했습니다.');
    }
});
