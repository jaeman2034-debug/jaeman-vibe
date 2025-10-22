import "../_admin";
export declare const grantRole: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    claims: any;
}>, unknown>;
export declare const bootstrapAdmin: ((req: import("firebase-functions/v2/https").Request, res: import("express").Response) => void | Promise<void>) & {
    __trigger?: unknown;
    __endpoint: import("firebase-functions/lib/runtime/manifest").ManifestEndpoint;
};
export declare const revokeRole: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    claims: any;
}>, unknown>;
export declare const getUserClaims: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    claims: any;
}>, unknown>;
export declare const getRoles: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    ok: boolean;
    roles: any;
}>, unknown>;
//# sourceMappingURL=roles.d.ts.map
