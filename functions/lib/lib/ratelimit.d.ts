/**
 * 媛꾨떒???몃찓紐⑤━ ?덉씠??由щ??? * ?⑥씪 ?몄뒪?댁뒪 湲곗??쇰줈 ?숈옉
 */
/**
 * ?덉씠??由щ???泥댄겕 諛??덊듃
 * @param key 怨좎쑀 ??(?? "report:userId:targetType:targetId")
 * @param maxHits 理쒕? ?덉슜 ?잛닔
 * @param windowMs ?쒓컙 ?덈룄??(諛由ъ큹)
 * @returns true if allowed, false if rate limited
 */
export declare function tryHit(key: string, maxHits?: number, windowMs?: number): boolean;
/**
 * ?뱀젙 ?ㅼ쓽 ?덉씠??由щ????곹깭 議고쉶
 */
export declare function getRateLimitStatus(key: string): {
    count: number;
    resetTime: number;
    remaining: number;
} | null;
/**
 * 罹먯떆 ?뺣━ (留뚮즺???뷀듃由??쒓굅)
 */
export declare function cleanupCache(): void;
/**
 * ?뱀젙 ??媛뺤젣 由ъ뀑
 */
export declare function resetKey(key: string): void;
/**
 * ?꾩껜 罹먯떆 珥덇린?? */
export declare function clearCache(): void;
//# sourceMappingURL=ratelimit.d.ts.map
