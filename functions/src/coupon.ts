import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();

async function assertStaff(eventId: string, uid?: string) {
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'login');
  const role = await db.doc(`events/${eventId}/roles/${uid}`).get();
  if (!role.exists) throw new functions.https.HttpsError('permission-denied', 'staff only');
}

export const upsertCoupon = functions.https.onCall(async (data, ctx) => {
  const { eventId, code, payload } = data as { eventId: string; code: string; payload: any };
  await assertStaff(eventId, ctx.auth?.uid);
  
  const CODE = String(code || '').trim().toUpperCase();
  if (!/^[A-Z0-9\-]{3,32}$/.test(CODE)) {
    throw new functions.https.HttpsError('invalid-argument', 'bad code');
  }
  
  const doc = { 
    ...payload, 
    usedCount: admin.firestore.FieldValue.increment(0), 
    updatedAt: now(),
    createdAt: now(), 
    createdBy: ctx.auth!.uid 
  };
  
  await db.doc(`events/${eventId}/coupons/${CODE}`).set(doc, { merge: true });
  return { ok: true };
});

type Coupon = { 
  type: 'percent' | 'fixed'; 
  value: number; 
  maxDiscount?: number; 
  minSpend?: number;
  startAt?: FirebaseFirestore.Timestamp; 
  endAt?: FirebaseFirestore.Timestamp;
  perUserLimit?: number; 
  totalLimit?: number; 
  usedCount: number; 
  active: boolean 
};

export const validateCoupon = functions.https.onCall(async (data, ctx) => {
  const { eventId, code, amount } = data as { eventId: string; code: string; amount: number };
  const uid = ctx.auth?.uid; 
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'login');
  
  const snap = await db.doc(`events/${eventId}/coupons/${String(code || '').toUpperCase()}`).get();
  if (!snap.exists) throw new functions.https.HttpsError('not-found', '쿠폰 없음');
  
  const c = snap.data() as Coupon;
  if (!c.active) throw new functions.https.HttpsError('failed-precondition', '비활성 쿠폰');
  
  const nowMs = Date.now();
  if (c.startAt && c.startAt.toMillis() > nowMs) {
    throw new functions.https.HttpsError('failed-precondition', '아직 사용 불가');
  }
  if (c.endAt && c.endAt.toMillis() < nowMs) {
    throw new functions.https.HttpsError('failed-precondition', '만료됨');
  }
  if (c.minSpend && amount < c.minSpend) {
    throw new functions.https.HttpsError('failed-precondition', '최소 결제 금액 미달');
  }
  if (c.totalLimit && (c.usedCount || 0) >= c.totalLimit) {
    throw new functions.https.HttpsError('resource-exhausted', '조기 소진');
  }
  
  // per-user 사용 이력
  const used = await db.collection(`users/${uid}/coupon_uses`)
    .where('eventId', '==', eventId)
    .where('code', '==', snap.id)
    .get();
  if (c.perUserLimit && used.size >= c.perUserLimit) {
    throw new functions.https.HttpsError('resource-exhausted', '이미 사용함');
  }

  // 할인액 계산
  let discount = c.type === 'percent' ? Math.floor(amount * (c.value / 100)) : Math.floor(c.value);
  if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
  discount = Math.max(0, Math.min(discount, amount));
  
  return { 
    ok: true, 
    code: snap.id, 
    discount, 
    payable: amount - discount, 
    coupon: c 
  };
});

// 결제 확정(confirmPayment) 시 사용량 반영(멱등)
export async function consumeCouponIfAny(evId: string, orderId: string, uid: string) {
  const payRef = db.doc(`events/${evId}/payments/${orderId}`);
  const pay = (await payRef.get()).data() as any;
  const code = pay?.couponCode; 
  const discount = pay?.discount || 0;
  if (!code || !discount) return;

  const usedRef = db.collection(`users/${uid}/coupon_uses`).doc(`${evId}_${orderId}`);
  const exists = await usedRef.get();
  if (exists.exists) return; // 멱등

  await db.runTransaction(async tx => {
    tx.set(usedRef, { eventId: evId, orderId, code, discount, at: now() });
    tx.update(db.doc(`events/${evId}/coupons/${code}`), { 
      usedCount: admin.firestore.FieldValue.increment(1) 
    });
  });
}
