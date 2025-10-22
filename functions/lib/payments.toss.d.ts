import "./_admin";
import * as functions from 'firebase-functions';
export declare const createTossCheckout: functions.https.CallableFunction<any, Promise<{
    orderId: string;
    checkoutUrl: string;
}>, unknown>;
export declare const confirmTossPayment: functions.https.CallableFunction<any, Promise<{
    ok: boolean;
    payment: {
        method: any;
        totalAmount: any;
    };
}>, unknown>;
export declare const tossWebhook: ((req: functions.https.Request, res: import("express").Response) => void | Promise<void>) & {
    __trigger?: unknown;
    __endpoint: import("firebase-functions/lib/runtime/manifest").ManifestEndpoint;
};
//# sourceMappingURL=payments.toss.d.ts.map
