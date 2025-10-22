import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';
import { sendToUser, sendToTopic, topic } from './fcm';
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();

const SECRET = process.env.TOSS_SECRET_KEY as string; // "test_sk_xxx"
const BASE   = 'https://api.tosspayments.com/v1';

function basicAuth(){ return 'Basic ' + Buffer.from(`${SECRET}:`).toString('base64'); }

export const createPaymentIntent = functions.https.onCall(async (data, ctx) => {
  const { eventId, amount, orderName, couponCode, bizName, bizRegNo } = data as any;
  if (!(ctx as any).auth) throw new functions.https.HttpsError('unauthenticated','login');
  if (!eventId || !amount) throw new functions.https.HttpsError('invalid-argument','bad args');
  
  let discount = 0, code: string | undefined;
  
  // 쿠폰 검증 및 할인액 계산
  if (couponCode) {
    const cdoc = await db.doc(`events/${eventId}/coupons/${String(couponCode).toUpperCase()}`).get();
    if (cdoc.exists) {
      const c = cdoc.data() as any;
      let dc = c.type === 'percent' ? Math.floor(amount * (c.value / 100)) : Math.floor(c.value);
      if (c.maxDiscount) dc = Math.min(dc, c.maxDiscount);
      discount = Math.max(0, Math.min(dc, amount)); 
      code = cdoc.id;
    }
  }
  
  const orderId = `ev_${eventId}_${Date.now()}`;
  const paymentData: any = {
    uid: (ctx as any).auth.uid, 
    amount, 
    status:'pending', 
    orderName, 
    createdAt: now(),
    discount,
    couponCode: code || null
  };
  
  // 영수증 정보 추가
  if (bizName || bizRegNo) {
    paymentData.invoice = {
      bizName: bizName || null,
      bizRegNo: bizRegNo || null
    };
  }

  await db.doc(`events/${eventId}/payments/${orderId}`).set(paymentData);
  return { orderId, payable: amount - discount, discount };
});

export const confirmPayment = functions.https.onCall(async (data, ctx) => {
  const { paymentKey, orderId, amount, eventId } = data as any;
  if (!paymentKey || !orderId || !amount || !eventId) throw new functions.https.HttpsError('invalid-argument','bad args');

  // 멱등 처리: 이미 paid면 조용히 반환
  const ref = db.doc(`events/${eventId}/payments/${orderId}`);
  const cur = await ref.get();
  if (cur.exists && (cur.data() as any).status === 'paid') {
    return { ok: true, idempotent: true };
  }

  // 1) Toss confirm
  const res = await fetch(`${BASE}/payments/confirm`, {
    method:'POST',
    headers: { 'Authorization': basicAuth(), 'Content-Type':'application/json' },
    body: JSON.stringify({ paymentKey, orderId, amount })
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({message:'confirm failed'})) as any;
    throw new functions.https.HttpsError('failed-precondition', err.message || 'confirm failed');
  }
  const pay = await res.json() as any;

  // 2) 기록 및 참가 처리
  const m = orderId.split('_'); const eventIdFromOrder = m[1];
  const paymentRef = db.doc(`events/${eventIdFromOrder}/payments/${orderId}`);
  let uid: string;
  
  await db.runTransaction(async tx=>{
    tx.set(paymentRef, {
      paymentKey, amount, status:'paid', method: pay.method, approvedAt: now(), raw: { mid: pay.merchantId }
    }, { merge:true });
    // 참가자 문서 보장(없으면 생성)
    uid = (await paymentRef.get()).data()?.uid || ((ctx as any).auth?.uid ?? 'unknown');
    tx.set(db.doc(`events/${eventIdFromOrder}/attendees/${uid}`), { joinedAt: now() }, { merge:true });
    tx.create(db.collection(`events/${eventIdFromOrder}/logs`).doc(), {
      action:'payment.confirm', actorId: uid, at: now(), meta:{ orderId, amount }
    });
  });

  // 3) 쿠폰 소비 기록 (멱등)
  try {
    const { consumeCouponIfAny } = await import('./coupon');
    await consumeCouponIfAny(eventId, orderId, uid!);
  } catch (e) {
    console.error('쿠폰 소비 기록 실패:', e);
  }

  // 4) 지갑 사용 처리 (멱등)
  try {
    const { markWalletUsed } = await import('./coupon_wallet');
    await markWalletUsed(eventId, orderId, uid!);
  } catch (e) {
    console.error('지갑 사용 처리 실패:', e);
  }

  // 4) 결제 완료 푸시 알림
  try {
    // 개별 발송
    await sendToUser(uid!, {
      title: '결제가 완료되었습니다',
      body: `${orderId} · ${amount.toLocaleString()}원`
    }, { 
      type: 'payment.confirm', 
      eventId,
      orderId 
    });

    // 토픽 발송 (참가자들에게 새 결제자 알림)
    await sendToTopic(topic(eventId, 'attendee'), {
      title: '참가 확정 알림',
      body: '결제 완료된 참가자가 있습니다.'
    }, { 
      type: 'payment.new', 
      eventId 
    });
  } catch (error) {
    console.error('결제 완료 푸시 발송 실패:', error);
  }

  return { ok:true };
});

export const refundPayment = functions.https.onCall(async (data, ctx) => {
  const { eventId, orderId, reason } = data as any;
  // 스태프만
  if (!(ctx as any).auth) throw new functions.https.HttpsError('unauthenticated','login');
  const role = await db.doc(`events/${eventId}/roles/${(ctx as any).auth.uid}`).get();
  if (!role.exists) throw new functions.https.HttpsError('permission-denied','staff only');

  const ref = db.doc(`events/${eventId}/payments/${orderId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new functions.https.HttpsError('not-found','order');
  const paymentKey = (snap.data() as any).paymentKey;
  if (!paymentKey) throw new functions.https.HttpsError('failed-precondition','not paid');

  const res = await fetch(`${BASE}/payments/${paymentKey}/cancel`, {
    method:'POST',
    headers:{ 'Authorization': basicAuth(), 'Content-Type':'application/json' },
    body: JSON.stringify({ cancelReason: reason || 'admin refund' })
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({message:'refund failed'})) as any;
    throw new functions.https.HttpsError('failed-precondition', err.message || 'refund failed');
  }
  await ref.set({ status:'canceled', canceledAt: now() }, { merge:true });
  await db.collection(`events/${eventId}/logs`).add({ action:'payment.refund', actorId: (ctx as any).auth.uid, at: now(), meta:{ orderId } });
  return { ok:true };
});
