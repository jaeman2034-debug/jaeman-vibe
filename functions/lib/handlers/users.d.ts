/**
 * 濡쒓렇???쒓컙 ?낅뜲?댄듃 (?ъ씤利????몄텧)
 */
export declare const touchLogin: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
}>, unknown>;
/**
 * ?ъ슜????븷 ?ㅼ젙 (愿由ъ옄留?
 */
export declare const setRole: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
}>, unknown>;
/**
 * 怨꾩젙 ??젣 ?붿껌
 */
export declare const requestDeletion: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
}>, unknown>;
/**
 * 怨꾩젙 ??젣 ?붿껌 痍⑥냼
 */
export declare const cancelDeletion: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
}>, unknown>;
/**
 * ?ъ슜???꾨줈???낅뜲?댄듃
 */
export declare const updateProfile: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
}>, unknown>;
/**
 * ?ъ슜???듦퀎 議고쉶
 */
export declare const getUserStats: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    stats: {
        itemsSold: number;
        itemsBid: number;
        itemsOrdered: number;
    };
}>, unknown>;
/**
 * ??젣 ?湲?以묒씤 怨꾩젙 ?뺣━ (留ㅼ씪 ?ㅽ뻾)
 */
export declare const purgeDeletedUsers: import("firebase-functions/v2/scheduler").ScheduleFunction;
//# sourceMappingURL=users.d.ts.map
