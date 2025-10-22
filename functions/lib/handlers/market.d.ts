/**
 * 留덉폆 ?곹뭹 ?깅줉
 */
export declare const createMarketItem: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    id: string;
}>, unknown>;
/**
 * 留덉폆 ?곹뭹 ?곹깭 ?꾩씠
 */
export declare const transitionMarket: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
}>, unknown>;
/**
 * ?낆같/?쒖븞 ?앹꽦
 */
export declare const createOffer: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    id: string;
}>, unknown>;
/**
 * 留덉폆 ?곹뭹 寃?? */
export declare const searchMarketItems: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    items: {
        id: string;
    }[];
    hasMore: boolean;
}>, unknown>;
//# sourceMappingURL=market.d.ts.map
