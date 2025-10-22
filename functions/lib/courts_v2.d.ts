export declare const upsertCourt: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    courtId: string;
}>, unknown>;
export declare const assignMatchToCourt: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    assignmentId: string;
    order: number;
}>, unknown>;
export declare const startAssignment: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
}>, unknown>;
export declare const completeAssignment: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
}>, unknown>;
export declare const removeAssignment: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
}>, unknown>;
//# sourceMappingURL=courts_v2.d.ts.map
