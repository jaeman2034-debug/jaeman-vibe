import "./_admin";
import * as functions from 'firebase-functions';
export declare const issueTossBillingKey: functions.https.CallableFunction<any, Promise<{
    ok: boolean;
    billingKey: any;
    customerKey: any;
    orderName: string;
}>, unknown>;
export declare const chargeTossBilling: functions.https.CallableFunction<any, Promise<{
    ok: boolean;
    orderId: string;
    amount: number;
    status: string;
}>, unknown>;
export declare const tossBillingWebhook: ((req: functions.https.Request, res: import("express").Response) => void | Promise<void>) & {
    __trigger?: unknown;
    __endpoint: import("firebase-functions/lib/runtime/manifest").ManifestEndpoint;
};
export declare const getTossBillingStatus: functions.https.CallableFunction<any, Promise<{
    hasBillingKey: boolean;
    billingKey?: undefined;
    clubId?: undefined;
    status?: undefined;
    createdAt?: undefined;
} | {
    hasBillingKey: boolean;
    billingKey: any;
    clubId: any;
    status: any;
    createdAt: any;
}>, unknown>;
//# sourceMappingURL=payments.toss.billing.d.ts.map
