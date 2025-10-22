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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeBillingWebhook = exports.createStripePortalSession = exports.createStripeSubscriptionCheckout = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const stripe_1 = __importDefault(require("stripe"));
if (!admin.apps.length)
    admin.initializeApp();
const db = admin.firestore();
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const PUBLIC_URL = process.env.PUBLIC_URL || '';
if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is required');
}
const stripe = new stripe_1.default(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});
// 구독 체크아웃 생성
exports.createStripeSubscriptionCheckout = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    const { clubId } = data || {};
    if (!clubId) {
        throw new functions.https.HttpsError('invalid-argument', 'clubId가 필요합니다.');
    }
    if (!STRIPE_PRICE_ID || !PUBLIC_URL) {
        throw new functions.https.HttpsError('failed-precondition', '서버 환경변수가 설정되지 않았습니다.');
    }
    try {
        // 기존 구독 확인
        const existingSub = await db
            .collection('clubSubscriptions')
            .doc(clubId)
            .collection('users')
            .doc(context.auth.uid)
            .get();
        if (existingSub.exists && existingSub.data()?.status === 'active') {
            throw new functions.https.HttpsError('already-exists', '이미 활성 구독이 있습니다.');
        }
        // Stripe Checkout Session 생성
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            success_url: `${PUBLIC_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${PUBLIC_URL}/subscription/cancel`,
            metadata: {
                uid: context.auth.uid,
                clubId: clubId,
            },
            customer_email: context.auth.token.email || undefined,
        });
        return { url: session.url };
    }
    catch (error) {
        console.error('Stripe checkout creation error:', error);
        throw new functions.https.HttpsError('internal', error.message || '구독 생성에 실패했습니다.');
    }
});
// 고객 포털 세션 생성
exports.createStripePortalSession = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    const { clubId } = data || {};
    if (!clubId) {
        throw new functions.https.HttpsError('invalid-argument', 'clubId가 필요합니다.');
    }
    try {
        // 기존 구독에서 고객 ID 조회
        const subDoc = await db
            .collection('clubSubscriptions')
            .doc(clubId)
            .collection('users')
            .doc(context.auth.uid)
            .get();
        if (!subDoc.exists) {
            throw new functions.https.HttpsError('not-found', '구독 정보를 찾을 수 없습니다.');
        }
        const subData = subDoc.data();
        const customerId = subData?.stripeCustomerId;
        if (!customerId) {
            throw new functions.https.HttpsError('failed-precondition', '고객 ID가 없습니다.');
        }
        // Stripe Customer Portal 세션 생성
        const portal = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${PUBLIC_URL}/clubs/${clubId}`,
        });
        return { url: portal.url };
    }
    catch (error) {
        console.error('Stripe portal creation error:', error);
        throw new functions.https.HttpsError('internal', error.message || '포털 생성에 실패했습니다.');
    }
});
// Stripe Webhook 처리
exports.stripeBillingWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error('Webhook signature verify failed', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const cs = event.data.object;
                if (cs.mode === 'subscription' && cs.subscription && cs.customer) {
                    const uid = cs.metadata?.uid;
                    const clubId = cs.metadata?.clubId;
                    if (uid && clubId) {
                        const subId = typeof cs.subscription === 'string' ? cs.subscription : cs.subscription.id;
                        const custId = typeof cs.customer === 'string' ? cs.customer : cs.customer.id;
                        await db.collection('clubSubscriptions').doc(clubId).collection('users').doc(uid).set({
                            clubId,
                            userId: uid,
                            stripeCustomerId: custId,
                            stripeSubscriptionId: subId,
                            status: 'inactive',
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                        console.log(`Checkout completed: ${uid} -> ${clubId}`);
                    }
                }
                break;
            }
            case 'invoice.paid': {
                const inv = event.data.object;
                const subId = inv.subscription;
                // 구독 ID로 사용자 찾기
                const qs = await db.collectionGroup('users').where('stripeSubscriptionId', '==', subId).limit(1).get();
                if (!qs.empty) {
                    const doc = qs.docs[0];
                    const data = doc.data();
                    await doc.ref.set({
                        status: 'active',
                        currentPeriodEnd: inv.lines?.data?.[0]?.period?.end || 0,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    // 멤버 승인 동기화
                    await db.collection('clubMembers').doc(data.clubId).collection('members').doc(data.userId).set({
                        userId: data.userId,
                        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
                        status: 'active'
                    }, { merge: true });
                    console.log(`Invoice paid: ${data.userId} -> ${data.clubId}`);
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                const qs = await db.collectionGroup('users').where('stripeSubscriptionId', '==', sub.id).limit(1).get();
                if (!qs.empty) {
                    const doc = qs.docs[0];
                    const data = doc.data();
                    await doc.ref.set({
                        status: 'canceled',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    await db.collection('clubMembers').doc(data.clubId).collection('members').doc(data.userId).set({
                        status: 'inactive'
                    }, { merge: true });
                    console.log(`Subscription canceled: ${data.userId} -> ${data.clubId}`);
                }
                break;
            }
            default:
                console.log('Unhandled event type:', event.type);
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).send('Webhook handler error');
    }
});
