import * as admin from 'firebase-admin';
/**
 * ?뚯씪??李멸???珥덈? (愿由ъ옄 ?꾩슜)
 */
export declare const pilotInvite: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    uid: string;
}>, unknown>;
/**
 * ?뚯씪??李멸????쒓굅 (愿由ъ옄 ?꾩슜)
 */
export declare const pilotRemove: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    uid: string;
}>, unknown>;
/**
 * ?뚯씪??李멸???紐⑸줉 議고쉶 (愿由ъ옄 ?꾩슜)
 */
export declare const pilotList: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    participants: {
        uid: string;
    }[];
}>, unknown>;
/**
 * ?뚯씪???곹깭 ?뺤씤 (?ъ슜??蹂몄씤)
 */
export declare const pilotStatus: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    isParticipant: boolean;
    participantData: admin.firestore.DocumentData | null | undefined;
}>, unknown>;
//# sourceMappingURL=pilot.d.ts.map
