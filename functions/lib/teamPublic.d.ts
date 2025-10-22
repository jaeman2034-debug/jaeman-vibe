import "./firebaseAdmin";
import "./globalOptions";
export declare const onTeamPublicWrite: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").DocumentSnapshot> | undefined, {
    teamId: string;
}>>;
export declare const syncTeamBlog: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    blogUrl: any;
    provider: any;
    providerId: any;
}>, unknown>;
export declare const syncTeamBlogHttp: ((req: import("firebase-functions/v2/https").Request, res: import("express").Response) => void | Promise<void>) & {
    __trigger?: unknown;
    __endpoint: import("firebase-functions/lib/runtime/manifest").ManifestEndpoint;
};
//# sourceMappingURL=teamPublic.d.ts.map
