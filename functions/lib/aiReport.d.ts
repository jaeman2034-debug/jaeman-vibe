/**
 * ?쭬 YAGO VIBE AI ?먮룞 由ы룷???앹꽦 ?쒖뒪?? *
 * 留ㅼ＜ ?붿슂???덈꼍 4??嫄곕옒 ?곗씠?곕? 遺꾩꽍?섏뿬
 * AI媛 ?먮룞?쇰줈 ?먯뿰???붿빟 由ы룷?몃? ?앹꽦?⑸땲??
 */
import * as functions from "firebase-functions";
/**
 * 二쇨컙 AI 嫄곕옒 由ы룷???먮룞 ?앹꽦
 * Cloud Scheduler: 留ㅼ＜ ?붿슂???덈꼍 4??(Asia/Seoul)
 * CRON: 0 4 * * 1
 */
export declare const generateWeeklyReport: any;
/**
 * ?섎룞 AI 由ы룷???앹꽦 (愿由ъ옄??
 */
export declare const generateManualReport: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    totalSales: number;
    avgTrust: number;
    sellerCount: number;
    totalProducts: number;
    aiSummary: any;
}>, unknown>;
//# sourceMappingURL=aiReport.d.ts.map
