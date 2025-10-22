import "./_admin";
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
const db = admin.firestore();

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || '';
const TOSS_API_BASE = process.env.TOSS_API_BASE || 'https://api.tosspayments.com';
const PUBLIC_URL = process.env.PUBLIC_URL || '';

// Toss API 호출 헬퍼
async function tossFetch(endpoint: string, options: RequestInit) {
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

// 빌링키 발급
export const issueTossBillingKey = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  const { authKey, customerKey, clubId } = data || {};
  
  if (!authKey || !customerKey || !clubId) {
    throw new functions.https.HttpsError('invalid-argument', 'authKey, customerKey, clubId가 필요합니다.');
  }

  if (!TOSS_SECRET_KEY || !PUBLIC_URL) {
    throw new functions.https.HttpsError('failed-precondition', '서버 환경변수가 설정되지 않았습니다.');
  }

  try {
    // 클럽 정보 조회
    const clubRef = db.collection('clubs').doc(clubId);
    const clubSnap = await clubRef.get();
    
    if (!clubSnap.exists) {
      throw new functions.https.HttpsError('not-found', '클럽을 찾을 수 없습니다.');
    }

    const club = clubSnap.data() || {};
    const orderName = `${club.name || '클럽'} 정기결제 등록`;

    // Toss 빌링키 발급
    const billingResponse = await tossFetch('/v1/billing/authorizations/issue', {
      method: 'POST',
      body: JSON.stringify({
        authKey,
        customerKey,
        orderName,
        customerEmail: context.auth.token.email || undefined,
        customerName: context.auth.token.name || undefined,
        customerMobilePhone: context.auth.token.phone_number || undefined
      })
    });

    const billingKey = billingResponse.billingKey;
    if (!billingKey) {
      throw new functions.https.HttpsError('internal', '빌링키 발급에 실패했습니다.');
    }

    // 빌링키 정보 저장
    await db.collection('tossBillingKeys').doc(context.auth.uid).set({
      userId: context.auth.uid,
      clubId,
      billingKey,
      customerKey,
      orderName,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return {
      ok: true,
      billingKey,
      customerKey,
      orderName
    };

  } catch (error: any) {
    console.error('Toss billing key issue error:', error);
    throw new functions.https.HttpsError('internal', error.message || '빌링키 발급에 실패했습니다.');
  }
});

// 정기결제 실행
export const chargeTossBilling = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  const { clubId, amount, orderName } = data || {};
  
  if (!clubId || !amount) {
    throw new functions.https.HttpsError('invalid-argument', 'clubId와 amount가 필요합니다.');
  }

  try {
    // 빌링키 조회
    const billingRef = db.collection('tossBillingKeys').doc(context.auth.uid);
    const billingSnap = await billingRef.get();
    
    if (!billingSnap.exists) {
      throw new functions.https.HttpsError('not-found', '등록된 빌링키가 없습니다.');
    }

    const billing = billingSnap.data()!;
    if (billing.clubId !== clubId) {
      throw new functions.https.HttpsError('permission-denied', '해당 클럽의 빌링키가 아닙니다.');
    }

    if (billing.status !== 'active') {
      throw new functions.https.HttpsError('failed-precondition', '비활성화된 빌링키입니다.');
    }

    // 주문 ID 생성
    const orderId = `billing-${clubId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Toss 정기결제 실행
    const chargeResponse = await tossFetch(`/v1/billing/${billing.billingKey}`, {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        orderName: orderName || `${billing.orderName} (${new Date().toISOString().slice(0, 7)})`,
        amount: Number(amount),
        customerEmail: context.auth.token.email || undefined,
        customerName: context.auth.token.name || undefined
      })
    });

    // 결제 결과 저장
    await db.collection('tossBillingCharges').doc(orderId).set({
      orderId,
      clubId,
      userId: context.auth.uid,
      billingKey: billing.billingKey,
      amount: Number(amount),
      status: 'pending',
      toss: {
        method: chargeResponse.method || null,
        secret: chargeResponse.secret || null
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      paidAt: null
    });

    return {
      ok: true,
      orderId,
      amount: Number(amount),
      status: 'pending'
    };

  } catch (error: any) {
    console.error('Toss billing charge error:', error);
    throw new functions.https.HttpsError('internal', error.message || '정기결제 실행에 실패했습니다.');
  }
});

// Toss 빌링 웹훅
export const tossBillingWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const event = req.body;
    const { eventType, data: paymentData } = event || {};
    
    if (eventType !== 'PAYMENT_STATUS_CHANGED') {
      return res.status(200).json({ received: true });
    }

    const { paymentKey, orderId, status } = paymentData || {};
    
    if (!paymentKey || !orderId) {
      return res.status(400).send('Bad payload');
    }

    // 결제 상태 업데이트
    const chargeRef = db.collection('tossBillingCharges').doc(orderId);
    const chargeSnap = await chargeRef.get();
    
    if (chargeSnap.exists) {
      const charge = chargeSnap.data()!;
      
      if (status === 'DONE') {
        // 결제 성공
        await chargeRef.update({
          status: 'paid',
          paymentKey,
          paidAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 멤버십 활성화
        await db.collection('clubMembers').doc(charge.clubId).collection('members').doc(charge.userId).set({
          userId: charge.userId,
          orderId,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'active'
        }, { merge: true });

        console.log(`Billing payment completed: ${orderId}`);
      } else if (status === 'CANCELED') {
        // 결제 취소
        await chargeRef.update({
          status: 'canceled'
        });

        console.log(`Billing payment canceled: ${orderId}`);
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Toss billing webhook error:', error);
    return res.status(500).send('Webhook error');
  }
});

// 빌링키 상태 조회
export const getTossBillingStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  try {
    const billingRef = db.collection('tossBillingKeys').doc(context.auth.uid);
    const billingSnap = await billingRef.get();
    
    if (!billingSnap.exists) {
      return { hasBillingKey: false };
    }

    const billing = billingSnap.data()!;
    return {
      hasBillingKey: true,
      billingKey: billing.billingKey,
      clubId: billing.clubId,
      status: billing.status,
      createdAt: billing.createdAt
    };

  } catch (error: any) {
    console.error('Get billing status error:', error);
    throw new functions.https.HttpsError('internal', error.message || '빌링키 상태 조회에 실패했습니다.');
  }
});
