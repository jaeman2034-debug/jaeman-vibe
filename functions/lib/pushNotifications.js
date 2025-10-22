import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { logPush, logError } from "./loggingUtils";
/**
 * 🔔 푸시 알림 시스템
 * 새 상품 등록 시 관련 구독자들에게 자동 알림 발송
 */
// Firebase Admin 초기화
admin.initializeApp();
/**
 * 새 상품 등록 시 푸시 알림 발송
 */
export const onMarketItemCreate = functions
    .region("asia-northeast3")
    .firestore.document("marketItems/{itemId}")
    .onCreate(async (snap, context) => {
    const item = snap.data();
    const itemId = context.params.itemId;
    console.log(`🆕 새 상품 등록: ${item.title} (${itemId})`);
    // 상품 데이터 검증
    const tags = item.autoTags || [];
    const location = item.location;
    if (!tags.length) {
        console.log("⚠️ 상품에 태그가 없어 알림을 발송하지 않습니다.");
        return;
    }
    if (!location) {
        console.log("⚠️ 상품에 위치 정보가 없어 알림을 발송하지 않습니다.");
        return;
    }
    try {
        // 구독자 조회
        const subscriptionsSnapshot = await admin.firestore()
            .collection("subscriptions")
            .get();
        const matchedSubscriptions = [];
        // 키워드 매칭 및 위치 필터링
        for (const subscriptionDoc of subscriptionsSnapshot.docs) {
            const subscription = subscriptionDoc.data();
            // 키워드 매칭 확인
            if (tags.includes(subscription.keyword)) {
                // 위치 기반 필터링 (반경 내 확인)
                if (isWithinRadius(subscription.geo, location, subscription.radius || 5)) {
                    matchedSubscriptions.push(subscriptionDoc);
                }
            }
        }
        console.log(`🎯 매칭된 구독자: ${matchedSubscriptions.length}명`);
        // 푸시 알림 발송
        const notificationPromises = matchedSubscriptions.map(async (subscriptionDoc) => {
            var _a, _b, _c, _d;
            const subscription = subscriptionDoc.data();
            const fcmToken = subscription.fcmToken;
            try {
                // FCM 메시지 구성
                const message = {
                    to: fcmToken,
                    sound: 'default',
                    title: '🆕 새 상품 알림',
                    body: `${item.title}이(가) 근처에 등록되었습니다!`,
                    data: {
                        itemId,
                        keyword: subscription.keyword,
                        type: 'new_item',
                        click_action: 'FLUTTER_NOTIFICATION_CLICK'
                    },
                    notification: {
                        title: '🆕 새 상품 알림',
                        body: `${item.title}이(가) 근처에 등록되었습니다!`,
                        sound: 'default',
                        badge: '1'
                    }
                };
                // FCM 전송
                const response = await admin.messaging().send(message);
                console.log(`✅ 알림 발송 성공: ${subscription.uid} (${subscription.keyword})`);
                // 푸시 알림 로그 저장
                await logPush({
                    title: ((_a = message.notification) === null || _a === void 0 ? void 0 : _a.title) || "새 상품 알림",
                    body: ((_b = message.notification) === null || _b === void 0 ? void 0 : _b.body) || "",
                    tokens: [fcmToken],
                    data: { itemId, keyword: subscription.keyword },
                    successCount: 1,
                    failureCount: 0
                });
                // 알림 로그 저장
                await admin.firestore().collection("notifications").add({
                    recipientId: subscription.uid,
                    itemId,
                    keyword: subscription.keyword,
                    title: (_c = message.notification) === null || _c === void 0 ? void 0 : _c.title,
                    body: (_d = message.notification) === null || _d === void 0 ? void 0 : _d.body,
                    sentAt: admin.firestore.FieldValue.serverTimestamp(),
                    status: 'sent',
                    fcmResponse: response
                });
                return { success: true, userId: subscription.uid };
            }
            catch (error) {
                console.error(`❌ 알림 발송 실패: ${subscription.uid}`, error);
                // 에러 로그 저장
                await logError("pushNotification", error, {
                    userId: subscription.uid,
                    itemId,
                    keyword: subscription.keyword,
                    fcmToken
                });
                // 실패 로그 저장
                await admin.firestore().collection("notifications").add({
                    recipientId: subscription.uid,
                    itemId,
                    keyword: subscription.keyword,
                    title: '알림 발송 실패',
                    body: `상품: ${item.title}`,
                    sentAt: admin.firestore.FieldValue.serverTimestamp(),
                    status: 'failed',
                    error: error.message
                });
                return { success: false, userId: subscription.uid, error };
            }
        });
        // 모든 알림 발송 완료 대기
        const results = await Promise.allSettled(notificationPromises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failureCount = results.length - successCount;
        console.log(`🔔 푸시 알림 발송 완료: 성공 ${successCount}건, 실패 ${failureCount}건`);
        // 통계 업데이트
        await admin.firestore().collection("notificationStats").doc("daily").set({
            date: new Date().toISOString().split('T')[0],
            totalSent: admin.firestore.FieldValue.increment(successCount),
            totalFailed: admin.firestore.FieldValue.increment(failureCount),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
    catch (error) {
        console.error("❌ 푸시 알림 처리 실패:", error);
    }
});
/**
 * 거리 계산 함수 (Haversine formula)
 */
function isWithinRadius(userGeo, itemGeo, radiusKm = 5) {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (itemGeo.lat - userGeo.lat) * Math.PI / 180;
    const dLon = (itemGeo.lng - userGeo.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userGeo.lat * Math.PI / 180) * Math.cos(itemGeo.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance <= radiusKm;
}
/**
 * 주기적 알림 요약 (매일 오전 9시)
 */
export const dailyNotificationSummary = functions
    .region("asia-northeast3")
    .pubsub.schedule("0 9 * * *") // 매일 오전 9시 (KST)
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
    console.log("📊 일일 알림 요약 시작");
    try {
        // 어제 새로 등록된 상품 조회
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const itemsSnapshot = await admin.firestore()
            .collection("marketItems")
            .where("createdAt", ">=", yesterday)
            .where("createdAt", "<", today)
            .get();
        if (itemsSnapshot.empty) {
            console.log("📭 어제 등록된 새 상품이 없습니다.");
            return;
        }
        const newItems = itemsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // 모든 구독자에게 요약 알림 발송
        const subscriptionsSnapshot = await admin.firestore()
            .collection("subscriptions")
            .get();
        const summaryPromises = subscriptionsSnapshot.docs.map(async (subscriptionDoc) => {
            const subscription = subscriptionDoc.data();
            const fcmToken = subscription.fcmToken;
            // 해당 구독자의 키워드와 매칭되는 상품 필터링
            const matchingItems = newItems.filter(item => { var _a; return (_a = item.autoTags) === null || _a === void 0 ? void 0 : _a.includes(subscription.keyword); });
            if (matchingItems.length === 0)
                return;
            try {
                const message = {
                    to: fcmToken,
                    sound: 'default',
                    title: '📊 오늘의 새 상품',
                    body: `'${subscription.keyword}' 관련 새 상품 ${matchingItems.length}개가 등록되었습니다!`,
                    data: {
                        type: 'daily_summary',
                        keyword: subscription.keyword,
                        itemCount: matchingItems.length.toString()
                    }
                };
                await admin.messaging().send(message);
                console.log(`📊 요약 알림 발송: ${subscription.uid}`);
            }
            catch (error) {
                console.error(`❌ 요약 알림 발송 실패: ${subscription.uid}`, error);
            }
        });
        await Promise.allSettled(summaryPromises);
        console.log("📊 일일 알림 요약 완료");
    }
    catch (error) {
        console.error("❌ 일일 알림 요약 실패:", error);
    }
});
/**
 * n8n 웹훅 알림 (선택사항)
 */
export const notifyN8nNewItem = functions
    .region("asia-northeast3")
    .firestore.document("marketItems/{itemId}")
    .onCreate(async (snap, context) => {
    var _a;
    const item = snap.data();
    const itemId = context.params.itemId;
    // n8n 웹훅 URL 확인
    const n8nWebhook = (_a = functions.config().n8n) === null || _a === void 0 ? void 0 : _a.webhook;
    if (!n8nWebhook)
        return;
    try {
        const response = await fetch(n8nWebhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "new_item_registered",
                itemId,
                title: item.title,
                autoTags: item.autoTags,
                location: item.location,
                timestamp: new Date().toISOString()
            })
        });
        if (response.ok) {
            console.log("✅ n8n 알림 전송 완료");
        }
    }
    catch (error) {
        console.error("❌ n8n 알림 전송 실패:", error);
    }
});
//# sourceMappingURL=pushNotifications.js.map