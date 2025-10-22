import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
/**
 * ?뵒 FCM 諛쒖넚: 愿由ъ옄??紐⑤뱺 湲곌린??AI 由ы룷???몄떆
 */
export declare const sendAdminReport: functions.https.HttpsFunction;
/**
 * ?븮 ?ㅼ?以?踰꾩쟾 (留ㅼ씪 8??
 */
export declare const scheduleDailyReport: any;
/**
 * ???대씪?댁뼵?몄뿉??FCM ?좏겙??援щ룆?쒗궎???⑥닔
 */
export declare const subscribeAdmin: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    message: string;
}>, unknown>;
/**
 * ?㎦ ?뚯뒪?몄슜 AI 由ы룷??諛쒖넚
 */
export declare const sendTestReport: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    documentId: string;
}>, unknown>;
/**
 * ?뱤 理쒖떊 AI 由ы룷??議고쉶
 */
export declare const getLatestReport: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    report?: undefined;
} | {
    success: boolean;
    report: admin.firestore.DocumentData;
    message?: undefined;
}>, unknown>;
//# sourceMappingURL=index.d.ts.map
