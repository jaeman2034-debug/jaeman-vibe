import * as functions from 'firebase-functions/v1';
export declare const sendChatPush: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const sendTradeCompletePush: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
export declare const sendNewInquiryPush: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const registerFCMToken: functions.HttpsFunction & functions.Runnable<any>;
//# sourceMappingURL=marketFCM.d.ts.map
