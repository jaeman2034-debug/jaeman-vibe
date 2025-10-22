/**
 * ?쭬 YAGO VIBE ?먮ℓ???좊ː???먮룞 ?됯? ?쒖뒪?? *
 * 嫄곕옒 ?꾨즺 ???먮룞?쇰줈 ?먮ℓ?먯쓽 ?좊ː?꾨? 怨꾩궛?섏뿬 ?낅뜲?댄듃?⑸땲??
 * ?좊ː??= (?됯퇏 ?됱젏 횞 20) + (嫄곕옒 ?잛닔 횞 2) + (李??곹뼢??
 */
import * as functions from "firebase-functions";
/**
 * 嫄곕옒 ?꾨즺 ???먮ℓ???좊ː???먮룞 媛깆떊
 * marketItems??status媛 "completed"濡?蹂寃쎈릺硫??몃━嫄? */
export declare const updateTrustScore: any;
/**
 * ?먮ℓ???좊ː??議고쉶 (?대씪?댁뼵?몄뿉???몄텧)
 */
export declare const getSellerTrustScore: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    defaultData: {
        trustScore: number;
        totalSales: number;
        avgRating: number;
        completedTransactions: number;
    };
    sellerId?: undefined;
    trustScore?: undefined;
    totalSales?: undefined;
    avgRating?: undefined;
    completedTransactions?: undefined;
    lastActive?: undefined;
} | {
    success: boolean;
    sellerId: any;
    trustScore: any;
    totalSales: any;
    avgRating: any;
    completedTransactions: any;
    lastActive: any;
    message?: undefined;
    defaultData?: undefined;
}>, unknown>;
/**
 * ?곸쐞 ?좊ː???먮ℓ??議고쉶 (愿由ъ옄??
 */
export declare const getTopSellers: functions.https.CallableFunction<any, Promise<{
    success: boolean;
    topSellers: {
        sellerId: string;
    }[];
    count: number;
}>, unknown>;
//# sourceMappingURL=trustScore.d.ts.map
