import * as functions from "firebase-functions";
export declare const aiDescribeProduct: functions.https.CallableFunction<any, Promise<{
    title: string;
    description: string;
    category: string;
    features: string;
    success: boolean;
    rawText: any;
}>, unknown>;
//# sourceMappingURL=aiDescribeProduct.d.ts.map
