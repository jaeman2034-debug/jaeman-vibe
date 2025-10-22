/**
 * ?뱟 YAGO VIBE ?붽컙 由ы룷???먮룞 吏묎퀎 (鍮꾪솢??怨④꺽)
 *
 * ?뵶 ?꾩옱 ?곹깭: 鍮꾪솢??(蹂닿???
 * ???쒖꽦?? functions/src/index.ts?먯꽌 二쇱꽍 ?댁젣留??섎㈃ 利됱떆 ?묐룞
 *
 * 留ㅻ떖 1???덈꼍 4???ㅽ뻾 ??daily_xxx 由ы룷?몃? 紐⑥븘 monthly_xxx ?앹꽦
 */
import * as functions from "firebase-functions";
/**
 * ?붽컙 ?뺤궛 由ы룷???먮룞 吏묎퀎
 * Cloud Scheduler: 留ㅻ떖 1???덈꼍 4??(Asia/Seoul)
 * CRON: 0 4 1 * *
 */
export declare const aggregateMonthlyReport: any;
/**
 * ?섎룞 ?붽컙 由ы룷???앹꽦 (愿由ъ옄??
 * ?뱀젙 ?붿쓽 ?붽컙 由ы룷?몃? ?섎룞?쇰줈 ?앹꽦
 */
export declare const generateMonthlyReport: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    month?: undefined;
    totalPayout?: undefined;
    totalCount?: undefined;
    dayCount?: undefined;
} | {
    success: boolean;
    message: string;
    month: any;
    totalPayout: number;
    totalCount: number;
    dayCount: number;
}>, unknown>;
/**
 * ?붽컙 由ы룷??議고쉶 (愿由ъ옄??
 */
export declare const getMonthlyReport: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    month: any;
} | {
    success: boolean;
    month: any;
    message?: undefined;
}>, unknown>;
//# sourceMappingURL=monthlyReport.d.ts.map
