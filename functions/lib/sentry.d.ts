import * as functions from 'firebase-functions/v1';
export declare const wrapCall: <T>(name: string, fn: (data: any, ctx: functions.https.CallableContext) => Promise<T>) => functions.HttpsFunction & functions.Runnable<any>;
export declare const wrapRun: <T>(name: string, fn: () => Promise<T>) => () => Promise<T>;
//# sourceMappingURL=sentry.d.ts.map
