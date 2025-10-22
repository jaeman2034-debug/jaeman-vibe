export type ReportType = 'spam' | 'inappropriate' | 'fraud' | 'harassment' | 'other';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
/**
 * ?좉퀬 ?앹꽦
 */
export declare const createReport: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    reportId: string;
}>, unknown>;
/**
 * ?좉퀬 泥섎━ (愿由ъ옄/紐⑤뜑?덉씠?곕쭔)
 */
export declare const processReport: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
}>, unknown>;
/**
 * ?좉퀬 紐⑸줉 議고쉶 (愿由ъ옄/紐⑤뜑?덉씠?곕쭔)
 */
export declare const getReports: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    reports: {
        id: string;
    }[];
    hasMore: boolean;
}>, unknown>;
/**
 * ?ъ슜???좉퀬 ?댁뿭 議고쉶
 */
export declare const getUserReports: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    reports: {
        id: string;
    }[];
    hasMore: boolean;
}>, unknown>;
//# sourceMappingURL=reports.d.ts.map
