/**
 * ?뮥 YAGO VIBE ?먮룞 ?뺤궛 ?쒖뒪?? *
 * 留ㅼ씪 ?덈꼍 3??Cloud Scheduler媛 ?먮룞 ?ㅽ뻾
 * settlements 以?status: "ready" ??"payout_done" ?꾪솚
 * ?쇱씪 ?뺤궛 由ы룷?몃? reports 而щ젆?섏뿉 ??? */
import * as functions from "firebase-functions";
/**
 * ?먮룞 ?뺤궛 諛곗튂 ?묒뾽
 * Cloud Scheduler: 留ㅼ씪 ?덈꼍 3??(Asia/Seoul)
 * CRON: 0 3 * * *
 */
export declare const batchSettlement: any;
/**
 * ?섎룞 ?뺤궛 ?몃━嫄?(愿由ъ옄??
 * ?꾩슂 ???섎룞?쇰줈 ?뺤궛 ?ㅽ뻾 媛?? */
export declare const triggerSettlement: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    totalCount: number;
    totalPayout?: undefined;
} | {
    success: boolean;
    message: string;
    totalPayout: number;
    totalCount: number;
}>, unknown>;
/**
 * ?뺤궛 由ы룷??議고쉶 (愿由ъ옄??
 * ?뱀젙 ?좎쭨???뺤궛 由ы룷?몃? 議고쉶
 */
export declare const getSettlementReport: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    date: any;
} | {
    success: boolean;
    date: any;
    message?: undefined;
}>, unknown>;
/**
 * ?붾퀎 ?뺤궛 ?듦퀎 議고쉶 (愿由ъ옄??
 * ?뱀젙 ?붿쓽 ?꾩껜 ?뺤궛 ?듦퀎瑜?議고쉶
 */
export declare const getMonthlySettlement: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    month: any;
    totalPayout: number;
    totalCount: number;
    sellerCount: number;
    topSellers: {
        payout: number;
        count: number;
        sellerId: string;
    }[];
}>, unknown>;
//# sourceMappingURL=settlement.d.ts.map
