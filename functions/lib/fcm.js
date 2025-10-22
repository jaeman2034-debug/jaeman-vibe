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
exports.onWaitlistDeleteTopic = exports.onWaitlistCreateTopic = exports.onAttendeeDeleteTopic = exports.onAttendeeCreateTopic = exports.onAttendeeCreateNotify = exports.registerDevice = void 0;
exports.getUserTokens = getUserTokens;
exports.sendToUser = sendToUser;
exports.sendToEventAttendees = sendToEventAttendees;
exports.saveInboxNotification = saveInboxNotification;
exports.sendNotificationWithInbox = sendNotificationWithInbox;
exports.sendEventNotificationWithInbox = sendEventNotificationWithInbox;
exports.topic = topic;
exports.sendToTopic = sendToTopic;
exports.subscribeUserTo = subscribeUserTo;
exports.unsubscribeUserFrom = unsubscribeUserFrom;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// 디바이스 토큰 등록
exports.registerDevice = functions.https.onCall(async (data, ctx) => {
    if (!ctx.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다');
    }
    const { token, platform = 'web', lang = 'ko' } = data;
    if (!token) {
        throw new functions.https.HttpsError('invalid-argument', '토큰이 필요합니다');
    }
    try {
        await db.doc(`users/${ctx.auth.uid}/devices/${token}`).set({
            platform,
            lang,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`디바이스 토큰 등록됨: ${ctx.auth.uid} - ${platform}`);
        return { ok: true };
    }
    catch (error) {
        console.error('디바이스 토큰 등록 실패:', error);
        throw new functions.https.HttpsError('internal', '토큰 등록에 실패했습니다');
    }
});
// 사용자 토큰 조회
async function getUserTokens(uid) {
    const devices = await db.collection(`users/${uid}/devices`).get();
    return devices.docs.map(doc => doc.id);
}
// 특정 사용자에게 푸시 발송
async function sendToUser(uid, notification, data = {}) {
    try {
        const tokens = await getUserTokens(uid);
        if (!tokens.length) {
            console.log(`사용자 ${uid}의 등록된 디바이스가 없습니다`);
            return;
        }
        console.log(`사용자 ${uid}에게 푸시 발송 (${tokens.length}개 디바이스)`);
        const message = {
            tokens,
            notification,
            data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
            }
        };
        const response = await admin.messaging().sendEachForMulticast(message);
        // 실패한 토큰들 정리
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                failedTokens.push(tokens[idx]);
                console.error(`토큰 ${tokens[idx]} 발송 실패:`, resp.error);
            }
        });
        // 실패한 토큰들 삭제
        if (failedTokens.length > 0) {
            const batch = db.batch();
            failedTokens.forEach(token => {
                batch.delete(db.doc(`users/${uid}/devices/${token}`));
            });
            await batch.commit();
            console.log(`${failedTokens.length}개의 실패한 토큰을 삭제했습니다`);
        }
        return response;
    }
    catch (error) {
        console.error(`사용자 ${uid}에게 푸시 발송 실패:`, error);
        throw error;
    }
}
// 이벤트 참가자들에게 푸시 발송
async function sendToEventAttendees(eventId, notification, data = {}) {
    try {
        const attendees = await db.collection(`events/${eventId}/attendees`).select().get();
        if (attendees.empty) {
            console.log(`이벤트 ${eventId}에 참가자가 없습니다`);
            return;
        }
        console.log(`이벤트 ${eventId} 참가자들에게 푸시 발송 (${attendees.size}명)`);
        // 각 참가자에게 개별 발송
        const promises = attendees.docs.map(attendee => sendToUser(attendee.id, notification, { ...data, eventId }));
        await Promise.allSettled(promises);
    }
    catch (error) {
        console.error(`이벤트 ${eventId} 참가자들에게 푸시 발송 실패:`, error);
        throw error;
    }
}
// 대기열에서 참가로 승격 알림
exports.onAttendeeCreateNotify = functions.firestore
    .document('events/{eventId}/attendees/{uid}')
    .onCreate(async (snap, ctx) => {
    const { eventId, uid } = ctx.params;
    try {
        // 대기열에 있었는지 확인
        const waitlistDoc = await db.doc(`events/${eventId}/waitlist/${uid}`).get();
        if (!waitlistDoc.exists) {
            console.log(`사용자 ${uid}는 대기열에 없었으므로 승격 알림을 보내지 않습니다`);
            return;
        }
        // 이벤트 정보 조회
        const eventDoc = await db.doc(`events/${eventId}`).get();
        if (!eventDoc.exists) {
            console.log(`이벤트 ${eventId}를 찾을 수 없습니다`);
            return;
        }
        const eventData = eventDoc.data();
        const eventTitle = eventData?.title || '이벤트';
        // 승격 알림 발송
        await sendToUser(uid, {
            title: '대기열에서 참가로 승격되었습니다',
            body: `${eventTitle} 참가가 확정되었어요!`
        }, {
            type: 'waitlist.promoted',
            eventId
        });
        // 토픽 전환 (대기 → 참가)
        await unsubscribeUserFrom(eventId, uid, 'waitlist');
        await subscribeUserTo(eventId, uid, 'attendee');
        console.log(`사용자 ${uid}에게 승격 알림 발송됨`);
    }
    catch (error) {
        console.error(`승격 알림 발송 실패 (${eventId}/${uid}):`, error);
    }
});
// 인앱 알림 저장
async function saveInboxNotification(uid, item) {
    try {
        await db.collection(`users/${uid}/inbox`).add({
            ...item,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    catch (error) {
        console.error(`인앱 알림 저장 실패 (${uid}):`, error);
    }
}
// 푸시 + 인앱 알림 동시 발송
async function sendNotificationWithInbox(uid, notification, data = {}, inboxItem) {
    try {
        // 푸시 알림 발송
        await sendToUser(uid, notification, data);
        // 인앱 알림 저장 (백업용)
        if (inboxItem) {
            await saveInboxNotification(uid, inboxItem);
        }
    }
    catch (error) {
        console.error(`알림 발송 실패 (${uid}):`, error);
        throw error;
    }
}
// 이벤트 참가자들에게 푸시 + 인앱 알림 동시 발송
async function sendEventNotificationWithInbox(eventId, notification, data = {}, inboxItem) {
    try {
        const attendees = await db.collection(`events/${eventId}/attendees`).select().get();
        if (attendees.empty) {
            console.log(`이벤트 ${eventId}에 참가자가 없습니다`);
            return;
        }
        console.log(`이벤트 ${eventId} 참가자들에게 알림 발송 (${attendees.size}명)`);
        // 각 참가자에게 개별 발송
        const promises = attendees.docs.map(attendee => sendNotificationWithInbox(attendee.id, notification, { ...data, eventId }, inboxItem ? { ...inboxItem, data: { ...inboxItem.data, eventId } } : undefined));
        await Promise.allSettled(promises);
    }
    catch (error) {
        console.error(`이벤트 ${eventId} 참가자들에게 알림 발송 실패:`, error);
        throw error;
    }
}
// 토픽 유틸리티
function topic(eventId, kind) {
    return `event_${eventId}_${kind}`;
}
// 토픽으로 푸시 발송
async function sendToTopic(topicName, notification, data = {}) {
    try {
        await admin.messaging().send({
            topic: topicName,
            notification,
            data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
            }
        });
        console.log(`토픽 ${topicName}으로 푸시 발송됨`);
    }
    catch (error) {
        console.error(`토픽 ${topicName} 푸시 발송 실패:`, error);
        throw error;
    }
}
// 사용자를 토픽에 구독
async function subscribeUserTo(eventId, uid, kind) {
    try {
        const tokens = await getUserTokens(uid);
        if (!tokens.length) {
            console.log(`사용자 ${uid}의 토큰이 없어 토픽 구독을 건너뜁니다`);
            return;
        }
        const topicName = topic(eventId, kind);
        await admin.messaging().subscribeToTopic(tokens, topicName);
        console.log(`사용자 ${uid}을 토픽 ${topicName}에 구독시켰습니다`);
    }
    catch (error) {
        console.error(`사용자 ${uid} 토픽 구독 실패:`, error);
        throw error;
    }
}
// 사용자를 토픽에서 구독 해제
async function unsubscribeUserFrom(eventId, uid, kind) {
    try {
        const tokens = await getUserTokens(uid);
        if (!tokens.length) {
            console.log(`사용자 ${uid}의 토큰이 없어 토픽 구독 해제를 건너뜁니다`);
            return;
        }
        const topicName = topic(eventId, kind);
        await admin.messaging().unsubscribeFromTopic(tokens, topicName);
        console.log(`사용자 ${uid}을 토픽 ${topicName}에서 구독 해제했습니다`);
    }
    catch (error) {
        console.error(`사용자 ${uid} 토픽 구독 해제 실패:`, error);
        throw error;
    }
}
// 참가자 생성 시 토픽 구독
exports.onAttendeeCreateTopic = functions.firestore
    .document('events/{eventId}/attendees/{uid}')
    .onCreate(async (_, ctx) => {
    const { eventId, uid } = ctx.params;
    try {
        await subscribeUserTo(eventId, uid, 'attendee');
    }
    catch (error) {
        console.error(`참가자 ${uid} 토픽 구독 실패:`, error);
    }
});
// 참가자 삭제 시 토픽 구독 해제
exports.onAttendeeDeleteTopic = functions.firestore
    .document('events/{eventId}/attendees/{uid}')
    .onDelete(async (_, ctx) => {
    const { eventId, uid } = ctx.params;
    try {
        await unsubscribeUserFrom(eventId, uid, 'attendee');
    }
    catch (error) {
        console.error(`참가자 ${uid} 토픽 구독 해제 실패:`, error);
    }
});
// 대기자 생성 시 토픽 구독
exports.onWaitlistCreateTopic = functions.firestore
    .document('events/{eventId}/waitlist/{uid}')
    .onCreate(async (_, ctx) => {
    const { eventId, uid } = ctx.params;
    try {
        await subscribeUserTo(eventId, uid, 'waitlist');
    }
    catch (error) {
        console.error(`대기자 ${uid} 토픽 구독 실패:`, error);
    }
});
// 대기자 삭제 시 토픽 구독 해제
exports.onWaitlistDeleteTopic = functions.firestore
    .document('events/{eventId}/waitlist/{uid}')
    .onDelete(async (_, ctx) => {
    const { eventId, uid } = ctx.params;
    try {
        await unsubscribeUserFrom(eventId, uid, 'waitlist');
    }
    catch (error) {
        console.error(`대기자 ${uid} 토픽 구독 해제 실패:`, error);
    }
});
