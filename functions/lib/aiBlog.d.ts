import "./_admin";
export declare const aiGenerateClubBlog: import("firebase-functions/v2/https").CallableFunction<any, Promise<any>, unknown>;
export declare const approvePendingBlog: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    rejected: boolean;
    publishedId?: undefined;
} | {
    ok: boolean;
    publishedId: string;
    rejected?: undefined;
}>, unknown>;
//# sourceMappingURL=aiBlog.d.ts.map
