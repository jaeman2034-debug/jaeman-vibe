import "./firebaseAdmin";
import "./globalOptions";
export declare const getBlogs: import("firebase-functions/v2/https").HttpsFunction;
export declare const getBlog: import("firebase-functions/v2/https").HttpsFunction;
export declare const createBlog: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    createdAt: Date;
    updatedAt: Date;
    title: string;
    content: string;
    author: string;
    authorName: string;
    id: string;
}>, unknown>;
export declare const updateBlog: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    status: string;
    message: string;
}>, unknown>;
export declare const deleteBlog: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    status: string;
    message: string;
}>, unknown>;
export declare const getComments: ((req: import("firebase-functions/v2/https").Request, res: import("express").Response) => void | Promise<void>) & {
    __trigger?: unknown;
    __endpoint: import("firebase-functions/lib/runtime/manifest").ManifestEndpoint;
};
export declare const createComment: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    createdAt: Date;
    blogId: string;
    content: string;
    author: string;
    authorName: any;
    id: string;
}>, unknown>;
export declare const updateComment: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    status: string;
    message: string;
}>, unknown>;
export declare const deleteComment: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    status: string;
    message: string;
}>, unknown>;
//# sourceMappingURL=blog.d.ts.map
