import * as functions from 'firebase-functions';
export declare const createSmartCheckout: functions.https.CallableFunction<any, Promise<{
    gateway: string;
    orderId: string;
    checkoutUrl: any;
    currency: any;
    amount: number;
}>, unknown>;
export declare const confirmTossPayment: functions.https.CallableFunction<any, Promise<{
    ok: boolean;
    payment: {
        method: any;
        totalAmount: any;
    };
}>, unknown>;
export declare const confirmStripePayment: functions.https.CallableFunction<any, Promise<{
    ok: boolean;
    alreadyProcessed: boolean;
    payment?: undefined;
} | {
    ok: boolean;
    payment: {
        method: string;
        totalAmount: any;
    };
    alreadyProcessed?: undefined;
}>, unknown>;
//# sourceMappingURL=payments.router.d.ts.map
