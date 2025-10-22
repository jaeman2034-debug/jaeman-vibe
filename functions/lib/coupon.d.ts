import * as functions from 'firebase-functions/v1';
export declare const upsertCoupon: functions.HttpsFunction & functions.Runnable<any>;
export declare const validateCoupon: functions.HttpsFunction & functions.Runnable<any>;
export declare function consumeCouponIfAny(evId: string, orderId: string, uid: string): Promise<void>;
//# sourceMappingURL=coupon.d.ts.map
