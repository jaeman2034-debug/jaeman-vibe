import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { logAuditEvent, logBusinessEvent } from '../lib/audit';
import { ensureEnabled } from '../lib/flags';

export type PaymentStatus = 'initiated' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'card' | 'bank_transfer' | 'kakao_pay' | 'toss_pay';

/**
 * 결제 생성 (멱등성 보장)
 */
export const createPayment = onCall({
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new Error('UNAUTHENTICATED');
  }

  // 결제 기능 활성화 확인
  await ensureEnabled('payments_enabled');

  const {
    orderId,
    amount,
    idempotencyKey,
    paymentMethod,
    description
  } = req.data as {
    orderId: string;
    amount: number;
    idempotencyKey: string;
    paymentMethod: PaymentMethod;
    description?: string;
  };

  // 입력 검증
  if (amount <= 0) {
    throw new Error('INVALID_AMOUNT');
  }

  if (!idempotencyKey) {
    throw new Error('IDEMPOTENCY_KEY_REQUIRED');
  }

  try {
    const db = admin.firestore();
    const orderRef = db.doc(`orders/${orderId}`);
    
    return await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      
      if (orderDoc.exists) {
        const orderData = orderDoc.data()!;
        
        // 멱등성 체크
        if (orderData.idempotencyKey === idempotencyKey) {
          if (orderData.status === 'paid') {
            return { 
              success: true, 
              orderId, 
              status: 'already_paid',
              paymentId: orderData.paymentId 
            };
          }
          throw new Error('DUPLICATE_ORDER_CONFLICT');
        }
        
        throw new Error('ORDER_ID_ALREADY_EXISTS');
      }
      
      // 새 주문 생성
      const orderData = {
        uid,
        orderId,
        amount,
        idempotencyKey,
        paymentMethod,
        description: description || '',
        status: 'initiated' as PaymentStatus,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      transaction.set(orderRef, orderData);
      
      // TODO: 실제 PG 연동 (Toss, PortOne 등)
      // 여기서는 시뮬레이션
      const paymentResult = await simulatePayment(amount, paymentMethod);
      
      if (paymentResult.success) {
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const receiptNo = `R-${Date.now()}`;
        
        transaction.update(orderRef, {
          status: 'paid' as PaymentStatus,
          paymentId,
          receiptNo,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          pgTransactionId: paymentResult.transactionId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        await logBusinessEvent('payment_completed', uid, 'orders', orderId, {
          amount,
          paymentMethod,
          paymentId,
          receiptNo
        });
        
        return {
          success: true,
          orderId,
          paymentId,
          receiptNo,
          status: 'paid'
        };
      } else {
        transaction.update(orderRef, {
          status: 'failed' as PaymentStatus,
          failureReason: paymentResult.error,
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        throw new Error(`PAYMENT_FAILED: ${paymentResult.error}`);
      }
    });
  } catch (error) {
    await logAuditEvent('payment_creation_failed', uid, {
      orderId,
      amount,
      paymentMethod,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 결제 취소
 */
export const cancelPayment = onCall({
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new Error('UNAUTHENTICATED');
  }

  const { orderId, reason } = req.data as {
    orderId: string;
    reason?: string;
  };

  try {
    const db = admin.firestore();
    const orderRef = db.doc(`orders/${orderId}`);
    
    await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      
      if (!orderDoc.exists) {
        throw new Error('ORDER_NOT_FOUND');
      }
      
      const orderData = orderDoc.data()!;
      
      // 권한 확인
      if (orderData.uid !== uid) {
        throw new Error('PERMISSION_DENIED');
      }
      
      // 취소 가능한 상태인지 확인
      if (!['initiated', 'paid'].includes(orderData.status)) {
        throw new Error('ORDER_NOT_CANCELLABLE');
      }
      
      // 결제 취소 처리
      if (orderData.status === 'paid') {
        // TODO: 실제 PG 취소 API 호출
        const cancelResult = await simulatePaymentCancel(orderData.paymentId!);
        
        if (!cancelResult.success) {
          throw new Error(`CANCEL_FAILED: ${cancelResult.error}`);
        }
      }
      
      transaction.update(orderRef, {
        status: 'cancelled' as PaymentStatus,
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        cancelReason: reason || 'User requested',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await logBusinessEvent('payment_cancelled', uid, 'orders', orderId, {
      reason
    });
    
    return { success: true };
  } catch (error) {
    await logAuditEvent('payment_cancel_failed', uid, {
      orderId,
      reason,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 부분 환불
 */
export const partialRefund = onCall({
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new Error('UNAUTHENTICATED');
  }

  const { orderId, refundAmount, reason } = req.data as {
    orderId: string;
    refundAmount: number;
    reason: string;
  };

  try {
    const db = admin.firestore();
    const orderRef = db.doc(`orders/${orderId}`);
    
    await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      
      if (!orderDoc.exists) {
        throw new Error('ORDER_NOT_FOUND');
      }
      
      const orderData = orderDoc.data()!;
      
      // 권한 확인 (관리자 또는 주문자)
      const isAdmin = req.auth?.token?.role === 'admin';
      if (orderData.uid !== uid && !isAdmin) {
        throw new Error('PERMISSION_DENIED');
      }
      
      // 환불 가능한 상태인지 확인
      if (orderData.status !== 'paid') {
        throw new Error('ORDER_NOT_REFUNDABLE');
      }
      
      // 환불 금액 검증
      if (refundAmount <= 0 || refundAmount > orderData.amount) {
        throw new Error('INVALID_REFUND_AMOUNT');
      }
      
      // TODO: 실제 PG 환불 API 호출
      const refundResult = await simulateRefund(orderData.paymentId!, refundAmount);
      
      if (!refundResult.success) {
        throw new Error(`REFUND_FAILED: ${refundResult.error}`);
      }
      
      const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      transaction.update(orderRef, {
        status: refundAmount === orderData.amount ? 'refunded' : 'partially_refunded',
        refundedAmount: (orderData.refundedAmount || 0) + refundAmount,
        refunds: admin.firestore.FieldValue.arrayUnion({
          refundId,
          amount: refundAmount,
          reason,
          refundedAt: admin.firestore.FieldValue.serverTimestamp()
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await logBusinessEvent('payment_refunded', uid, 'orders', orderId, {
      refundAmount,
      reason
    });
    
    return { success: true };
  } catch (error) {
    await logAuditEvent('payment_refund_failed', uid, {
      orderId,
      refundAmount,
      reason,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 주문 내역 조회
 */
export const getOrderHistory = onCall({
  enforceAppCheck: true,
  region: 'asia-northeast3'
}, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new Error('UNAUTHENTICATED');
  }

  const { limit = 20, startAfter } = req.data as {
    limit?: number;
    startAfter?: string;
  };

  try {
    const db = admin.firestore();
    let queryRef = db.collection('orders')
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limit);
    
    if (startAfter) {
      const startDoc = await db.doc(`orders/${startAfter}`).get();
      queryRef = queryRef.startAfter(startDoc);
    }
    
    const snapshot = await queryRef.get();
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      orders,
      hasMore: snapshot.docs.length === limit
    };
  } catch (error) {
    await logAuditEvent('order_history_fetch_failed', uid, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
});

/**
 * 결제 시뮬레이션 (개발용)
 */
async function simulatePayment(amount: number, method: PaymentMethod): Promise<{
  success: boolean;
  transactionId?: string;
  error?: string;
}> {
  // 90% 성공률로 시뮬레이션
  if (Math.random() < 0.9) {
    return {
      success: true,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
  
  return {
    success: false,
    error: 'Payment simulation failed'
  };
}

/**
 * 결제 취소 시뮬레이션
 */
async function simulatePaymentCancel(paymentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // 95% 성공률로 시뮬레이션
  if (Math.random() < 0.95) {
    return { success: true };
  }
  
  return {
    success: false,
    error: 'Cancel simulation failed'
  };
}

/**
 * 환불 시뮬레이션
 */
async function simulateRefund(paymentId: string, amount: number): Promise<{
  success: boolean;
  error?: string;
}> {
  // 95% 성공률로 시뮬레이션
  if (Math.random() < 0.95) {
    return { success: true };
  }
  
  return {
    success: false,
    error: 'Refund simulation failed'
  };
}
