import * as functions from 'firebase-functions';
export declare const startNext: functions.https.CallableFunction<any, Promise<{
    ok: boolean;
    done: boolean;
    id?: undefined;
} | {
    ok: boolean;
    id: string;
    done?: undefined;
}>, unknown>;
export declare const markDone: functions.https.CallableFunction<any, Promise<{
    ok: boolean;
}>, unknown>;
//# sourceMappingURL=timeline.d.ts.map
