import * as functions from "firebase-functions";
export declare const updateSellerAnalytics: any;
export declare const refreshSellerAnalytics: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    sellerId: any;
    stats: {
        totalMessages: number;
        aiMessages: number;
        buyerMessages: number;
        aiResponseRate: number;
    };
}>, unknown>;
//# sourceMappingURL=sellerAnalytics.d.ts.map
