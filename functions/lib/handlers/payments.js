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
exports.getOrderHistory = exports.partialRefund = exports.cancelPayment = exports.createPayment = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const audit_1 = require("../lib/audit");
const flags_1 = require("../lib/flags");
/**
 * 결제 생성 (멱등성 보장)
 */
exports.createPayment = (0, https_1.onCall)({
    enforceAppCheck: true,
    region: 'asia-northeast3'
}, async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
        throw new Error('UNAUTHENTICATED');
    }
    // 결제 기능 활성화 확인
    await (0, flags_1.ensureEnabled)('payments_enabled');
    const { orderId, amount, idempotencyKey, paymentMethod, description } = req.data;
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
                const orderData = orderDoc.data();
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
                status: 'initiated',
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
                    status: 'paid',
                    paymentId,
                    receiptNo,
                    paidAt: admin.firestore.FieldValue.serverTimestamp(),
                    pgTransactionId: paymentResult.transactionId,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                await (0, audit_1.logBusinessEvent)('payment_completed', uid, 'orders', orderId, {
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
            }
            else {
                transaction.update(orderRef, {
                    status: 'failed',
                    failureReason: paymentResult.error,
                    failedAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                throw new Error(`PAYMENT_FAILED: ${paymentResult.error}`);
            }
        });
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('payment_creation_failed', uid, {
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
exports.cancelPayment = (0, https_1.onCall)({
    enforceAppCheck: true,
    region: 'asia-northeast3'
}, async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
        throw new Error('UNAUTHENTICATED');
    }
    const { orderId, reason } = req.data;
    try {
        const db = admin.firestore();
        const orderRef = db.doc(`orders/${orderId}`);
        await db.runTransaction(async (transaction) => {
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists) {
                throw new Error('ORDER_NOT_FOUND');
            }
            const orderData = orderDoc.data();
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
                const cancelResult = await simulatePaymentCancel(orderData.paymentId);
                if (!cancelResult.success) {
                    throw new Error(`CANCEL_FAILED: ${cancelResult.error}`);
                }
            }
            transaction.update(orderRef, {
                status: 'cancelled',
                cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
                cancelReason: reason || 'User requested',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        await (0, audit_1.logBusinessEvent)('payment_cancelled', uid, 'orders', orderId, {
            reason
        });
        return { success: true };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('payment_cancel_failed', uid, {
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
exports.partialRefund = (0, https_1.onCall)({
    enforceAppCheck: true,
    region: 'asia-northeast3'
}, async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
        throw new Error('UNAUTHENTICATED');
    }
    const { orderId, refundAmount, reason } = req.data;
    try {
        const db = admin.firestore();
        const orderRef = db.doc(`orders/${orderId}`);
        await db.runTransaction(async (transaction) => {
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists) {
                throw new Error('ORDER_NOT_FOUND');
            }
            const orderData = orderDoc.data();
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
            const refundResult = await simulateRefund(orderData.paymentId, refundAmount);
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
        await (0, audit_1.logBusinessEvent)('payment_refunded', uid, 'orders', orderId, {
            refundAmount,
            reason
        });
        return { success: true };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('payment_refund_failed', uid, {
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
exports.getOrderHistory = (0, https_1.onCall)({
    enforceAppCheck: true,
    region: 'asia-northeast3'
}, async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
        throw new Error('UNAUTHENTICATED');
    }
    const { limit = 20, startAfter } = req.data;
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
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('order_history_fetch_failed', uid, {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
/**
 * 결제 시뮬레이션 (개발용)
 */
async function simulatePayment(amount, method) {
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
async function simulatePaymentCancel(paymentId) {
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
async function simulateRefund(paymentId, amount) {
    // 95% 성공률로 시뮬레이션
    if (Math.random() < 0.95) {
        return { success: true };
    }
    return {
        success: false,
        error: 'Refund simulation failed'
    };
}
