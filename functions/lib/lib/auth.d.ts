/**
 * 而ㅼ뒪? ?대젅??諛???븷 寃利??좏떥由ы떚
 */
export interface UserClaims {
    role?: string;
    [key: string]: any;
}
/**
 * ?ъ슜?먯뿉寃???븷 ?ㅼ젙
 */
export declare function setUserRole(uid: string, role: string): Promise<void>;
/**
 * ?ъ슜????븷 媛?몄삤湲? */
export declare function getUserRole(uid: string): Promise<string | null>;
/**
 * ?ъ슜?먭? ?뱀젙 ??븷??媛吏怨??덈뒗吏 ?뺤씤
 */
export declare function hasRole(uid: string, role: string): Promise<boolean>;
/**
 * ?ъ슜?먭? 愿由ъ옄?몄? ?뺤씤
 */
export declare function isAdmin(uid: string): Promise<boolean>;
/**
 * ?ъ슜?먭? 紐⑤뜑?덉씠?곗씤吏 ?뺤씤
 */
export declare function isModerator(uid: string): Promise<boolean>;
/**
 * 理쒓렐 濡쒓렇???뺤씤 (???⑥쐞)
 */
export declare function isRecentLogin(authTime: number, days?: number): boolean;
/**
 * ?ъ슜??怨꾩젙 ??젣 ?붿껌 泥섎━
 */
export declare function requestAccountDeletion(uid: string): Promise<void>;
/**
 * 怨꾩젙 ??젣 ?湲?以묒씤 ?ъ슜??紐⑸줉 議고쉶
 */
export declare function getPendingDeletions(olderThanDays?: number): Promise<string[]>;
/**
 * ?ъ슜??怨꾩젙 ?꾩쟾 ??젣
 */
export declare function deleteUserAccount(uid: string): Promise<void>;
//# sourceMappingURL=auth.d.ts.map
