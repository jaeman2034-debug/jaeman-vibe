import * as functions from 'firebase-functions';
export declare const createStripeSubscriptionCheckout: functions.https.CallableFunction<any, Promise<{
    url: any;
}>, unknown>;
export declare const createStripePortalSession: functions.https.CallableFunction<any, Promise<{
    url: any;
}>, unknown>;
export declare const stripeBillingWebhook: ((req: functions.https.Request, res: import("express").Response) => void | Promise<void>) & {
    __trigger?: unknown;
    __endpoint: import("firebase-functions/lib/runtime/manifest").ManifestEndpoint;
};
//# sourceMappingURL=stripe.billing.d.ts.map
