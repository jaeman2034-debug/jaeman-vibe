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
exports.SystemNotifications = exports.MarketNotifications = void 0;
exports.sendNotification = sendNotification;
exports.sendToUser = sendToUser;
exports.sendToUsers = sendToUsers;
exports.sendToTokens = sendToTokens;
const admin = __importStar(require("firebase-admin"));
const audit_1 = require("./audit");
/**
 * 멱등 알림 발송
 */
async function sendNotification(key, target, payload) {
    try {
        const db = admin.firestore();
        const dedupRef = db.collection('notif_dedupe').doc(key);
        // 중복 체크
        const dedupDoc = await dedupRef.get();
        if (dedupDoc.exists) {
            console.log('Notification already sent:', key);
            return { success: true, messageId: 'duplicate' };
        }
        // FCM 토큰 수집
        const tokens = await collectFCMTokens(target);
        if (tokens.length === 0) {
            console.log('No FCM tokens found for notification:', key);
            return { success: true, messageId: 'no_tokens' };
        }
        // FCM 메시지 구성
        const message = {
            tokens,
            notification: {
                title: payload.title,
                body: payload.body,
                imageUrl: payload.imageUrl
            },
            data: payload.data || {},
            android: {
                priority: 'high',
                notification: {
                    channelId: 'default',
                    priority: 'high'
                }
            },
            apns: {
                payload: {
                    aps: {
                        alert: {
                            title: payload.title,
                            body: payload.body
                        },
                        badge: 1,
                        sound: 'default'
                    }
                }
            }
        };
        // FCM 발송
        const response = await admin.messaging().sendEachForMulticast(message);
        // 성공/실패 로깅
        const successCount = response.successCount;
        const failureCount = response.failureCount;
        console.log(`Notification sent: ${successCount} success, ${failureCount} failures`);
        // 실패한 토큰들 정리
        if (failureCount > 0) {
            await cleanupFailedTokens(response.responses, tokens);
        }
        // 중복 방지 레코드 저장
        await dedupRef.set({
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            successCount,
            failureCount,
            targetTokens: tokens.length
        });
        await (0, audit_1.logAuditEvent)('notification_sent', undefined, {
            key,
            successCount,
            failureCount,
            targetTokens: tokens.length
        });
        return {
            success: true,
            messageId: `batch_${Date.now()}`
        };
    }
    catch (error) {
        console.error('Notification sending failed:', error);
        await (0, audit_1.logAuditEvent)('notification_failed', undefined, {
            key,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
/**
 * FCM 토큰 수집
 */
async function collectFCMTokens(target) {
    const tokens = [];
    // 직접 제공된 토큰들
    if (target.tokens) {
        tokens.push(...target.tokens);
    }
    // 사용자 ID로부터 토큰 수집
    if (target.userIds && target.userIds.length > 0) {
        const db = admin.firestore();
        const userTokens = await Promise.all(target.userIds.map(async (userId) => {
            const userDoc = await db.doc(`users/${userId}`).get();
            return userDoc.data()?.fcmTokens || [];
        }));
        userTokens.forEach(userTokenList => {
            tokens.push(...userTokenList);
        });
    }
    // 토픽 구독자들에게 발송
    if (target.topic) {
        // 토픽 구독은 별도 처리 필요
        // 여기서는 토큰 기반으로만 처리
    }
    // 중복 제거
    return [...new Set(tokens)];
}
/**
 * 실패한 FCM 토큰 정리
 */
async function cleanupFailedTokens(responses, tokens) {
    const db = admin.firestore();
    const batch = db.batch();
    responses.forEach((response, index) => {
        if (!response.success) {
            const token = tokens[index];
            const error = response.error;
            // 토큰이 유효하지 않은 경우 사용자 문서에서 제거
            if (error?.code === 'messaging/invalid-registration-token' ||
                error?.code === 'messaging/registration-token-not-registered') {
                // 사용자 문서에서 해당 토큰 제거
                // 실제 구현에서는 토큰과 사용자 매핑을 저장해야 함
                console.log('Removing invalid token:', token);
            }
        }
    });
    if (batch._mutations.length > 0) {
        await batch.commit();
    }
}
/**
 * 사용자별 알림 발송
 */
async function sendToUser(userId, payload, options = {}) {
    const key = options.idempotencyKey || `user_${userId}_${Date.now()}`;
    return sendNotification(key, { userIds: [userId] }, payload);
}
/**
 * 다중 사용자 알림 발송
 */
async function sendToUsers(userIds, payload, options = {}) {
    const key = options.idempotencyKey || `users_${userIds.length}_${Date.now()}`;
    return sendNotification(key, { userIds }, payload);
}
/**
 * 토큰 기반 알림 발송
 */
async function sendToTokens(tokens, payload, options = {}) {
    const key = options.idempotencyKey || `tokens_${tokens.length}_${Date.now()}`;
    return sendNotification(key, { tokens }, payload);
}
/**
 * 마켓 관련 알림 템플릿
 */
exports.MarketNotifications = {
    itemSold: (itemTitle, buyerName) => ({
        title: '상품이 판매되었습니다!',
        body: `"${itemTitle}"이(가) ${buyerName}님에게 판매되었습니다.`,
        data: { type: 'item_sold' }
    }),
    itemReserved: (itemTitle, sellerName) => ({
        title: '상품 예약 요청',
        body: `"${itemTitle}"에 대한 예약 요청이 ${sellerName}님으로부터 왔습니다.`,
        data: { type: 'item_reserved' }
    }),
    offerReceived: (itemTitle, bidderName, price) => ({
        title: '새로운 입찰',
        body: `"${itemTitle}"에 ${bidderName}님이 ${price.toLocaleString()}원으로 입찰했습니다.`,
        data: { type: 'offer_received' }
    }),
    offerAccepted: (itemTitle, sellerName) => ({
        title: '입찰이 수락되었습니다!',
        body: `"${itemTitle}"에 대한 입찰이 ${sellerName}님에게 수락되었습니다.`,
        data: { type: 'offer_accepted' }
    })
};
/**
 * 시스템 알림 템플릿
 */
exports.SystemNotifications = {
    accountSuspended: (reason) => ({
        title: '계정이 제한되었습니다',
        body: `계정이 제한되었습니다. 사유: ${reason}`,
        data: { type: 'account_suspended' }
    }),
    reportProcessed: (targetType, action) => ({
        title: '신고가 처리되었습니다',
        body: `${targetType}에 대한 신고가 ${action} 처리되었습니다.`,
        data: { type: 'report_processed' }
    }),
    paymentCompleted: (amount, itemTitle) => ({
        title: '결제가 완료되었습니다',
        body: `${itemTitle} 구매 결제 ${amount.toLocaleString()}원이 완료되었습니다.`,
        data: { type: 'payment_completed' }
    })
};
