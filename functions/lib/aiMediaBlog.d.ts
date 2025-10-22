import * as admin from "firebase-admin";
export declare const aiGenerateClubMedia: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    published: boolean;
    message: string;
    clubId: any;
    title: string;
    content: string;
    content_markdown: string;
    summary: string;
    tags: any[];
    authorUid: string;
    pinned: boolean;
    createdAt: admin.firestore.FieldValue;
    generatedByAI: boolean;
    sport: any;
    imageUrls: string[];
    videoUrl: string | null;
    mediaGenerated: boolean;
    id: string;
} | {
    published: boolean;
    pending: boolean;
    message: string;
    clubId: any;
    title: string;
    content: string;
    content_markdown: string;
    summary: string;
    tags: any[];
    authorUid: string;
    pinned: boolean;
    createdAt: admin.firestore.FieldValue;
    generatedByAI: boolean;
    sport: any;
    imageUrls: string[];
    videoUrl: string | null;
    mediaGenerated: boolean;
    id: string;
}>, unknown>;
export declare const crossPostToNaver: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    naverPostId: any;
    naverUrl: any;
    message: string;
}>, unknown>;
//# sourceMappingURL=aiMediaBlog.d.ts.map
