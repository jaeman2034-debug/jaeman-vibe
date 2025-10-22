import "./_admin";
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
const db = admin.firestore();

const TOSS_API_BASE = 'https://api.tosspayments.com';
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || '';
const PUBLIC_URL = process.env.PUBLIC_URL || '';

function b64(key: string) {
  return Buffer.from(`${key}:`).toString('base64');
}

async function tossFetch(endpoint: string, options: any) {
  const res = await fetch(`${TOSS_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Basic ${b64(TOSS_SECRET_KEY)}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new functions.https.HttpsError('internal', `Toss API error: ${res.status} ${text}`);
  }
  
  return res.json();
}

// 결제창 생성 (Hosted 결제창 URL 반환)
export const createTossCheckout = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  const { clubId, amount, orderName } = data || {};
  if (!clubId || !amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'clubId와 amount가 필요합니다.');
  }

  if (!TOSS_SECRET_KEY || !PUBLIC_URL) {
    throw new functions.https.HttpsError('failed-precondition', '서버 환경변수가 설정되지 않았습니다.');
  }

  const orderId = `club-${clubId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  // 주문 생성
  await db.collection('membershipOrders').doc(orderId).set({
    orderId,
    clubId,
    userId: context.auth.uid,
    orderName: orderName || '클럽 회원가입',
    amount: Number(amount),
    currency: 'KRW',
    status: 'pending',
    paymentKey: null,
    toss: { method: null, secret: null },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    paidAt: null
  });

  // Toss Hosted 결제창 생성
  const body = {
    orderId,
    orderName: orderName || '클럽 회원가입',
    amount: Number(amount),
    currency: 'KRW',
    successUrl: `${PUBLIC_URL}/join/success`,
    failUrl: `${PUBLIC_URL}/join/fail`
  };

  const res: any = await tossFetch('/v1/payments', { 
    method: 'POST', 
    body: JSON.stringify(body) 
  });
  
  const checkoutUrl: string = res?.checkout?.url;
  if (!checkoutUrl) {
    throw new functions.https.HttpsError('internal', 'checkout.url 없음');
  }

  return { orderId, checkoutUrl };
});

// 결제 승인 (성공 페이지에서 호출)
export const confirmTossPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  const { paymentKey, orderId, amount } = data || {};
  if (!paymentKey || !orderId || !amount) {
    throw new functions.https.HttpsError('invalid-argument', 'paymentKey/orderId/amount 필요');
  }

  // 주문 검증
  const ref = db.collection('membershipOrders').doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', '주문 없음');
  }

  const order = snap.data()!;
  if (order.userId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', '주문 소유자 아님');
  }

  if (Number(order.amount) !== Number(amount)) {
    throw new functions.https.HttpsError('failed-precondition', '금액 불일치');
  }

  // Toss 결제 승인
  const res: any = await tossFetch('/v1/payments/confirm', {
    method: 'POST',
    body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) })
  });

  // 주문 상태 업데이트
  await ref.update({
    status: 'paid',
    paymentKey,
    'toss.method': res?.method || null,
    'toss.secret': res?.secret || null,
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
      method: res?.method, 
      totalAmount: res?.totalAmount 
    } 
  };
});

// Toss Webhook (옵션: 안정성 강화)
export const tossWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const evt = req.body;
    const paymentKey = evt?.data?.paymentKey;
    const orderId = evt?.data?.orderId;
    const status = evt?.data?.status; // READY|IN_PROGRESS|DONE|CANCELED...

    if (!paymentKey || !orderId) {
      return res.status(400).send('Bad payload');
    }

    const ref = db.collection('membershipOrders').doc(orderId);
    const snap = await ref.get();
    
    if (snap.exists) {
      const order = snap.data()!;
      
      // secret 검증 (confirm 응답의 payment.secret을 저장해둔 경우)
      if (evt?.data?.secret && order?.toss?.secret && evt.data.secret !== order.toss.secret) {
        console.warn('webhook secret mismatch', orderId);
        return res.status(400).send('Secret mismatch');
      }
      
      if (status === 'DONE') {
        await ref.update({ status: 'paid', paymentKey });
      }
      if (status === 'CANCELED') {
        await ref.update({ status: 'canceled' });
      }
    }
    
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return res.status(500).send('err');
  }
});
