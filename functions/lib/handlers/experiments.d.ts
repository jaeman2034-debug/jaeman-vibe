import * as admin from 'firebase-admin';
/**
 * ?ъ슜?먯뿉寃??ㅽ뿕 湲곕뒫 遺??(愿由ъ옄 ?꾩슜)
 */
export declare const grantFeature: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    feature: string;
    uid: string;
}>, unknown>;
/**
 * ?ъ슜???ㅽ뿕 湲곕뒫 ?쒓굅 (愿由ъ옄 ?꾩슜)
 */
export declare const revokeFeature: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    feature: string;
    uid: string;
}>, unknown>;
/**
 * ?뚮옒洹??낅뜲?댄듃 (愿由ъ옄 ?꾩슜)
 */
export declare const updateFlag: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    key: string;
    value: any;
}>, unknown>;
/**
 * 紐⑤뱺 ?뚮옒洹?議고쉶 (愿由ъ옄 ?꾩슜)
 */
export declare const getFlags: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    flags: admin.firestore.DocumentData | undefined;
}>, unknown>;
/**
 * ?ㅽ뿕 李멸???紐⑸줉 議고쉶 (愿由ъ옄 ?꾩슜)
 */
export declare const getExperimentUsers: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    feature: string;
    users: {
        uid: string;
    }[];
}>, unknown>;
//# sourceMappingURL=experiments.d.ts.map
