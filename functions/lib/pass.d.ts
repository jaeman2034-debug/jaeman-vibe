import * as functions from 'firebase-functions';
export declare const issueUserPass: functions.https.CallableFunction<any, Promise<{
    token: string;
    exp: number;
}>, unknown>;
export declare const staffConsumeUserPass: functions.https.CallableFunction<any, Promise<{
    ok: boolean;
    uid: string;
    checkedInAt: number;
}>, unknown>;
//# sourceMappingURL=pass.d.ts.map
