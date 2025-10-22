import './firebaseAdmin';
import './globalOptions';
export declare const onClubCreated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot | undefined, {
    id: string;
}>>;
export declare const retryCreateTeamBlog: import("firebase-functions/v2/https").CallableFunction<any, Promise<any>, unknown>;
export declare const onClubPublicWrite: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").Change<import("firebase-functions/v2/firestore").QueryDocumentSnapshot> | undefined, {
    clubId: string;
}>>;
export declare const syncClubBlog: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    blogUrl: any;
    provider: any;
    pageId: any;
}>, unknown>;
export declare const approvePublicContrib: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    action: any;
}>, unknown>;
//# sourceMappingURL=teamBlog.d.ts.map
