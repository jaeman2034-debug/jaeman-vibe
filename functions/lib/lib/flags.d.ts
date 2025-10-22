/**
 * Runtime Feature Flags 議고쉶 (60珥?罹먯떆)
 */
export declare function getFlags(): Promise<any>;
/**
 * ?뱀젙 湲곕뒫???쒖꽦?붾릺???덈뒗吏 ?뺤씤
 */
export declare function isEnabled(key: string): Promise<boolean>;
/**
 * 湲곕뒫??鍮꾪솢?깊솕?섏뼱 ?덉쑝硫??먮윭 諛쒖깮
 */
export declare function ensureEnabled(key: string): Promise<void>;
/**
 * 媛쒖씤蹂??ㅽ뿕 湲곕뒫 ?뺤씤
 */
export declare function isUserEnabled(feature: string, uid: string): Promise<boolean>;
/**
 * ?ъ슜?먮퀎 湲곕뒫 ?쒖꽦??(愿由ъ옄 ?꾩슜)
 */
export declare function grantUserFeature(feature: string, uid: string, grantedBy: string): Promise<void>;
/**
 * ?ъ슜?먮퀎 湲곕뒫 鍮꾪솢?깊솕 (愿由ъ옄 ?꾩슜)
 */
export declare function revokeUserFeature(feature: string, uid: string): Promise<void>;
/**
 * ?뚮옒洹??낅뜲?댄듃 (愿由ъ옄 ?꾩슜)
 */
export declare function updateFlag(key: string, value: any, updatedBy: string): Promise<void>;
//# sourceMappingURL=flags.d.ts.map
