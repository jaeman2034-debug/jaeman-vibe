import * as functions from 'firebase-functions/v1';
export declare const registerDevice: functions.HttpsFunction & functions.Runnable<any>;
export declare function getUserTokens(uid: string): Promise<string[]>;
export declare function sendToUser(uid: string, notification: {
    title: string;
    body: string;
}, data?: Record<string, string>): Promise<import("firebase-admin/lib/messaging/messaging-api").BatchResponse | undefined>;
export declare function sendToEventAttendees(eventId: string, notification: {
    title: string;
    body: string;
}, data?: Record<string, string>): Promise<void>;
export declare const onAttendeeCreateNotify: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare function saveInboxNotification(uid: string, item: {
    type: string;
    title: string;
    body: string;
    data?: any;
}): Promise<void>;
export declare function sendNotificationWithInbox(uid: string, notification: {
    title: string;
    body: string;
}, data?: Record<string, string>, inboxItem?: {
    type: string;
    title: string;
    body: string;
    data?: any;
}): Promise<void>;
export declare function sendEventNotificationWithInbox(eventId: string, notification: {
    title: string;
    body: string;
}, data?: Record<string, string>, inboxItem?: {
    type: string;
    title: string;
    body: string;
    data?: any;
}): Promise<void>;
export declare function topic(eventId: string, kind: 'announce' | 'attendee' | 'waitlist'): string;
export declare function sendToTopic(topicName: string, notification: {
    title: string;
    body: string;
}, data?: Record<string, string>): Promise<void>;
export declare function subscribeUserTo(eventId: string, uid: string, kind: 'attendee' | 'waitlist'): Promise<void>;
export declare function unsubscribeUserFrom(eventId: string, uid: string, kind: 'attendee' | 'waitlist'): Promise<void>;
export declare const onAttendeeCreateTopic: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const onAttendeeDeleteTopic: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const onWaitlistCreateTopic: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const onWaitlistDeleteTopic: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
//# sourceMappingURL=fcm.d.ts.map
