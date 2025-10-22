import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();

export const claimCoupon = functions.https.onCall(async (data, ctx) => {
  const { eventId, code } = data as { eventId: string; code: string };
  const uid = ctx.auth?.uid; 
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'login');
  
  const ref = db.doc(`events/${eventId}/coupons/${String(code).toUpperCase()}`);
  
  await db.runTransaction(async tx => {
    const c = await tx.get(ref); 
    if (!c.exists) throw new functions.https.HttpsError('not-found', '쿠폰 없음');
    
    const cu = c.data() as any;
    if (!cu.active) throw new functions.https.HttpsError('failed-precondition', '비활성');
    
    // per-user 선점 중복 방지
    const wRef = db.doc(`users/${uid}/wallet_coupons/${c.id}`);
    const w = await tx.get(wRef);
    if (w.exists) return; // 이미 지갑에 있음(멱등)

    tx.set(wRef, { eventId, claimedAt: now(), status: 'claimed' });
  });
  
  return { ok: true };
});

// 결제 확정(confirmPayment) 이후 호출해 사용 처리(멱등)
export async function markWalletUsed(eventId: string, orderId: string, uid: string) {
  const pay = (await db.doc(`events/${eventId}/payments/${orderId}`).get()).data() as any;
  const code = pay?.couponCode; 
  if (!code) return;
  
  const wRef = db.doc(`users/${uid}/wallet_coupons/${code}`);
  await wRef.set({ usedAt: now(), status: 'used' }, { merge: true });
}
